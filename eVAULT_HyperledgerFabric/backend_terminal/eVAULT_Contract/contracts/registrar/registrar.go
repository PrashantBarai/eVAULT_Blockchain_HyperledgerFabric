package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// Case represents a legal case in the system
type Case struct {
	ID                string        `json:"id"`
	CaseNumber        string        `json:"caseNumber"`
	Title             string        `json:"title"`
	Type              string        `json:"type"`
	Description       string        `json:"description"`
	Status            string        `json:"status"`
	CurrentOrg        string        `json:"currentOrg"`
	UIDParty1         string        `json:"uidParty1"`
	UIDParty2         string        `json:"uidParty2"`
	FiledDate         string        `json:"filedDate"`
	AssociatedLawyers []string      `json:"associatedLawyers"`
	AssociatedJudge   string        `json:"associatedJudge"`
	CaseSubject       string        `json:"caseSubject"`
	ClientName        string        `json:"clientName"`
	Department        string        `json:"department"`
	Documents         []Document    `json:"documents"`
	History           []HistoryItem `json:"history"`
	CreatedBy         string        `json:"createdBy"`
	CreatedAt         string        `json:"createdAt"`
	LastModified      string        `json:"lastModified"`
}

// Document represents a case document
type Document struct {
	ID               string              `json:"id"`
	Name             string              `json:"name"`
	Type             string              `json:"type"`
	Hash             string              `json:"hash"`
	Validated        bool                `json:"validated"`
	UploadedAt       string              `json:"uploadedAt"`
	SignatureHistory []DocumentSignature `json:"signatureHistory"`
}

// DocumentSignature represents a digital signature applied by a stamp reporter
type DocumentSignature struct {
	SignatureHash   string `json:"signatureHash"`
	StampReporterID string `json:"stampReporterId"`
	Timestamp       string `json:"timestamp"`
	Comments        string `json:"comments"`
}

// HistoryItem represents a case status change
type HistoryItem struct {
	Status       string `json:"status"`
	Organization string `json:"organization"`
	Timestamp    string `json:"timestamp"`
	Comments     string `json:"comments"`
}

// RegistrarContract provides functions for managing case assignments
type RegistrarContract struct {
	contractapi.Contract
}

// InitLedger initializes the ledger
func (s *RegistrarContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

// VerifyCase performs basic verification of the case
func (s *RegistrarContract) VerifyCase(ctx contractapi.TransactionContextInterface, caseID string, verificationDetails string) error {
	// Get the case
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return fmt.Errorf("failed to read case: %v", err)
	}
	if caseJSON == nil {
		return fmt.Errorf("case does not exist: %s", caseID)
	}

	var caseObj Case
	err = json.Unmarshal(caseJSON, &caseObj)
	if err != nil {
		return err
	}

	// Parse verification details
	var details struct {
		IsVerified bool   `json:"isVerified"`
		Comments   string `json:"comments"`
		Department string `json:"department"`
	}
	err = json.Unmarshal([]byte(verificationDetails), &details)
	if err != nil {
		return err
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)
	// Update case status based on verification
	if details.IsVerified {
		caseObj.Status = "VERIFIED_BY_REGISTRAR"
		caseObj.Department = details.Department
		// Keep the case in RegistrarsOrg until randomly assigned to a stamp reporter via AssignToStampReporter
		caseObj.CurrentOrg = "RegistrarsOrg"
	} else {
		caseObj.Status = "REJECTED_BY_REGISTRAR"
		caseObj.CurrentOrg = "LawyersOrg" // Send back to lawyer if verification fails
	}

	// Add to history
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       caseObj.Status,
		Organization: "RegistrarsOrg",
		Timestamp:    timestamp,
		Comments:     details.Comments,
	})

	// Save updated case
	caseObj.LastModified = timestamp
	caseJSON, err = json.Marshal(caseObj)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(caseID, caseJSON)
}

