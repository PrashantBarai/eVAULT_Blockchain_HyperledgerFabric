package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
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
	Hearings          []Hearing     `json:"hearings"`
	Judgment          *Judgment     `json:"judgment,omitempty"`
	Decision          string        `json:"decision"` // For backward compatibility
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

// DocumentSignature represents a signature on a document
type DocumentSignature struct {
	Signer    string `json:"signer"`
	Signature string `json:"signature"`
	Timestamp string `json:"timestamp"`
}

// HistoryItem represents a case status change
type HistoryItem struct {
	Status       string `json:"status"`
	Organization string `json:"organization"`
	Timestamp    string `json:"timestamp"`
	Comments     string `json:"comments"`
}

// Hearing represents a court hearing
type Hearing struct {
	Date     string `json:"date"`
	Time     string `json:"time"`
	Location string `json:"location"`
	Status   string `json:"status"`
	Notes    string `json:"notes"`
}

// Judgment represents a judge's final decision on a case
type Judgment struct {
	Decision  string `json:"decision"`
	Reasoning string `json:"reasoning"`
	Date      string `json:"date"`
	JudgeID   string `json:"judgeId"`
	IssuedAt  string `json:"issuedAt"`
	Status    string `json:"status"`
}

// LawyerContract provides functions for managing cases
type LawyerContract struct {
	contractapi.Contract
}

// InitLedger initializes the ledger with sample data
func (s *LawyerContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

// CreateCase creates a new case on the ledger
func (s *LawyerContract) CreateCase(ctx contractapi.TransactionContextInterface, caseData string) error {
	// Parse case data
	var newCase Case
	err := json.Unmarshal([]byte(caseData), &newCase)
	if err != nil {
		return fmt.Errorf("failed to unmarshal case data: %v", err)
	}

	// Check if case already exists
	exists, err := s.CaseExists(ctx, newCase.ID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("case already exists: %s", newCase.ID)
	}

	// Initialize case status
	newCase.Status = "CREATED"
	newCase.CurrentOrg = "LawyersOrg"

	// Convert to JSON and save
	caseJSON, err := json.Marshal(newCase)
	err = ctx.GetStub().PutState(newCase.ID, caseJSON)
	if err != nil {
		return err
	}

	return nil
}

// CaseExists returns true if the case with given ID exists
func (s *LawyerContract) CaseExists(ctx contractapi.TransactionContextInterface, caseID string) (bool, error) {
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	return caseJSON != nil, nil
}

// SubmitToRegistrar submits the case to registrar queue
func (s *LawyerContract) SubmitToRegistrar(ctx contractapi.TransactionContextInterface, caseID string) error {
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

	// Check if case is already submitted
	if caseObj.Status == "PENDING_REGISTRAR_REVIEW" {
		return fmt.Errorf("case is already submitted to registrar")
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Update case state
	caseObj.Status = "PENDING_REGISTRAR_REVIEW"
	caseObj.CurrentOrg = "RegistrarsOrg"
	caseObj.LastModified = timestamp
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       "SUBMITTED_TO_REGISTRAR",
		Organization: "LawyersOrg",
		Timestamp:    timestamp,
	})

	// Save updated case in lawyer's state
	updatedCaseJSON, err := json.Marshal(caseObj)
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(caseObj.ID, updatedCaseJSON)
	if err != nil {
		return err
	}
	// Submit case to registrar through cross-channel invocation
	// Convert the JSON byte array to string as the registrar expects a string parameter
	caseJSONStr := string(updatedCaseJSON)
	args := [][]byte{[]byte("ReceiveCase"), []byte(caseJSONStr)}
	// Add logging to help diagnose
	log.Printf("Invoking registrar chaincode with case data: %s", caseJSONStr)

	// Using empty string as channel name since both chaincodes are on the same channel
	// If they were on different channels, we would use the target channel name
	channelName := ""
	log.Printf("Invoking registrar chaincode on channel: %s", channelName)

	response := ctx.GetStub().InvokeChaincode("registrar", args, channelName) // Invoke the registrar chaincode
	if response.Status != shim.OK {
		// If registrar submission fails, revert the status
		caseObj.Status = "CREATED"
		caseObj.CurrentOrg = "LawyersOrg"
		caseObj.History = caseObj.History[:len(caseObj.History)-1]

		revertJSON, _ := json.Marshal(caseObj)
		ctx.GetStub().PutState(caseObj.ID, revertJSON)

		log.Printf("Failed to submit case to registrar: %s", response.Message)
		return fmt.Errorf("failed to submit case to registrar: %s", response.Message)
	}

	log.Printf("Successfully submitted case to registrar")

	return nil
}

