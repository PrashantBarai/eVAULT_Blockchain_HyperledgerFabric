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

// ValidationRequest represents a document validation request
type ValidationRequest struct {
	DocumentID    string `json:"documentId"`
	SignatureHash string `json:"signatureHash"`
	Comments      string `json:"comments"`
}

// StampReporterContract provides functions for document validation
type StampReporterContract struct {
	contractapi.Contract
}

// InitLedger initializes the ledger
func (s *StampReporterContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

// ValidateDocuments validates case documents and provides digital signature
func (s *StampReporterContract) ValidateDocuments(ctx contractapi.TransactionContextInterface, caseID string, validationDetails string) error {
	log.Printf("ValidateDocuments called for case ID: %s", caseID)

	// Get the case
	var caseObj Case
	var err error

	// Try to get the case from the local ledger
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		log.Printf("Failed to read case: %v", err)
		return fmt.Errorf("failed to read case: %v", err)
	}

	if caseJSON == nil {
		// Case doesn't exist locally, try to fetch it from registrar-stampreporter-channel
		log.Printf("Case %s not found locally, attempting to fetch from registrar-stampreporter-channel", caseID)
		fetchedCase, err := s.FetchAndStoreCaseFromRegistrarChannel(ctx, caseID)
		if err != nil {
			log.Printf("Failed to fetch case from registrar: %v", err)
			return fmt.Errorf("case does not exist: %s", caseID)
		}
		caseObj = *fetchedCase
	} else {
		// Case exists locally, unmarshal it
		err = json.Unmarshal(caseJSON, &caseObj)
		if err != nil {
			log.Printf("Failed to unmarshal case data: %v", err)
			return err
		}
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

	// Parse validation details
	var details struct {
		IsValid         bool                `json:"isValid"`
		Comments        string              `json:"comments"`
		Validations     []ValidationRequest `json:"validations"`
		StampReporterID string              `json:"stampReporterId"`
		RejectionReason string              `json:"rejectionReason,omitempty"`
	}
	err = json.Unmarshal([]byte(validationDetails), &details)
	if err != nil {
		return err
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Update document validations
	for _, validation := range details.Validations {
		docFound := false
		for i := range caseObj.Documents {
			if caseObj.Documents[i].ID == validation.DocumentID {
				// Add new signature to history
				newSignature := DocumentSignature{
					SignatureHash:   validation.SignatureHash,
					StampReporterID: details.StampReporterID,
					Timestamp:       timestamp,
					Comments:        validation.Comments,
				}

				// Initialize SignatureHistory if nil
				if caseObj.Documents[i].SignatureHistory == nil {
					caseObj.Documents[i].SignatureHistory = make([]DocumentSignature, 0)
				}

				caseObj.Documents[i].SignatureHistory = append(caseObj.Documents[i].SignatureHistory, newSignature)
				caseObj.Documents[i].Validated = true
				caseObj.Documents[i].Hash = validation.SignatureHash // Keep latest signature in main hash field
				docFound = true
			}
		}
		if !docFound {
			return fmt.Errorf("document not found: %s", validation.DocumentID)
		}
	}

	// Update case status based on validation
	if details.IsValid {
		caseObj.Status = "VALIDATED_BY_STAMP_REPORTER"
		caseObj.CurrentOrg = "BenchClerksOrg"
	} else {
		caseObj.Status = "REJECTED_BY_STAMP_REPORTER"
		caseObj.CurrentOrg = "LawyersOrg"
	}

	// Add to history
	historyComment := details.Comments
	if !details.IsValid && details.RejectionReason != "" {
		historyComment = fmt.Sprintf("Rejected: %s", details.RejectionReason)
	}

	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       caseObj.Status,
		Organization: "StampReportersOrg",
		Timestamp:    timestamp,
		Comments:     fmt.Sprintf("%s (by Stamp Reporter %s)", historyComment, details.StampReporterID),
	})

	// Save updated case
	caseObj.LastModified = timestamp
	caseJSON, err = json.Marshal(caseObj)
	if err != nil {
		return err
	}

	// Store the case in StampReporter's ledger
	err = ctx.GetStub().PutState(caseID, caseJSON)
	if err != nil {
		log.Printf("Failed to store validated case in StampReporter's ledger: %v", err)
		return err
	}
	log.Printf("Successfully stored validated case %s in StampReporter's ledger", caseID)

	return nil
}