// AssignToStampReporter assigns the case to a stamp reporter through random allocation
func (s *RegistrarContract) AssignToStampReporter(ctx contractapi.TransactionContextInterface, caseID string) error {
	// Get the case
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return fmt.Errorf("failed to read case: %v", err)
	}
	if caseJSON == nil {
		return fmt.Errorf("case does not exist: %s", caseID)
	}

	var caseObj Case
	err = json.Unmarshal(caseJSON, &caseObj)
	if err != nil {
		return err
	}

	// Check if case is verified
	if caseObj.Status != "VERIFIED_BY_REGISTRAR" {
		return fmt.Errorf("case must be verified before assignment to stamp reporter")
	}

	// In a real system, random allocation logic would be implemented here
	log.Printf("Randomly assigning case %s to stamp reporters organization", caseID)

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)
	// Update case status and organization
	caseObj.Status = "PENDING_STAMP_REPORTER_REVIEW"
	caseObj.CurrentOrg = "StampReportersOrg"
	// Add history item for the assignment
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       "ASSIGNED_TO_STAMP_REPORTER",
		Organization: "RegistrarsOrg",
		Timestamp:    timestamp,
		Comments:     "Case assigned for document validation through random allocation",
	})

	// Save updated case
	caseObj.LastModified = timestamp
	caseJSON, err = json.Marshal(caseObj)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(caseID, caseJSON)
}

// ReceiveCase handles a case submission from a lawyer
func (s *RegistrarContract) ReceiveCase(ctx contractapi.TransactionContextInterface, caseJSON string) error {
	log.Printf("ReceiveCase called with payload length: %d bytes", len(caseJSON))

	// Parse case data
	var newCase Case
	err := json.Unmarshal([]byte(caseJSON), &newCase)
	if err != nil {
		log.Printf("Failed to unmarshal case data: %v", err)
		log.Printf("Raw JSON (first 200 chars): %.200s", caseJSON)

		// Try to determine if it's a data format issue
		if len(caseJSON) > 0 && caseJSON[0] == '{' {
			log.Printf("JSON appears to be an object, possible structure mismatch")
		} else {
			log.Printf("JSON may not be properly formatted")
		}

		return fmt.Errorf("failed to unmarshal case data: %v", err)
	}
	log.Printf("Successfully parsed case with ID: %s, Title: %s", newCase.ID, newCase.Title)

	// Initialize empty arrays if they are null
	if newCase.Documents == nil {
		newCase.Documents = make([]Document, 0)
	}
	if newCase.History == nil {
		newCase.History = make([]HistoryItem, 0)
	}
	if newCase.AssociatedLawyers == nil {
		newCase.AssociatedLawyers = make([]string, 0)
	}

	// Verify required fields
	if newCase.ID == "" {
		log.Printf("Case ID is required")
		return fmt.Errorf("case ID is required")
	}

	// Verify the case status
	if newCase.Status != "PENDING_REGISTRAR_REVIEW" || newCase.CurrentOrg != "RegistrarsOrg" {
		log.Printf("Invalid case status or organization: status=%s, org=%s", newCase.Status, newCase.CurrentOrg)
		return fmt.Errorf("invalid case status or organization: status=%s, org=%s", newCase.Status, newCase.CurrentOrg)
	}

	log.Printf("Case validation passed, proceeding with save. ID: %s", newCase.ID)

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)
	// Add history item
	newCase.History = append(newCase.History, HistoryItem{
		Status:       "RECEIVED_FROM_LAWYER",
		Organization: "RegistrarsOrg",
		Timestamp:    timestamp,
		Comments:     "Case received from lawyer for review",
	})
	// Save case state
	updatedCaseJSON, err := json.Marshal(newCase)
	if err != nil {
		log.Printf("Failed to marshal updated case: %v", err)
		return err
	}

	log.Printf("Saving case to state. ID: %s, JSON: %s", newCase.ID, updatedCaseJSON)
	err = ctx.GetStub().PutState(newCase.ID, updatedCaseJSON)
	if err != nil {
		log.Printf("Failed to save case: %v", err)
		return err
	}

	log.Printf("Successfully saved case. ID: %s", newCase.ID)
	return nil
}