// GetCase retrieves a case by ID
func (s *LawyerContract) GetCase(ctx contractapi.TransactionContextInterface, caseID string) (*Case, error) {
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return nil, fmt.Errorf("failed to read case: %v", err)
	}

	if caseJSON == nil {
		log.Printf("Case not found locally: %s. Attempting to fetch from BenchClerk channel", caseID)
		// Try to fetch the case from BenchClerk channel
		return s.FetchAndStoreCaseFromBenchClerkChannel(ctx, caseID)
	}

	var case_ Case
	err = json.Unmarshal(caseJSON, &case_)
	if err != nil {
		return nil, err
	}

	// Use our helper method to initialize the case structure
	s.initializeCaseStructure(&case_)

	return &case_, nil
}

// UpdateCaseDetails updates case metadata
func (s *LawyerContract) UpdateCaseDetails(ctx contractapi.TransactionContextInterface, caseID string, updates string) error {
	var updateData map[string]interface{}
	err := json.Unmarshal([]byte(updates), &updateData)
	if err != nil {
		return fmt.Errorf("failed to unmarshal updates: %v", err)
	}

	// Get existing case - this will attempt to fetch from BenchClerk channel if not found locally
	case_, err := s.GetCase(ctx, caseID)
	if err != nil {
		return err
	}

	// Apply updates
	if v, ok := updateData["title"]; ok {
		case_.Title = v.(string)
	}
	if v, ok := updateData["description"]; ok {
		case_.Description = v.(string)
	}
	if v, ok := updateData["caseSubject"]; ok {
		case_.CaseSubject = v.(string)
	}
	if v, ok := updateData["clientName"]; ok {
		case_.ClientName = v.(string)
	}
	if v, ok := updateData["department"]; ok {
		case_.Department = v.(string)
	}

	// Save updated case
	caseJSON, err := json.Marshal(case_)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(caseID, caseJSON)
}

// GetCasesByFilter retrieves cases matching the given filter criteria
func (s *LawyerContract) GetCasesByFilter(ctx contractapi.TransactionContextInterface, filter string) ([]*Case, error) {
	var filterData struct {
		TimeRange  string   `json:"timeRange"` // Today, ThisWeek, ThisMonth
		Status     []string `json:"status"`
		Department string   `json:"department"`
		SearchText string   `json:"searchText"`
	}
	err := json.Unmarshal([]byte(filter), &filterData)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal filter: %v", err)
	}

	queryString := `{
        "selector": {
            "docType": "case"
        }
    }`

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

		var case_ Case
		err = json.Unmarshal(queryResponse.Value, &case_)
		if err != nil {
			return nil, err
		}

		cases = append(cases, &case_)
	}

	return cases, nil
}

// AddDocumentToCase adds a new document to a case
func (s *LawyerContract) AddDocumentToCase(ctx contractapi.TransactionContextInterface, caseID string, document string) error {
	var newDoc Document
	err := json.Unmarshal([]byte(document), &newDoc)
	if err != nil {
		return fmt.Errorf("failed to unmarshal document: %v", err)
	}

	// Get existing case - this will attempt to fetch from BenchClerk channel if not found locally
	case_, err := s.GetCase(ctx, caseID)
	if err != nil {
		return err
	}

	// Initialize SignatureHistory
	if newDoc.SignatureHistory == nil {
		newDoc.SignatureHistory = make([]DocumentSignature, 0)
	}

	// Set initial validation state
	newDoc.Validated = false

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)
	newDoc.UploadedAt = timestamp

	// Add document
	case_.Documents = append(case_.Documents, newDoc)

	// Save updated case
	caseJSON, err := json.Marshal(case_)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(caseID, caseJSON)
}

