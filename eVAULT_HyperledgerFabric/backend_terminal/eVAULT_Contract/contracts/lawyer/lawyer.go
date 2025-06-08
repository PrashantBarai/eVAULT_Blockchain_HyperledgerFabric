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

	response := ctx.GetStub().InvokeChaincode("registrar", args, channelName)
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
		return nil, fmt.Errorf("case not found: %s", caseID)
	}

	var case_ Case
	err = json.Unmarshal(caseJSON, &case_)
	if err != nil {
		return nil, err
	}

	// Initialize empty arrays if they are null
	if case_.Documents == nil {
		case_.Documents = make([]Document, 0)
	}
	if case_.History == nil {
		case_.History = make([]HistoryItem, 0)
	}
	if case_.AssociatedLawyers == nil {
		case_.AssociatedLawyers = make([]string, 0)
	}

	return &case_, nil
}

// UpdateCaseDetails updates case metadata
func (s *LawyerContract) UpdateCaseDetails(ctx contractapi.TransactionContextInterface, caseID string, updates string) error {
	var updateData map[string]interface{}
	err := json.Unmarshal([]byte(updates), &updateData)
	if err != nil {
		return fmt.Errorf("failed to unmarshal updates: %v", err)
	}

	// Get existing case
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

	// Get existing case
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

// // TestCrossChaincodeInvocation is a test function to verify chaincode-to-chaincode invocation
// func (s *LawyerContract) TestCrossChaincodeInvocation(ctx contractapi.TransactionContextInterface) error {
// 	// Create a simple test object
// 	testData := map[string]string{
// 		"id":    "TEST_CASE_" + time.Now().Format("20060102150405"),
// 		"title": "Test Invocation",
// 		"type":  "TEST",
// 	}

// 	// Marshal to JSON string
// 	testJSON, err := json.Marshal(testData)
// 	if err != nil {
// 		return fmt.Errorf("failed to marshal test data: %v", err)
// 	}

// 	// Convert to string
// 	testJSONStr := string(testJSON)

// 	// Create arguments array
// 	args := [][]byte{[]byte("TestJSONParsing"), []byte(testJSONStr)}

// 	// Log the test invocation
// 	log.Printf("Testing cross-chaincode invocation with data: %s", testJSONStr)

// 	// Invoke the TestJSONParsing function in the registrar chaincode
// 	response := ctx.GetStub().InvokeChaincode("registrar", args, "")

// 	// Check and log the response
// 	if response.Status != shim.OK {
// 		log.Printf("Cross-chaincode test failed: %s", response.Message)
// 		return fmt.Errorf("cross-chaincode test failed: %s", response.Message)
// 	}

// 	log.Printf("Cross-chaincode test succeeded: %s", string(response.Payload))
// 	return nil
// }

func main() {
	lawyerChaincode, err := contractapi.NewChaincode(&LawyerContract{})
	if err != nil {
		log.Panicf("Error creating lawyer chaincode: %v", err)
	}

	if err := lawyerChaincode.Start(); err != nil {
		log.Panicf("Error starting lawyer chaincode: %v", err)
	}
}