// GetPendingCases retrieves cases pending registrar action
func (s *RegistrarContract) GetPendingCases(ctx contractapi.TransactionContextInterface, filter string) ([]*Case, error) {
	log.Printf("GetPendingCases called with filter: %s", filter)

	// Check if the filter might be a case ID (doesn't start with '{')
	if len(filter) > 0 && filter[0] != '{' {
		log.Printf("Filter appears to be a case ID, retrieving specific case")
		caseObj, err := s.GetCaseById(ctx, filter)
		if err != nil {
			return nil, err
		}
		return []*Case{caseObj}, nil
	}

	var filterData struct {
		TimeRange  string `json:"timeRange"`
		SearchText string `json:"searchText"`
		CaseType   string `json:"caseType"`
	}
	if err := json.Unmarshal([]byte(filter), &filterData); err != nil {
		log.Printf("Failed to unmarshal filter: %v", err)
		return nil, fmt.Errorf("failed to unmarshal filter: %v", err)
	}
	// Build CouchDB query
	var queryString string
	if filterData.CaseType != "" {
		queryString = fmt.Sprintf(`{
			"selector": {
				"status": "PENDING_REGISTRAR_REVIEW",
				"currentOrg": "RegistrarsOrg",
				"type": "%s"
			}
		}`, filterData.CaseType)
	} else {
		queryString = `{
			"selector": {
				"status": "PENDING_REGISTRAR_REVIEW",
				"currentOrg": "RegistrarsOrg"
			}
		}`
	}

	log.Printf("Executing CouchDB query: %s", queryString)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		log.Printf("Failed to execute query: %v", err)
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer resultsIterator.Close()

	var cases []*Case
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			log.Printf("Error reading next result: %v", err)
			continue
		}

		log.Printf("Found matching case with key %s: %s", queryResponse.Key, queryResponse.Value)
		var caseObj Case
		err = json.Unmarshal(queryResponse.Value, &caseObj)
		if err != nil {
			log.Printf("Failed to unmarshal case %s: %v", queryResponse.Key, err)
			continue
		}

		// Initialize empty arrays if they are null
		if caseObj.Documents == nil {
			caseObj.Documents = make([]Document, 0)
		}
		if caseObj.History == nil {
			caseObj.History = make([]HistoryItem, 0)
		}
		if caseObj.AssociatedLawyers == nil {
			caseObj.AssociatedLawyers = make([]string, 0)
		}

		cases = append(cases, &caseObj)
	}

	log.Printf("Returning %d pending cases", len(cases))
	return cases, nil
}

// GetVerifiedCases retrieves cases that have been verified and need stamp reporter assignment
func (s *RegistrarContract) GetVerifiedCases(ctx contractapi.TransactionContextInterface, filter string) ([]*Case, error) {
	var filterData struct {
		TimeRange  string `json:"timeRange"` // Today, ThisWeek, ThisMonth
		Department string `json:"department"`
		SearchText string `json:"searchText"`
	}
	err := json.Unmarshal([]byte(filter), &filterData)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal filter: %v", err)
	}

	// Build query based on filters
	var queryString string
	if filterData.Department != "" {
		queryString = fmt.Sprintf(`{
            "selector": {
                "status": "VERIFIED_BY_REGISTRAR",
                "currentOrg": "RegistrarsOrg",
                "department": "%s"
            }
        }`, filterData.Department)
	} else {
		queryString = `{
            "selector": {
                "status": "VERIFIED_BY_REGISTRAR",
                "currentOrg": "RegistrarsOrg"
            }
        }`
	}

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var cases []*Case
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var caseObj Case
		err = json.Unmarshal(queryResponse.Value, &caseObj)
		if err != nil {
			return nil, err
		}

		// Initialize empty arrays if they are null
		if caseObj.Documents == nil {
			caseObj.Documents = make([]Document, 0)
		}
		if caseObj.History == nil {
			caseObj.History = make([]HistoryItem, 0)
		}
		if caseObj.AssociatedLawyers == nil {
			caseObj.AssociatedLawyers = make([]string, 0)
		}

		cases = append(cases, &caseObj)
	}

	return cases, nil
}