// GetConfirmedDecisions retrieves cases with confirmed judge decisions
func (s *LawyerContract) GetConfirmedDecisions(ctx contractapi.TransactionContextInterface) ([]*Case, error) {
	log.Printf("GetConfirmedDecisions called")

	queryString := `{
        "selector": {
            "status": "DECISION_CONFIRMED",
            "currentOrg": "LawyersOrg"
        }
    }`

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
		var case_ Case
		err = json.Unmarshal(queryResponse.Value, &case_)
		if err != nil {
			log.Printf("Failed to unmarshal case: %v", err)
			return nil, err
		}

		// Use our helper method to initialize the case structure
		s.initializeCaseStructure(&case_)

		cases = append(cases, &case_)
	}

	log.Printf("Found %d cases with confirmed decisions", len(cases))
	return cases, nil
}

// QueryStats gets statistics for lawyer dashboard
func (s *LawyerContract) QueryStats(ctx contractapi.TransactionContextInterface) (string, error) {
	log.Printf("QueryStats called")

	stats := struct {
		TotalCases        int `json:"totalCases"`
		PendingCases      int `json:"pendingCases"`
		InProgressCases   int `json:"inProgressCases"`
		CompletedCases    int `json:"completedCases"`
		DecisionConfirmed int `json:"decisionConfirmed"`
	}{}

	// Total cases count
	totalIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"associatedLawyers":{"$exists":true}}}`)
	if err == nil {
		for totalIterator.HasNext() {
			stats.TotalCases++
			_, _ = totalIterator.Next()
		}
		totalIterator.Close()
	}

	// Count pending registrar cases
	pendingIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"PENDING_REGISTRAR_REVIEW"}}`)
	if err == nil {
		for pendingIterator.HasNext() {
			stats.PendingCases++
			_, _ = pendingIterator.Next()
		}
		pendingIterator.Close()
	}

	// Count in progress cases
	progressIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"$or":[{"status":"VERIFIED_BY_REGISTRAR"},{"status":"VALIDATED_BY_STAMP_REPORTER"},{"status":"PENDING_JUDGE_REVIEW"}]}}`)
	if err == nil {
		for progressIterator.HasNext() {
			stats.InProgressCases++
			_, _ = progressIterator.Next()
		}
		progressIterator.Close()
	}

	// Count confirmed decisions
	decisionIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"DECISION_CONFIRMED","currentOrg":"LawyersOrg"}}`)
	if err == nil {
		for decisionIterator.HasNext() {
			stats.DecisionConfirmed++
			_, _ = decisionIterator.Next()
		}
		decisionIterator.Close()
	}

	// Count completed cases
	completedIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":{"$in":["DECISION_CONFIRMED", "JUDGMENT_ISSUED"]}}}`)
	if err == nil {
		for completedIterator.HasNext() {
			stats.CompletedCases++
			_, _ = completedIterator.Next()
		}
		completedIterator.Close()
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

// ViewJudgmentDetails retrieves detailed information about a case judgment
func (s *LawyerContract) ViewJudgmentDetails(ctx contractapi.TransactionContextInterface, caseID string) (string, error) {
	log.Printf("ViewJudgmentDetails called for case ID: %s", caseID)

	// Get the case
	case_, err := s.GetCase(ctx, caseID)
	if err != nil {
		log.Printf("Failed to get case: %v", err)
		return "", err
	}

	// Check if the case has a confirmed decision
	if case_.Status != "DECISION_CONFIRMED" {
		log.Printf("Case %s does not have a confirmed decision", caseID)
		return "", fmt.Errorf("case %s does not have a confirmed decision", caseID)
	}

	// Extract judgment-related information from the case history
	var judgmentInfo struct {
		CaseID        string   `json:"caseId"`
		CaseNumber    string   `json:"caseNumber"`
		Title         string   `json:"title"`
		Decision      string   `json:"decision"`
		JudgeID       string   `json:"judgeId"`
		IssuedAt      string   `json:"issuedAt"`
		ConfirmedAt   string   `json:"confirmedAt"`
		CurrentStatus string   `json:"currentStatus"`
		History       []string `json:"history"`
	}

	judgmentInfo.CaseID = case_.ID
	judgmentInfo.CaseNumber = case_.CaseNumber
	judgmentInfo.Title = case_.Title // Get decision from Judgment field if available, otherwise use legacy Decision field
	if case_.Judgment != nil {
		judgmentInfo.Decision = case_.Judgment.Decision
		judgmentInfo.JudgeID = case_.Judgment.JudgeID
		judgmentInfo.IssuedAt = case_.Judgment.IssuedAt
	} else {
		judgmentInfo.Decision = case_.Decision
		judgmentInfo.JudgeID = case_.AssociatedJudge
	}
	judgmentInfo.CurrentStatus = case_.Status

	// Extract relevant history items
	judgmentInfo.History = make([]string, 0)
	for _, item := range case_.History {
		if item.Status == "JUDGMENT_ISSUED" || item.Status == "DECISION_CONFIRMED" {
			if item.Status == "JUDGMENT_ISSUED" {
				judgmentInfo.IssuedAt = item.Timestamp
			}
			if item.Status == "DECISION_CONFIRMED" {
				judgmentInfo.ConfirmedAt = item.Timestamp
			}
			judgmentInfo.History = append(judgmentInfo.History,
				fmt.Sprintf("%s: %s - %s", item.Timestamp, item.Status, item.Comments))
		}
	}

	// Convert to JSON
	judgmentJSON, err := json.Marshal(judgmentInfo)
	if err != nil {
		log.Printf("Failed to marshal judgment info: %v", err)
		return "", fmt.Errorf("failed to marshal judgment info: %v", err)
	}

	log.Printf("Successfully retrieved judgment details for case ID: %s", caseID)
	return string(judgmentJSON), nil
}

// GetAllCases retrieves all cases accessible to the lawyer
func (s *LawyerContract) GetAllCases(ctx contractapi.TransactionContextInterface) ([]*Case, error) {
	log.Printf("GetAllCases called")

	// Query all cases
	queryString := `{
        "selector": {
            "$or": [
                {"currentOrg": "LawyersOrg"},
                {"associatedLawyers": {"$exists": true}}
            ]
        }
    }`

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

		var case_ Case
		err = json.Unmarshal(queryResponse.Value, &case_)
		if err != nil {
			log.Printf("Failed to unmarshal case: %v", err)
			return nil, err
		}

		// Initialize empty arrays and handle legacy data structure
		s.initializeCaseStructure(&case_)
		cases = append(cases, &case_)
	}

	log.Printf("Found %d cases in total", len(cases))
	return cases, nil
}