// GetPendingCases retrieves cases pending stamp reporter validation
func (s *StampReporterContract) GetPendingCases(ctx contractapi.TransactionContextInterface) ([]*Case, error) {
	log.Printf("GetPendingCases called")

	queryString := `{
        "selector": {
            "status": "PENDING_STAMP_REPORTER_REVIEW",
            "currentOrg": "StampReportersOrg"
        }
    }`

	log.Printf("Executing query: %s", queryString)
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		log.Printf("Query failed: %v", err)
		return nil, err
	}
	defer resultsIterator.Close()

	var cases []*Case
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			log.Printf("Error reading next result: %v", err)
			return nil, err
		}

		var caseObj Case
		err = json.Unmarshal(queryResponse.Value, &caseObj)
		if err != nil {
			log.Printf("Failed to unmarshal case: %v", err)
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

// GetCaseById retrieves a specific case by its ID
func (s *StampReporterContract) GetCaseById(ctx contractapi.TransactionContextInterface, caseID string) (*Case, error) {
	log.Printf("GetCaseById called with ID: %s", caseID)

	// Get the case locally first
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		log.Printf("Failed to read case: %v", err)
		return nil, fmt.Errorf("failed to read case: %v", err)
	}

	// If case doesn't exist locally, try to fetch it from registrar-stampreporter-channel
	if caseJSON == nil {
		log.Printf("Case %s not found locally, attempting to fetch from registrar-stampreporter-channel", caseID)
		return s.FetchAndStoreCaseFromRegistrarChannel(ctx, caseID)
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

// QueryStats gets statistics for stamp reporter dashboard
func (s *StampReporterContract) QueryStats(ctx contractapi.TransactionContextInterface) (string, error) {
	log.Printf("QueryStats called")

	stats := struct {
		PendingCases   int `json:"pendingCases"`
		ValidatedCases int `json:"validatedCases"`
		RejectedCases  int `json:"rejectedCases"`
	}{}

	// Count pending cases
	pendingIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"PENDING_STAMP_REPORTER_REVIEW","currentOrg":"StampReportersOrg"}}`)
	if err == nil {
		for pendingIterator.HasNext() {
			stats.PendingCases++
			_, _ = pendingIterator.Next()
		}
		pendingIterator.Close()
	}

	// Count validated cases
	validatedIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"VALIDATED_BY_STAMP_REPORTER","currentOrg":"BenchClerksOrg"}}`)
	if err == nil {
		for validatedIterator.HasNext() {
			stats.ValidatedCases++
			_, _ = validatedIterator.Next()
		}
		validatedIterator.Close()
	}

	// Count rejected cases
	rejectedIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"REJECTED_BY_STAMP_REPORTER","currentOrg":"LawyersOrg"}}`)
	if err == nil {
		for rejectedIterator.HasNext() {
			stats.RejectedCases++
			_, _ = rejectedIterator.Next()
		}
		rejectedIterator.Close()
	}

	// Convert stats to JSON
	statsJSON, err := json.Marshal(stats)
	if err != nil {
		log.Printf("Failed to marshal stats: %v", err)
		return "", fmt.Errorf("failed to marshal stats: %v", err)
	}

	log.Printf("Statistics: %s", string(statsJSON))
	return string(statsJSON), nil
}

// ForwardCaseToBenchClerk fetches a case from registrar-stampreporter-channel and forwards it to BenchClerk's channel
func (s *StampReporterContract) ForwardCaseToBenchClerk(ctx contractapi.TransactionContextInterface, caseID string) error {
	log.Printf("ForwardCaseToBenchClerk called for case ID: %s", caseID)

	// Get MSP ID of the submitting client
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Only StampReportersOrg members should call this function
	if clientOrgID != "StampReportersOrg" && clientOrgID != "StampReportersOrgMSP" {
		return fmt.Errorf("this function can only be called by members of StampReportersOrg")
	}

	// Try to get the case from Stamp Reporter's ledger first
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return fmt.Errorf("failed to read case: %v", err)
	}

	var caseObj Case
	if caseJSON == nil {
		// Case doesn't exist locally, try to fetch it from registrar-stampreporter-channel
		log.Printf("Case %s not found locally, attempting to fetch from registrar-stampreporter-channel", caseID)
		fetchedCase, err := s.FetchAndStoreCaseFromRegistrarChannel(ctx, caseID)
		if err != nil {
			return fmt.Errorf("failed to fetch case from registrar-stampreporter-channel: %v", err)
		}
		caseObj = *fetchedCase
	} else {
		// Case exists locally, unmarshal it
		err = json.Unmarshal(caseJSON, &caseObj)
		if err != nil {
			return fmt.Errorf("failed to unmarshal case data: %v", err)
		}
	}

	// Verify case status - only forward cases that have been validated
	if caseObj.Status != "VALIDATED_BY_STAMP_REPORTER" {
		return fmt.Errorf("case status must be VALIDATED_BY_STAMP_REPORTER for forwarding to BenchClerk, current status: %s", caseObj.Status)
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Update case status for forwarding to bench clerk
	caseObj.Status = "FORWARDED_TO_BENCHCLERK"
	caseObj.CurrentOrg = "BenchClerksOrg"
	caseObj.LastModified = timestamp

	// Add history item
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       "FORWARDED_TO_BENCHCLERK",
		Organization: "StampReportersOrg",
		Timestamp:    timestamp,
		Comments:     "Case validated and forwarded to BenchClerk",
	})

	// Marshal the updated case data
	updatedCaseJSON, err := json.Marshal(caseObj)
	if err != nil {
		return fmt.Errorf("failed to marshal updated case data: %v", err)
	}

	// Update case in Stamp Reporter's ledger
	err = ctx.GetStub().PutState(caseID, updatedCaseJSON)
	if err != nil {
		return fmt.Errorf("failed to update case in Stamp Reporter's ledger: %v", err)
	}

	// Forward the case to BenchClerk through cross-channel invocation
	// Convert the JSON byte array to string as the BenchClerk expects a string parameter
	caseJSONStr := string(updatedCaseJSON)
	args := [][]byte{[]byte("StoreCase"), []byte(caseJSONStr)}
	response := ctx.GetStub().InvokeChaincode("benchclerk", args, "stampreporter-benchclerk-channel")

	// Check if the BenchClerk chaincode response is successful
	if response.Status != 200 {
		errMsg := fmt.Sprintf("Failed to forward case to BenchClerk: %s", string(response.Message))
		log.Printf(errMsg)

		// Revert the status change in case of failure
		caseObj.Status = "VALIDATED_BY_STAMP_REPORTER"
		caseObj.CurrentOrg = "StampReportersOrg"
		revertJSON, _ := json.Marshal(caseObj)
		ctx.GetStub().PutState(caseID, revertJSON)

		return fmt.Errorf(errMsg)
	}

	log.Printf("Successfully forwarded case %s to BenchClerk", caseID)
	return nil
}

// ForwardCaseToLawyer forwards a rejected or on-hold case from StampReporter to Lawyer
func (s *StampReporterContract) ForwardCaseToLawyer(ctx contractapi.TransactionContextInterface, caseID string) error {
	log.Printf("ForwardCaseToLawyer called for case ID: %s", caseID)

	// Get MSP ID of the submitting client
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	// Only StampReportersOrg members should call this function
	if clientOrgID != "StampReportersOrg" && clientOrgID != "StampReportersOrgMSP" {
		return fmt.Errorf("this function can only be called by members of StampReportersOrg")
	}

	// Try to get the case from Stamp Reporter's ledger first
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return fmt.Errorf("failed to read case: %v", err)
	}

	var caseObj Case
	if caseJSON == nil {
		// Case doesn't exist locally, try to fetch it from registrar-stampreporter-channel
		log.Printf("Case %s not found locally, attempting to fetch from registrar-stampreporter-channel", caseID)
		fetchedCase, err := s.FetchAndStoreCaseFromRegistrarChannel(ctx, caseID)
		if err != nil {
			return fmt.Errorf("failed to fetch case from registrar-stampreporter-channel: %v", err)
		}
		caseObj = *fetchedCase
	} else {
		// Case exists locally, unmarshal it
		err = json.Unmarshal(caseJSON, &caseObj)
		if err != nil {
			return fmt.Errorf("failed to unmarshal case data: %v", err)
		}
	}

	// Verify case status - only forward cases that have been rejected or on hold
	if caseObj.Status != "REJECTED_BY_STAMP_REPORTER" && caseObj.Status != "ON_HOLD_BY_STAMP_REPORTER" {
		return fmt.Errorf("case status must be REJECTED_BY_STAMP_REPORTER or ON_HOLD_BY_STAMP_REPORTER for forwarding to Lawyer, current status: %s", caseObj.Status)
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Update case status for forwarding to lawyer
	if caseObj.Status == "REJECTED_BY_STAMP_REPORTER" {
		caseObj.Status = "FORWARDED_TO_LAWYER_REJECTED"
	} else {
		caseObj.Status = "FORWARDED_TO_LAWYER_ON_HOLD"
	}
	caseObj.CurrentOrg = "LawyersOrg"
	caseObj.LastModified = timestamp

	// Add history item
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       caseObj.Status,
		Organization: "StampReportersOrg",
		Timestamp:    timestamp,
		Comments:     fmt.Sprintf("Case %s and forwarded to Lawyer", caseObj.Status),
	})

	// Marshal the updated case data
	updatedCaseJSON, err := json.Marshal(caseObj)
	if err != nil {
		return fmt.Errorf("failed to marshal updated case data: %v", err)
	}

	// Update case in Stamp Reporter's ledger
	err = ctx.GetStub().PutState(caseID, updatedCaseJSON)
	if err != nil {
		return fmt.Errorf("failed to update case in Stamp Reporter's ledger: %v", err)
	}

	// Forward the case to Lawyer through cross-channel invocation
	// Convert the JSON byte array to string as the Lawyer expects a string parameter
	caseJSONStr := string(updatedCaseJSON)
	args := [][]byte{[]byte("StoreCase"), []byte(caseJSONStr)}
	response := ctx.GetStub().InvokeChaincode("lawyer", args, "stampreporter-lawyer-channel")

	// Check if the Lawyer chaincode response is successful
	if response.Status != 200 {
		errMsg := fmt.Sprintf("Failed to forward case to Lawyer: %s", string(response.Message))
		log.Printf(errMsg)

		// Revert the status change in case of failure
		origStatus := "REJECTED_BY_STAMP_REPORTER"
		if caseObj.Status == "FORWARDED_TO_LAWYER_ON_HOLD" {
			origStatus = "ON_HOLD_BY_STAMP_REPORTER"
		}
		caseObj.Status = origStatus
		caseObj.CurrentOrg = "StampReportersOrg"
		revertJSON, _ := json.Marshal(caseObj)
		ctx.GetStub().PutState(caseID, revertJSON)

		return fmt.Errorf(errMsg)
	}

	log.Printf("Successfully forwarded case %s to Lawyer", caseID)
	return nil
}

// GetRejectedCases returns all rejected cases to be forwarded to Lawyer
func (s *StampReporterContract) GetRejectedCases(ctx contractapi.TransactionContextInterface) ([]*Case, error) {
	log.Printf("GetRejectedCases called")

	// Get MSP ID of the submitting client identity
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Check if the caller has proper authorization
	if clientOrgID != "StampReportersOrg" && clientOrgID != "StampReportersOrgMSP" &&
		clientOrgID != "LawyersOrg" && clientOrgID != "LawyersOrgMSP" {
		return nil, fmt.Errorf("only StampReportersOrg or LawyersOrg member can get rejected cases")
	}

	// Query all rejected cases that should be forwarded to Lawyer
	queryString := fmt.Sprintf(`{"selector":{"status":"REJECTED_BY_STAMP_REPORTER","currentOrg":"LawyersOrg"}}`)

	// Execute the query
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to get query result: %v", err)
	}
	defer resultsIterator.Close()

	var rejectedCases []*Case
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get the next query result: %v", err)
		}

		var caseObj Case
		err = json.Unmarshal(queryResult.Value, &caseObj)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal case: %v", err)
		}

		rejectedCases = append(rejectedCases, &caseObj)
		log.Printf("Found rejected case %s", caseObj.ID)
	}

	log.Printf("Returning %d rejected cases", len(rejectedCases))
	return rejectedCases, nil
}

// GetOnHoldCases returns all on-hold cases to be forwarded to Lawyer
func (s *StampReporterContract) GetOnHoldCases(ctx contractapi.TransactionContextInterface) ([]*Case, error) {
	log.Printf("GetOnHoldCases called")

	// Get MSP ID of the submitting client identity
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Check if the caller has proper authorization
	if clientOrgID != "StampReportersOrg" && clientOrgID != "StampReportersOrgMSP" &&
		clientOrgID != "LawyersOrg" && clientOrgID != "LawyersOrgMSP" {
		return nil, fmt.Errorf("only StampReportersOrg or LawyersOrg member can get on-hold cases")
	}

	// Query all on-hold cases that should be forwarded to Lawyer
	queryString := fmt.Sprintf(`{"selector":{"status":"ON_HOLD_BY_STAMP_REPORTER","currentOrg":"LawyersOrg"}}`)

	// Execute the query
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to get query result: %v", err)
	}
	defer resultsIterator.Close()

	var onHoldCases []*Case
	for resultsIterator.HasNext() {
		queryResult, err := resultsIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to get the next query result: %v", err)
		}

		var caseObj Case
		err = json.Unmarshal(queryResult.Value, &caseObj)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal case: %v", err)
		}

		onHoldCases = append(onHoldCases, &caseObj)
		log.Printf("Found on-hold case %s", caseObj.ID)
	}

	log.Printf("Returning %d on-hold cases", len(onHoldCases))
	return onHoldCases, nil
}

// StoreCase stores a case submitted from another organization's chaincode
func (s *StampReporterContract) StoreCase(ctx contractapi.TransactionContextInterface, caseJSON string) error {
	log.Printf("StoreCase called with payload length: %d bytes", len(caseJSON))

	// Get MSP ID of the submitting client identity
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Check if the caller organization is authorized to store cases
	if clientOrgID != "StampReportersOrg" && clientOrgID != "StampReportersOrgMSP" &&
		clientOrgID != "RegistrarsOrg" && clientOrgID != "RegistrarsOrgMSP" {
		return fmt.Errorf("caller from organization %s is not authorized to store cases in StampReporter", clientOrgID)
	}

	// Parse case data
	var newCase Case
	err = json.Unmarshal([]byte(caseJSON), &newCase)
	if err != nil {
		log.Printf("Failed to unmarshal case data: %v", err)
		return fmt.Errorf("failed to unmarshal case data: %v", err)
	}

	log.Printf("Successfully parsed case with ID: %s, Title: %s", newCase.ID, newCase.Title)

	// Validate that the case's current organization is StampReportersOrg
	if newCase.CurrentOrg != "StampReportersOrg" {
		return fmt.Errorf("case %s is not currently assigned to StampReportersOrg", newCase.ID)
	}

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

	// Store the case in the ledger
	updatedCaseJSON, err := json.Marshal(newCase)
	if err != nil {
		log.Printf("Failed to marshal updated case: %v", err)
		return err
	}

	err = ctx.GetStub().PutState(newCase.ID, updatedCaseJSON)
	if err != nil {
		log.Printf("Failed to save case: %v", err)
		return err
	}

	log.Printf("Successfully stored case with ID: %s", newCase.ID)
	return nil
}

// FetchAndStoreCaseFromRegistrarChannel fetches a case from registrar-stampreporter-channel if it doesn't exist locally
func (s *StampReporterContract) FetchAndStoreCaseFromRegistrarChannel(ctx contractapi.TransactionContextInterface, caseID string) (*Case, error) {
	log.Printf("FetchAndStoreCaseFromRegistrarChannel called for case ID: %s", caseID)

	// Check if case exists locally first
	localCase, err := ctx.GetStub().GetState(caseID)
	if err == nil && localCase != nil {
		log.Printf("Case %s exists locally, no need to fetch from registrar channel", caseID)
		var caseObj Case
		err = json.Unmarshal(localCase, &caseObj)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal local case: %v", err)
		}
		return &caseObj, nil
	}

	// Get MSP ID of the submitting client
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Only StampReportersOrg members should call this function
	if clientOrgID != "StampReportersOrg" && clientOrgID != "StampReportersOrgMSP" {
		return nil, fmt.Errorf("this function can only be called by members of StampReportersOrg")
	}

	log.Printf("Case %s not found locally, fetching from registrar-stampreporter-channel", caseID)

	// Invoke the GetCaseById function in the registrar chaincode
	args := [][]byte{[]byte("GetCaseById"), []byte(caseID)}
	response := ctx.GetStub().InvokeChaincode("registrar", args, "registrar-stampreporter-channel")

	// Check the response status
	if response.Status != 200 {
		errMsg := fmt.Sprintf("Failed to fetch case from registrar channel: %s", string(response.Message))
		log.Printf(errMsg)
		return nil, fmt.Errorf(errMsg)
	}

	// Check if payload is empty
	if response.Payload == nil || len(response.Payload) == 0 {
		errMsg := fmt.Sprintf("Case data not found on registrar-stampreporter-channel for ID: %s", caseID)
		log.Printf(errMsg)
		return nil, fmt.Errorf(errMsg)
	}

	log.Printf("Successfully fetched case from registrar-stampreporter-channel, response length: %d bytes", len(response.Payload))

	// Parse the response
	var caseObj Case
	err = json.Unmarshal(response.Payload, &caseObj)
	if err != nil {
		log.Printf("Failed to unmarshal case data: %v", err)
		return nil, fmt.Errorf("failed to unmarshal case data: %v", err)
	}

	log.Printf("Successfully parsed case with ID: %s, Title: %s", caseObj.ID, caseObj.Title)
	// Ensure the case belongs to StampReportersOrg (fix the organization if needed)
	if caseObj.CurrentOrg != "StampReportersOrg" {
		log.Printf("Changing case organization from %s to StampReportersOrg", caseObj.CurrentOrg)
		caseObj.CurrentOrg = "StampReportersOrg"

		// Get current timestamp
		txTimestamp, err := ctx.GetStub().GetTxTimestamp()
		if err != nil {
			return nil, fmt.Errorf("failed to get transaction timestamp: %v", err)
		}
		timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

		// Add history item for the cross-channel transfer
		caseObj.History = append(caseObj.History, HistoryItem{
			Status:       "TRANSFERRED_TO_STAMPREPORTER",
			Organization: "StampReportersOrg",
			Timestamp:    timestamp,
			Comments:     "Case transferred from registrar-stampreporter-channel to stampreporter-benchclerk-channel",
		})

		caseObj.LastModified = timestamp
	}

	// Store the case locally
	caseJSON, err := json.Marshal(caseObj)
	if err != nil {
		log.Printf("Failed to marshal case: %v", err)
		return nil, fmt.Errorf("failed to marshal case: %v", err)
	}

	// Store the case in Stamp Reporter's ledger
	err = ctx.GetStub().PutState(caseID, caseJSON)
	if err != nil {
		log.Printf("Failed to store case: %v", err)
		return nil, fmt.Errorf("failed to store case: %v", err)
	}

	log.Printf("Successfully stored case %s in Stamp Reporter's ledger", caseID)
	return &caseObj, nil
}

// SyncCaseAcrossChannels ensures that a case is available in both registrar-stampreporter-channel and stampreporter-benchclerk-channel
// This helps resolve cross-channel communication issues
func (s *StampReporterContract) SyncCaseAcrossChannels(ctx contractapi.TransactionContextInterface, caseID string) error {
	log.Printf("SyncCaseAcrossChannels called for case ID: %s", caseID)

	// Get MSP ID of the submitting client
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Only StampReportersOrg members should call this function
	if clientOrgID != "StampReportersOrg" && clientOrgID != "StampReportersOrgMSP" {
		return fmt.Errorf("this function can only be called by members of StampReportersOrg")
	}

	// Try to get the case from the local ledger
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return fmt.Errorf("failed to read case: %v", err)
	}

	var caseObj Case
	if caseJSON == nil {
		// Case doesn't exist locally, try to fetch it from registrar-stampreporter-channel
		log.Printf("Case %s not found locally, attempting to fetch from registrar-stampreporter-channel", caseID)
		fetchedCase, err := s.FetchAndStoreCaseFromRegistrarChannel(ctx, caseID)
		if err != nil {
			return fmt.Errorf("failed to fetch case from registrar-stampreporter-channel: %v", err)
		}
		caseObj = *fetchedCase
	} else {
		// Case exists locally, unmarshal it
		err = json.Unmarshal(caseJSON, &caseObj)
		if err != nil {
			return fmt.Errorf("failed to unmarshal case data: %v", err)
		}
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Add a history item to track this sync operation
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       "CASE_SYNCED",
		Organization: "StampReportersOrg",
		Timestamp:    timestamp,
		Comments:     "Case synchronized between registrar-stampreporter-channel and stampreporter-benchclerk-channel",
	})

	caseObj.LastModified = timestamp

	// Marshal the updated case data
	updatedCaseJSON, err := json.Marshal(caseObj)
	if err != nil {
		return fmt.Errorf("failed to marshal updated case data: %v", err)
	}

	// Update case in Stamp Reporter's ledger
	err = ctx.GetStub().PutState(caseID, updatedCaseJSON)
	if err != nil {
		return fmt.Errorf("failed to update case in Stamp Reporter's ledger: %v", err)
	}

	log.Printf("Successfully synchronized case %s across channels", caseID)
	return nil
}

// GetAllPendingCasesFromRegistrar fetches all cases from registrar-stampreporter-channel that need attention from StampReporter
func (s *StampReporterContract) GetAllPendingCasesFromRegistrar(ctx contractapi.TransactionContextInterface) error {
	log.Printf("GetAllPendingCasesFromRegistrar called")

	// Get MSP ID of the submitting client
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Only StampReportersOrg members should call this function
	if clientOrgID != "StampReportersOrg" && clientOrgID != "StampReportersOrgMSP" {
		return fmt.Errorf("this function can only be called by members of StampReportersOrg")
	}

	// Invoke the registrar chaincode to get all cases pending stamp reporter review
	args := [][]byte{[]byte("GetCasesForStampReporter")}
	response := ctx.GetStub().InvokeChaincode("registrar", args, "registrar-stampreporter-channel")

	// Check the response status
	if response.Status != 200 {
		errMsg := fmt.Sprintf("Failed to fetch cases from registrar channel: %s", string(response.Message))
		log.Printf(errMsg)
		return fmt.Errorf(errMsg)
	}

	// Check if payload is empty
	if response.Payload == nil || len(response.Payload) == 0 || string(response.Payload) == "[]" {
		log.Printf("No pending cases found for StampReporter on registrar-stampreporter-channel")
		return nil
	}

	// Parse the response which should contain an array of cases
	var cases []Case
	err = json.Unmarshal(response.Payload, &cases)
	if err != nil {
		return fmt.Errorf("failed to unmarshal cases data: %v", err)
	}

	log.Printf("Fetched %d cases from registrar-stampreporter-channel", len(cases))

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Store each case in the local ledger
	for _, caseObj := range cases {
		// Ensure the case belongs to StampReportersOrg
		caseObj.CurrentOrg = "StampReportersOrg"

		// Add history item for the cross-channel transfer if not already added
		transferFound := false
		for _, history := range caseObj.History {
			if history.Status == "TRANSFERRED_TO_STAMPREPORTER" {
				transferFound = true
				break
			}
		}

		if !transferFound {
			caseObj.History = append(caseObj.History, HistoryItem{
				Status:       "TRANSFERRED_TO_STAMPREPORTER",
				Organization: "StampReportersOrg",
				Timestamp:    timestamp,
				Comments:     "Case transferred from registrar-stampreporter-channel to stampreporter-benchclerk-channel",
			})
		}

		caseObj.LastModified = timestamp

		// Store the case locally
		caseJSON, err := json.Marshal(caseObj)
		if err != nil {
			log.Printf("Failed to marshal case %s: %v", caseObj.ID, err)
			continue
		}

		// Store the case in Stamp Reporter's ledger
		err = ctx.GetStub().PutState(caseObj.ID, caseJSON)
		if err != nil {
			log.Printf("Failed to store case %s: %v", caseObj.ID, err)
			continue
		}

		log.Printf("Successfully stored case %s in Stamp Reporter's ledger", caseObj.ID)
	}

	return nil
}

func main() {
	stampReporterChaincode, err := contractapi.NewChaincode(&StampReporterContract{})
	if err != nil {
		log.Panicf("Error creating stamp reporter chaincode: %v", err)
	}

	if err := stampReporterChaincode.Start(); err != nil {
		log.Panicf("Error starting stamp reporter chaincode: %v", err)
	}
}