// GetAllState retrieves all data in the state for debugging
func (s *RegistrarContract) GetAllState(ctx contractapi.TransactionContextInterface) (string, error) {
	// Get all keys in the state
	iterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return "", fmt.Errorf("failed to get state range: %v", err)
	}
	defer iterator.Close()

	var allData []map[string]interface{}
	for iterator.HasNext() {
		response, err := iterator.Next()
		if err != nil {
			continue
		}

		var valueMap map[string]interface{}
		if err = json.Unmarshal(response.Value, &valueMap); err != nil {
			// If unmarshal fails, include raw data
			allData = append(allData, map[string]interface{}{
				"key":       response.Key,
				"raw_value": string(response.Value),
			})
		} else {
			// Add key to the value map
			valueMap["key"] = response.Key
			allData = append(allData, valueMap)
		}
	}

	// Convert to JSON
	dataJSON, err := json.Marshal(allData)
	if err != nil {
		return "", err
	}

	return string(dataJSON), nil
}

// QueryStats gets statistics for registrar dashboard
func (s *RegistrarContract) QueryStats(ctx contractapi.TransactionContextInterface) (string, error) {
	stats := struct {
		PendingCases     int `json:"pendingCases"`
		VerifiedCases    int `json:"verifiedCases"`
		RejectedCases    int `json:"rejectedCases"`
		AssignedToStamp  int `json:"assignedToStamp"`
		TransferredCases int `json:"transferredCases"`
	}{}

	// Count pending cases
	pendingIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"PENDING_REGISTRAR_REVIEW","currentOrg":"RegistrarsOrg"}}`)
	if err == nil {
		for pendingIterator.HasNext() {
			stats.PendingCases++
			_, _ = pendingIterator.Next()
		}
		pendingIterator.Close()
	}
	// Count verified cases
	verifiedIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"VERIFIED_BY_REGISTRAR","currentOrg":"RegistrarsOrg"}}`)
	if err == nil {
		for verifiedIterator.HasNext() {
			stats.VerifiedCases++
			_, _ = verifiedIterator.Next()
		}
		verifiedIterator.Close()
	}

	// Also count cases that have been transferred but show as verified in this channel
	transferredIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"TRANSFERRED_TO_STAMPREPORTER","currentOrg":"StampReportersOrg"}}`)
	if err == nil {
		for transferredIterator.HasNext() {
			stats.TransferredCases++
			_, _ = transferredIterator.Next()
		}
		transferredIterator.Close()
	}

	// Count rejected cases
	rejectedIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"REJECTED_BY_REGISTRAR","currentOrg":"LawyersOrg"}}`)
	if err == nil {
		for rejectedIterator.HasNext() {
			stats.RejectedCases++
			_, _ = rejectedIterator.Next()
		}
		rejectedIterator.Close()
	}
	// Count cases assigned/transferred to stamp reporter
	// We need to check both channels
	// First check the current channel
	assignedIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"PENDING_STAMP_REPORTER_REVIEW","currentOrg":"StampReportersOrg"}}`)
	if err == nil {
		for assignedIterator.HasNext() {
			stats.AssignedToStamp++
			_, _ = assignedIterator.Next()
		}
		assignedIterator.Close()
	} // Also count transferred cases in this channel
	transferredIterator3, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"TRANSFERRED_TO_STAMPREPORTER","currentOrg":"StampReportersOrg"}}`)
	if err == nil {
		for transferredIterator3.HasNext() {
			stats.TransferredCases++
			_, _ = transferredIterator3.Next()
		}
		transferredIterator3.Close()
	}

	// If we're on the lawyer-registrar channel, check for cross-channel invocations to the lawyer channel
	crossChannelArgs := [][]byte{[]byte("QueryStats"), []byte("{}")}
	crossChannelResponse := ctx.GetStub().InvokeChaincode("registrar", crossChannelArgs, "registrar-stampreporter-channel")
	if crossChannelResponse.Status == 200 {
		// Try to parse the cross-channel stats
		var crossStats struct {
			AssignedToStamp  int `json:"assignedToStamp"`
			TransferredCases int `json:"transferredCases"`
		}
		if err := json.Unmarshal(crossChannelResponse.Payload, &crossStats); err == nil {
			// Add the cross-channel stats to our count
			log.Printf("Found %d assigned cases and %d transferred cases in registrar-stampreporter-channel",
				crossStats.AssignedToStamp, crossStats.TransferredCases)
			stats.AssignedToStamp += crossStats.AssignedToStamp
		}
	}

	// Convert stats to JSON
	statsJSON, err := json.Marshal(stats)
	if err != nil {
		return "", err
	}

	return string(statsJSON), nil
}