// GetCasesByLawyerID retrieves cases associated with a specific lawyer ID
func (s *LawyerContract) GetCasesByLawyerID(ctx contractapi.TransactionContextInterface, lawyerID string) ([]*Case, error) {
	log.Printf("GetCasesByLawyerID called for lawyer ID: %s", lawyerID)

	// Create CouchDB query to find cases where the lawyer is associated
	queryString := fmt.Sprintf(`{
		"selector": {
			"$or": [
				{"associatedLawyers": {"$elemMatch": {"$eq": "%s"}}},
				{"createdBy": "%s"}
			]
		}
	}`, lawyerID, lawyerID)

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

		var case_ Case
		err = json.Unmarshal(queryResponse.Value, &case_)
		if err != nil {
			log.Printf("Failed to unmarshal case: %v", err)
			return nil, err
		}

		// Initialize case structure
		s.initializeCaseStructure(&case_)
		cases = append(cases, &case_)
	}

	log.Printf("Found %d cases for lawyer ID: %s", len(cases), lawyerID)
	return cases, nil
}

// FetchAndStoreCaseFromStampReporterChannel fetches rejected or on-hold cases from StampReporter
func (s *LawyerContract) FetchAndStoreCaseFromStampReporterChannel(ctx contractapi.TransactionContextInterface) error {
	log.Printf("FetchAndStoreCaseFromStampReporterChannel called")

	// Get MSP ID of the submitting client
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Only LawyersOrg members should call this function
	if clientOrgID != "LawyersOrg" && clientOrgID != "LawyersOrgMSP" {
		return fmt.Errorf("this function can only be called by members of LawyersOrg")
	}

	// Invoke the GetRejectedCases function in the StampReporter chaincode to get rejected cases
	args := [][]byte{[]byte("GetRejectedCases")}
	response := ctx.GetStub().InvokeChaincode("stampreporter", args, "lawyer-stampreporter-channel")

	// Check if the StampReporter chaincode response is successful
	if response.Status != 200 {
		errMsg := fmt.Sprintf("Failed to fetch rejected cases from StampReporter: %s", string(response.Message))
		log.Printf(errMsg)
		return fmt.Errorf(errMsg)
	}

	// Parse the response payload which should be a JSON array of cases
	if string(response.Payload) == "[]" {
		log.Printf("No rejected cases to fetch from StampReporter")
	} else {
		var rejectedCases []Case
		err = json.Unmarshal(response.Payload, &rejectedCases)
		if err != nil {
			return fmt.Errorf("failed to unmarshal rejected cases: %v", err)
		}

		log.Printf("Fetched %d rejected cases from StampReporter", len(rejectedCases))

		// Store each rejected case in Lawyer's ledger
		for _, caseObj := range rejectedCases {
			if caseObj.Status != "REJECTED" || caseObj.CurrentOrg != "LawyersOrg" {
				log.Printf("Skipping case %s: status=%s, currentOrg=%s", caseObj.ID, caseObj.Status, caseObj.CurrentOrg)
				continue
			}

			// Get current timestamp
			txTimestamp, err := ctx.GetStub().GetTxTimestamp()
			if err != nil {
				log.Printf("Failed to get transaction timestamp for case %s: %v", caseObj.ID, err)
				continue
			}
			timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

			// Update case status
			caseObj.Status = "REJECTION_RECEIVED"
			caseObj.LastModified = timestamp

			// Add history item
			caseObj.History = append(caseObj.History, HistoryItem{
				Status:       "REJECTION_RECEIVED",
				Organization: "LawyersOrg",
				Timestamp:    timestamp,
				Comments:     "Case rejection received from StampReporter",
			})

			// Marshal the updated case
			caseJSON, err := json.Marshal(caseObj)
			if err != nil {
				log.Printf("Failed to marshal case %s: %v", caseObj.ID, err)
				continue
			}

			// Store the case in Lawyer's ledger
			err = ctx.GetStub().PutState(caseObj.ID, caseJSON)
			if err != nil {
				log.Printf("Failed to store rejected case %s: %v", caseObj.ID, err)
				continue
			}

			log.Printf("Successfully stored rejected case %s in Lawyer's ledger", caseObj.ID)
		}
	}

	// Also fetch on-hold cases from StampReporter
	args = [][]byte{[]byte("GetOnHoldCases")}
	response = ctx.GetStub().InvokeChaincode("stampreporter", args, "lawyer-stampreporter-channel")

	// Check if the StampReporter chaincode response is successful
	if response.Status != 200 {
		errMsg := fmt.Sprintf("Failed to fetch on-hold cases from StampReporter: %s", string(response.Message))
		log.Printf(errMsg)
		return fmt.Errorf(errMsg)
	}

	// Parse the response payload which should be a JSON array of cases
	if string(response.Payload) == "[]" {
		log.Printf("No on-hold cases to fetch from StampReporter")
	} else {
		var onHoldCases []Case
		err = json.Unmarshal(response.Payload, &onHoldCases)
		if err != nil {
			return fmt.Errorf("failed to unmarshal on-hold cases: %v", err)
		}

		log.Printf("Fetched %d on-hold cases from StampReporter", len(onHoldCases))

		// Store each on-hold case in Lawyer's ledger
		for _, caseObj := range onHoldCases {
			if caseObj.Status != "ON_HOLD" || caseObj.CurrentOrg != "LawyersOrg" {
				log.Printf("Skipping case %s: status=%s, currentOrg=%s", caseObj.ID, caseObj.Status, caseObj.CurrentOrg)
				continue
			}

			// Get current timestamp
			txTimestamp, err := ctx.GetStub().GetTxTimestamp()
			if err != nil {
				log.Printf("Failed to get transaction timestamp for case %s: %v", caseObj.ID, err)
				continue
			}
			timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

			// Update case status
			caseObj.Status = "ON_HOLD_RECEIVED"
			caseObj.LastModified = timestamp

			// Add history item
			caseObj.History = append(caseObj.History, HistoryItem{
				Status:       "ON_HOLD_RECEIVED",
				Organization: "LawyersOrg",
				Timestamp:    timestamp,
				Comments:     "Case on-hold notice received from StampReporter",
			})

			// Marshal the updated case
			caseJSON, err := json.Marshal(caseObj)
			if err != nil {
				log.Printf("Failed to marshal case %s: %v", caseObj.ID, err)
				continue
			}

			// Store the case in Lawyer's ledger
			err = ctx.GetStub().PutState(caseObj.ID, caseJSON)
			if err != nil {
				log.Printf("Failed to store on-hold case %s: %v", caseObj.ID, err)
				continue
			}

			log.Printf("Successfully stored on-hold case %s in Lawyer's ledger", caseObj.ID)
		}
	}

	return nil
}