// TestJSONParsing is a test function to verify JSON parsing functionality
func (s *RegistrarContract) TestJSONParsing(ctx contractapi.TransactionContextInterface, caseJSON string) (string, error) {
	log.Printf("TestJSONParsing called with JSON: %s", caseJSON)

	var caseObj Case
	err := json.Unmarshal([]byte(caseJSON), &caseObj)
	if err != nil {
		log.Printf("Failed to parse JSON: %v", err)
		return "", fmt.Errorf("failed to parse JSON: %v", err)
	}

	log.Printf("Successfully parsed JSON into Case object: %+v", caseObj)
	return fmt.Sprintf("Successfully parsed case with ID: %s, Title: %s", caseObj.ID, caseObj.Title), nil
}

// GetCaseById retrieves a specific case by its ID
func (s *RegistrarContract) GetCaseById(ctx contractapi.TransactionContextInterface, caseID string) (*Case, error) {
	log.Printf("GetCaseById called with ID: %s", caseID)

	// Get the case
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		log.Printf("Failed to read case: %v", err)
		return nil, fmt.Errorf("failed to read case: %v", err)
	}
	if caseJSON == nil {
		log.Printf("Case not found: %s", caseID)
		return nil, fmt.Errorf("case not found: %s", caseID)
	}

	var caseObj Case
	err = json.Unmarshal(caseJSON, &caseObj)
	if err != nil {
		log.Printf("Failed to unmarshal case: %v", err)
		return nil, fmt.Errorf("failed to unmarshal case: %v", err)
	}

	// Initialize empty arrays if they are null
	if caseObj.Documents == nil {
		caseObj.Documents = make([]Document, 0)
	}
	if caseObj.History == nil {
		caseObj.History = make([]HistoryItem, 0)
	}
	if caseObj.AssociatedLawyers == nil {
		caseObj.AssociatedLawyers = make([]string, 0)
	}

	log.Printf("Successfully retrieved case with ID: %s", caseID)
	return &caseObj, nil
}

// GetState is a simple wrapper around the GetState function of the chaincode stub
// This is useful for cross-channel invocations where we want to get raw state data
func (s *RegistrarContract) GetState(ctx contractapi.TransactionContextInterface, key string) ([]byte, error) {
	log.Printf("GetState called with key: %s", key)

	// Simply delegate to the stub's GetState function
	data, err := ctx.GetStub().GetState(key)
	if err != nil {
		log.Printf("Failed to get state for key %s: %v", key, err)
		return nil, fmt.Errorf("failed to get state for key %s: %v", key, err)
	}

	if data == nil {
		log.Printf("No state found for key: %s", key)
		return nil, fmt.Errorf("no state found for key: %s", key)
	}

	log.Printf("Successfully retrieved state for key: %s (length: %d bytes)", key, len(data))
	return data, nil
}