// FetchAndStoreCaseFromBenchClerkChannel fetches a case from the BenchClerk channel when it doesn't exist locally
func (s *LawyerContract) FetchAndStoreCaseFromBenchClerkChannel(ctx contractapi.TransactionContextInterface, caseID string) (*Case, error) {
	log.Printf("FetchAndStoreCaseFromBenchClerkChannel called for case ID: %s", caseID)

	// Get MSP ID of the submitting client
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Only LawyersOrg members should call this function
	if clientOrgID != "LawyersOrg" && clientOrgID != "LawyersOrgMSP" {
		return nil, fmt.Errorf("this function can only be called by members of LawyersOrg")
	}

	// Invoke the benchclerk chaincode on the benchclerk-lawyer-channel to get the case
	args := [][]byte{[]byte("GetCaseById"), []byte(caseID)}
	response := ctx.GetStub().InvokeChaincode("benchclerk", args, "benchclerk-lawyer-channel")

	// Check the response status
	if response.Status != 200 {
		errMsg := fmt.Sprintf("Failed to fetch case from BenchClerk channel: %s", string(response.Message))
		log.Printf(errMsg)
		return nil, fmt.Errorf(errMsg)
	}

	// Check if payload is empty
	if response.Payload == nil || len(response.Payload) == 0 {
		errMsg := fmt.Sprintf("Case data not found on BenchClerk channel for ID: %s", caseID)
		log.Printf(errMsg)
		return nil, fmt.Errorf(errMsg)
	}

	// Use the payload as the case bytes
	caseBytes := response.Payload

	// Unmarshal the case data
	var caseData Case
	if err := json.Unmarshal(caseBytes, &caseData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal case data: %v", err)
	}

	// Verify that the case is meant for Lawyer organization
	if caseData.CurrentOrg != "LawyersOrg" {
		return nil, fmt.Errorf("case %s is not currently assigned to LawyersOrg", caseID)
	}

	// Initialize empty arrays if they are null
	if caseData.Documents == nil {
		caseData.Documents = make([]Document, 0)
	}
	if caseData.History == nil {
		caseData.History = make([]HistoryItem, 0)
	}
	if caseData.AssociatedLawyers == nil {
		caseData.AssociatedLawyers = make([]string, 0)
	}
	if caseData.Hearings == nil {
		caseData.Hearings = make([]Hearing, 0)
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Add receipt history
	caseData.History = append(caseData.History, HistoryItem{
		Status:       "RECEIVED_BY_LAWYER",
		Organization: "LawyersOrg",
		Timestamp:    timestamp,
		Comments:     "Case retrieved from BenchClerk channel",
	})

	// Update last modified timestamp
	caseData.LastModified = timestamp

	// Store the case in Lawyer's ledger
	updatedCaseBytes, err := json.Marshal(caseData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal updated case data: %v", err)
	}

	if err := ctx.GetStub().PutState(caseID, updatedCaseBytes); err != nil {
		return nil, fmt.Errorf("failed to store case in Lawyer's ledger: %v", err)
	}

	log.Printf("Successfully fetched and stored case %s from BenchClerk channel", caseID)
	return &caseData, nil
}

// initializeCaseStructure ensures all arrays in a Case are properly initialized
func (s *LawyerContract) initializeCaseStructure(caseObj *Case) {
	if caseObj.Documents == nil {
		caseObj.Documents = make([]Document, 0)
	}
	if caseObj.History == nil {
		caseObj.History = make([]HistoryItem, 0)
	}
	if caseObj.AssociatedLawyers == nil {
		caseObj.AssociatedLawyers = make([]string, 0)
	}
	if caseObj.Hearings == nil {
		caseObj.Hearings = make([]Hearing, 0)
	}
}

func main() {
	lawyerChaincode, err := contractapi.NewChaincode(&LawyerContract{})
	if err != nil {
		log.Panicf("Error creating lawyer chaincode: %v", err)
	}

	if err := lawyerChaincode.Start(); err != nil {
		log.Panicf("Error starting lawyer chaincode: %v", err)
	}
}