// PutState is a simple wrapper around the PutState function of the chaincode stub
// This is useful for cross-channel invocations where we want to update state data
func (s *RegistrarContract) PutState(ctx contractapi.TransactionContextInterface, key string, value []byte) error {
	log.Printf("PutState called with key: %s, value length: %d bytes", key, len(value))

	// Simply delegate to the stub's PutState function
	err := ctx.GetStub().PutState(key, value)
	if err != nil {
		log.Printf("Failed to put state for key %s: %v", key, err)
		return fmt.Errorf("failed to put state for key %s: %v", key, err)
	}

	log.Printf("Successfully put state for key: %s", key)
	return nil
}

// UpdateCase updates an existing case in the ledger
func (s *RegistrarContract) UpdateCase(ctx contractapi.TransactionContextInterface, caseID string, caseJSON string) error {
	log.Printf("UpdateCase called for case ID: %s", caseID)

	// Check if case exists
	existingCase, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return fmt.Errorf("failed to read case: %v", err)
	}
	if existingCase == nil {
		return fmt.Errorf("case does not exist: %s", caseID)
	}

	// Update the case with new data
	err = ctx.GetStub().PutState(caseID, []byte(caseJSON))
	if err != nil {
		return fmt.Errorf("failed to update case: %v", err)
	}

	log.Printf("Case %s successfully updated", caseID)
	return nil
}

func main() {
	registrarChaincode, err := contractapi.NewChaincode(&RegistrarContract{})
	if err != nil {
		log.Panicf("Error creating registrar chaincode: %v", err)
	}

	if err := registrarChaincode.Start(); err != nil {
		log.Panicf("Error starting registrar chaincode: %v", err)
	}
}

// FetchAndStoreCaseFromLawyerChannel fetches a case from lawyer-registrar-channel and stores it on registrar-stampreporter-channel
// in a single transaction, then assigns it to stamp reporter
func (s *RegistrarContract) FetchAndStoreCaseFromLawyerChannel(ctx contractapi.TransactionContextInterface, caseID string) error {
	log.Printf("FetchAndStoreCaseFromLawyerChannel called for case ID: %s", caseID)

	// Get case directly from the chain to see if it exists before making cross-channel calls
	existingCase, _ := ctx.GetStub().GetState(caseID)
	if existingCase != nil {
		log.Printf("Case %s already exists on registrar-stampreporter-channel, proceeding with assignment", caseID)
		// If case exists, just assign it to stamp reporter
		return s.AssignToStampReporter(ctx, caseID)
	}

	// Instead of using GetState which returns just a string, we'll create a custom function for cross-channel
	// that returns an array to meet the expected schema
	args := [][]byte{[]byte("GetCaseById"), []byte(caseID)}

	// Step 1: Read from the lawyer-registrar-channel
	log.Printf("Invoking GetCaseById on lawyer-registrar-channel for case ID: %s", caseID)
	response := ctx.GetStub().InvokeChaincode("registrar", args, "lawyer-registrar-channel")

	// Check the response status - 200 is OK in contractapi
	if response.Status != 200 {
		errMsg := fmt.Sprintf("Failed to fetch case from lawyer-registrar-channel: %s", string(response.Message))
		log.Printf(errMsg)
		return fmt.Errorf(errMsg)
	}
	// Check if payload is empty
	if response.Payload == nil || len(response.Payload) == 0 {
		errMsg := fmt.Sprintf("Case data not found on lawyer-registrar-channel for ID: %s", caseID)
		log.Printf(errMsg)
		return fmt.Errorf(errMsg)
	}

	log.Printf("Successfully received response from lawyer-registrar-channel, response length: %d bytes", len(response.Payload))
	// Parse the response
	var caseObj Case
	err := json.Unmarshal(response.Payload, &caseObj)
	if err != nil {
		log.Printf("Failed to unmarshal case data: %v", err)
		return fmt.Errorf("failed to unmarshal case data: %v", err)
	}

	log.Printf("Successfully parsed case with ID: %s, Title: %s", caseObj.ID, caseObj.Title)

	// Ensure case has a valid ID before proceeding
	if caseObj.ID == "" {
		errMsg := "Invalid case data: Missing ID field"
		log.Printf(errMsg)
		return fmt.Errorf(errMsg)
	}
	// Update lawyer-registrar-channel with the transferred status
	log.Printf("Updating case status on lawyer-registrar-channel to TRANSFERRED_TO_STAMPREPORTER")

	// Create a new history item for the transfer
	txTimestampForTransfer, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		log.Printf("Failed to get transaction timestamp: %v", err)
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestampForTransfer := time.Unix(txTimestampForTransfer.Seconds, 0).Format(time.RFC3339)
	// Direct modification of the case object
	lawyerChannelCase := caseObj
	lawyerChannelCase.Status = "TRANSFERRED_TO_STAMPREPORTER"
	lawyerChannelCase.CurrentOrg = "StampReportersOrg"
	lawyerChannelCase.LastModified = timestampForTransfer

	// Add history item for the transfer
	lawyerChannelCase.History = append(lawyerChannelCase.History, HistoryItem{
		Status:       "TRANSFERRED_TO_STAMPREPORTER",
		Organization: "RegistrarsOrg",
		Timestamp:    timestampForTransfer,
		Comments:     "Case transferred to registrar-stampreporter-channel",
	}) // Update the lawyer channel with new status
	lawyerCaseJSON, err := json.Marshal(lawyerChannelCase)
	if err != nil {
		log.Printf("Failed to marshal case for lawyer channel update: %v", err)
		// Continue with the process even if this update fails
	} else {
		// Directly modify the state on the lawyer-registrar-channel using a separate transaction
		log.Printf("Updating case on lawyer-registrar-channel with new status TRANSFERRED_TO_STAMPREPORTER")

		// We need to pass the JSON as a string for UpdateCase
		jsonStr := string(lawyerCaseJSON)

		// First, log the full JSON we're sending for update
		log.Printf("Updating case on lawyer-registrar-channel with JSON: %s", jsonStr)

		// Try with UpdateCase first - this is more likely to work across organizations
		updateArgs := [][]byte{[]byte("UpdateCase"), []byte(caseID), []byte(jsonStr)}
		updateResponse := ctx.GetStub().InvokeChaincode("registrar", updateArgs, "lawyer-registrar-channel")

		if updateResponse.Status == 200 {
			log.Printf("Successfully updated case status on lawyer-registrar-channel to TRANSFERRED_TO_STAMPREPORTER")
		} else {
			// Try with PutState as fallback
			putStateArgs := [][]byte{[]byte("PutState"), []byte(caseID), lawyerCaseJSON}
			updateResponse = ctx.GetStub().InvokeChaincode("registrar", putStateArgs, "lawyer-registrar-channel")

			if updateResponse.Status == 200 {
				log.Printf("Successfully updated case status on lawyer-registrar-channel to TRANSFERRED_TO_STAMPREPORTER using fallback method")
			} else {
				log.Printf("Warning: Failed to update case status on lawyer-registrar-channel: %s", string(updateResponse.Message))
				log.Printf("Will continue with the transfer anyway, but lawyer-registrar-channel may not show the correct status")
			}
		}
	}

	// Update status and organization for this channel
	caseObj.Status = "VERIFIED_BY_REGISTRAR"
	caseObj.CurrentOrg = "RegistrarsOrg"

	// Add a history entry about the transfer
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		log.Printf("Failed to get transaction timestamp: %v", err)
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Initialize any null arrays to avoid null pointer exceptions
	if caseObj.Documents == nil {
		caseObj.Documents = make([]Document, 0)
	}
	if caseObj.History == nil {
		caseObj.History = make([]HistoryItem, 0)
	}
	if caseObj.AssociatedLawyers == nil {
		caseObj.AssociatedLawyers = make([]string, 0)
	}

	historyItem := HistoryItem{
		Status:       "VERIFIED_BY_REGISTRAR",
		Organization: "RegistrarsOrg",
		Timestamp:    timestamp,
		Comments:     "Case transferred from lawyer-registrar-channel to registrar-stampreporter-channel",
	}

	caseObj.History = append(caseObj.History, historyItem)

	// Update last modified time
	caseObj.LastModified = timestamp
	// Step 2: Store the case on this channel (registrar-stampreporter-channel)
	updatedCaseJSON, err := json.Marshal(caseObj)
	if err != nil {
		log.Printf("Failed to marshal updated case: %v", err)
		return fmt.Errorf("failed to marshal updated case: %v", err)
	}

	log.Printf("Storing case %s on registrar-stampreporter-channel", caseID)
	// Store the case on the current channel
	err = ctx.GetStub().PutState(caseID, updatedCaseJSON)
	if err != nil {
		log.Printf("Failed to store case on current channel: %v", err)
		return fmt.Errorf("failed to store case on current channel: %v", err)
	}

	// Give it a moment to be committed
	log.Printf("Case stored, proceeding with assignment")
	// For debugging, log the JSON being stored
	log.Printf("Stored case JSON: %s", string(updatedCaseJSON))

	log.Printf("Case %s successfully stored on registrar-stampreporter-channel", caseID)

	// Also copy the case to the StampReporter chaincode's state
	syncArgs := [][]byte{[]byte("StoreCase"), []byte(string(updatedCaseJSON))}
	syncResponse := ctx.GetStub().InvokeChaincode("stampreporter", syncArgs, "registrar-stampreporter-channel")
	if syncResponse.Status != 200 {
		log.Printf("Warning: Failed to sync case to stampreporter chaincode: %s", string(syncResponse.Message))
		log.Printf("The stampreporter chaincode may not be able to see this case. Continuing with assignment...")
	} else {
		log.Printf("Successfully synced case to stampreporter chaincode")
	}

	// Now assign it to stamp reporter - instead of calling AssignToStampReporter, we'll implement the logic here
	// to avoid any issues with the transaction context
	// We can use the caseObj we already have since we've already parsed it

	// Check if case is verified
	if caseObj.Status != "VERIFIED_BY_REGISTRAR" {
		errMsg := fmt.Sprintf("case must be verified before assignment to stamp reporter, current status: %s", caseObj.Status)
		log.Printf(errMsg)
		return fmt.Errorf(errMsg)
	}

	// In a real system, random allocation logic would be implemented here
	log.Printf("Randomly assigning case %s to stamp reporters organization", caseID)

	// Get current timestamp again for the assignment
	txTimestamp, err = ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestampForAssignment := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Update case status and organization for assignment
	caseObj.Status = "PENDING_STAMP_REPORTER_REVIEW"
	caseObj.CurrentOrg = "StampReportersOrg"

	// Add history item for the assignment
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       "ASSIGNED_TO_STAMP_REPORTER",
		Organization: "RegistrarsOrg",
		Timestamp:    timestampForAssignment,
		Comments:     "Case assigned for document validation through random allocation",
	})

	// Save updated case with stamp reporter assignment
	caseObj.LastModified = timestampForAssignment
	assignedCaseJSON, err := json.Marshal(caseObj)
	if err != nil {
		log.Printf("Failed to marshal assigned case: %v", err)
		return fmt.Errorf("failed to marshal assigned case: %v", err)
	}

	// Update the state
	err = ctx.GetStub().PutState(caseID, assignedCaseJSON)
	if err != nil {
		log.Printf("Failed to store assigned case: %v", err)
		return fmt.Errorf("failed to store assigned case: %v", err)
	}

	// Also update the case in StampReporter chaincode with assigned status
	assignSyncArgs := [][]byte{[]byte("StoreCase"), []byte(string(assignedCaseJSON))}
	assignSyncResponse := ctx.GetStub().InvokeChaincode("stampreporter", assignSyncArgs, "registrar-stampreporter-channel")
	if assignSyncResponse.Status != 200 {
		log.Printf("Warning: Failed to sync assigned status to stampreporter chaincode: %s", string(assignSyncResponse.Message))
	} else {
		log.Printf("Successfully synced assigned status to stampreporter chaincode")
	}

	log.Printf("Case %s successfully transferred and assigned to stamp reporter", caseID)
	return nil
}
