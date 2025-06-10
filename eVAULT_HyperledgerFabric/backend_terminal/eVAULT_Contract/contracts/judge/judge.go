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
	Hearings          []Hearing     `json:"hearings"`
	Judgment          *Judgment     `json:"judgment,omitempty"`
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

// JudgeContract provides functions for managing judge activities
type JudgeContract struct {
	contractapi.Contract
}

// InitLedger initializes the ledger
func (s *JudgeContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

// RecordJudgment records the final judgment for a case
func (s *JudgeContract) RecordJudgment(ctx contractapi.TransactionContextInterface, caseID string, judgmentDetails string) error {
	log.Printf("RecordJudgment called for case ID: %s", caseID)

	// Get the case
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		log.Printf("Failed to read case: %v", err)
		return fmt.Errorf("failed to read case: %v", err)
	}

	var caseObj Case
	if caseJSON == nil {
		log.Printf("Case does not exist locally: %s. Trying to fetch from BenchClerk channel", caseID)
		// Try to fetch the case from BenchClerk channel
		fetchedCase, err := s.FetchAndStoreCaseFromBenchClerkChannel(ctx, caseID)
		if err != nil {
			log.Printf("Failed to fetch case from BenchClerk channel: %v", err)
			return fmt.Errorf("failed to fetch case from BenchClerk channel: %v", err)
		}
		caseObj = *fetchedCase
	} else {
		err = json.Unmarshal(caseJSON, &caseObj)
	}
	if err != nil {
		log.Printf("Failed to unmarshal case data: %v", err)
		return err
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
	if caseObj.Hearings == nil {
		caseObj.Hearings = make([]Hearing, 0)
	}

	// Parse judgment details
	var details struct {
		Decision  string `json:"decision"`
		Reasoning string `json:"reasoning"`
		JudgeID   string `json:"judgeId"`
	}
	err = json.Unmarshal([]byte(judgmentDetails), &details)
	if err != nil {
		log.Printf("Failed to unmarshal judgment details: %v", err)
		return err
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		log.Printf("Failed to get transaction timestamp: %v", err)
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Create and add judgment
	caseObj.Judgment = &Judgment{
		Decision:  details.Decision,
		Reasoning: details.Reasoning,
		Date:      timestamp,
		JudgeID:   details.JudgeID,
		IssuedAt:  timestamp,
		Status:    "FINAL",
	}

	// Update case status
	caseObj.Status = "JUDGMENT_ISSUED"
	caseObj.CurrentOrg = "BenchClerksOrg" // Return to bench clerk for final processing

	// Add to history
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       "JUDGMENT_ISSUED",
		Organization: "JudgesOrg",
		Timestamp:    timestamp,
		Comments:     fmt.Sprintf("Final judgment issued by Judge %s", details.JudgeID),
	})

	// Save updated case
	caseObj.LastModified = timestamp
	caseJSON, err = json.Marshal(caseObj)
	if err != nil {
		log.Printf("Failed to marshal updated case: %v", err)
		return err
	}

	log.Printf("Successfully recorded judgment for case ID: %s", caseID)
	return ctx.GetStub().PutState(caseID, caseJSON)
}

// AddHearingNotes adds notes for a case hearing
func (s *JudgeContract) AddHearingNotes(ctx contractapi.TransactionContextInterface, caseID string, hearingDetails string) error {
	log.Printf("AddHearingNotes called for case ID: %s", caseID)

	// Get the case
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		log.Printf("Failed to read case: %v", err)
		return fmt.Errorf("failed to read case: %v", err)
	}

	var caseObj Case
	if caseJSON == nil {
		log.Printf("Case does not exist locally: %s. Trying to fetch from BenchClerk channel", caseID)
		// Try to fetch the case from BenchClerk channel
		fetchedCase, err := s.FetchAndStoreCaseFromBenchClerkChannel(ctx, caseID)
		if err != nil {
			log.Printf("Failed to fetch case from BenchClerk channel: %v", err)
			return fmt.Errorf("failed to fetch case from BenchClerk channel: %v", err)
		}
		caseObj = *fetchedCase
	} else {
		err = json.Unmarshal(caseJSON, &caseObj)
	}
	if err != nil {
		log.Printf("Failed to unmarshal case data: %v", err)
		return err
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
	if caseObj.Hearings == nil {
		caseObj.Hearings = make([]Hearing, 0)
	}

	// Parse hearing details
	var details struct {
		HearingDate string `json:"hearingDate"`
		Notes       string `json:"notes"`
	}
	err = json.Unmarshal([]byte(hearingDetails), &details)
	if err != nil {
		log.Printf("Failed to unmarshal hearing details: %v", err)
		return err
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		log.Printf("Failed to get transaction timestamp: %v", err)
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Find and update the hearing
	hearingFound := false
	for i := range caseObj.Hearings {
		if caseObj.Hearings[i].Date == details.HearingDate {
			caseObj.Hearings[i].Notes = details.Notes
			caseObj.Hearings[i].Status = "COMPLETED"
			hearingFound = true
			break
		}
	}

	if !hearingFound {
		log.Printf("Hearing not found for date: %s", details.HearingDate)
		return fmt.Errorf("hearing not found for date: %s", details.HearingDate)
	}

	// Add to history
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       "HEARING_NOTES_ADDED",
		Organization: "JudgesOrg",
		Timestamp:    timestamp,
		Comments:     fmt.Sprintf("Notes added for hearing on %s", details.HearingDate),
	})

	// Save updated case
	caseObj.LastModified = timestamp
	caseJSON, err = json.Marshal(caseObj)
	if err != nil {
		log.Printf("Failed to marshal updated case: %v", err)
		return err
	}

	log.Printf("Successfully added hearing notes for case ID: %s", caseID)
	return ctx.GetStub().PutState(caseID, caseJSON)
}

// StoreCase stores a case submitted from another organization's chaincode
func (s *JudgeContract) StoreCase(ctx contractapi.TransactionContextInterface, caseJSON string) error {
	log.Printf("StoreCase called with payload length: %d bytes", len(caseJSON))

	// Get MSP ID of the submitting client identity
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Check if the caller organization is authorized to store cases
	if clientOrgID != "JudgesOrg" && clientOrgID != "JudgesOrgMSP" &&
		clientOrgID != "BenchClerksOrg" && clientOrgID != "BenchClerksOrgMSP" {
		return fmt.Errorf("caller from organization %s is not authorized to store cases in Judge", clientOrgID)
	}

	// Parse case data
	var newCase Case
	err = json.Unmarshal([]byte(caseJSON), &newCase)
	if err != nil {
		log.Printf("Failed to unmarshal case data: %v", err)
		return fmt.Errorf("failed to unmarshal case data: %v", err)
	}

	log.Printf("Successfully parsed case with ID: %s, Title: %s", newCase.ID, newCase.Title)

	// Validate that the case's current organization is JudgesOrg
	if newCase.CurrentOrg != "JudgesOrg" {
		return fmt.Errorf("case %s is not currently assigned to JudgesOrg", newCase.ID)
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
	if newCase.Hearings == nil {
		newCase.Hearings = make([]Hearing, 0)
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

// GetCaseById retrieves a specific case by its ID
func (s *JudgeContract) GetCaseById(ctx contractapi.TransactionContextInterface, caseID string) (*Case, error) {
	log.Printf("GetCaseById called with ID: %s", caseID)

	// Get the case
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		log.Printf("Failed to read case: %v", err)
		return nil, fmt.Errorf("failed to read case: %v", err)
	}
	if caseJSON == nil {
		log.Printf("Case not found locally: %s. Trying to fetch from BenchClerk channel", caseID)
		// Try to fetch the case from BenchClerk channel
		return s.FetchAndStoreCaseFromBenchClerkChannel(ctx, caseID)
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
	if caseObj.Hearings == nil {
		caseObj.Hearings = make([]Hearing, 0)
	}

	log.Printf("Successfully retrieved case with ID: %s", caseID)
	return &caseObj, nil
}

// QueryStats gets statistics for judge dashboard
func (s *JudgeContract) QueryStats(ctx contractapi.TransactionContextInterface) (string, error) {
	log.Printf("QueryStats called")

	stats := struct {
		PendingCases      int `json:"pendingCases"`
		CompletedCases    int `json:"completedCases"`
		ScheduledHearings int `json:"scheduledHearings"`
		JudgmentsIssued   int `json:"judgmentsIssued"`
	}{}

	// Count pending cases
	pendingIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"PENDING_JUDGE_REVIEW","currentOrg":"JudgesOrg"}}`)
	if err == nil {
		for pendingIterator.HasNext() {
			stats.PendingCases++
			_, _ = pendingIterator.Next()
		}
		pendingIterator.Close()
	}

	// Count completed cases (judgments issued)
	completedIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"JUDGMENT_ISSUED"}}`)
	if err == nil {
		for completedIterator.HasNext() {
			stats.CompletedCases++
			_, _ = completedIterator.Next()
		}
		completedIterator.Close()
	}

	// Count scheduled hearings
	hearingQuery := fmt.Sprintf(`{"selector":{"hearings":{"$elemMatch":{"status":"SCHEDULED"}}}}`)
	hearingIterator, err := ctx.GetStub().GetQueryResult(hearingQuery)
	if err == nil {
		for hearingIterator.HasNext() {
			stats.ScheduledHearings++
			_, _ = hearingIterator.Next()
		}
		hearingIterator.Close()
	}

	// Count judgments issued
	judgmentIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"judgment":{"$ne":null}}}`)
	if err == nil {
		for judgmentIterator.HasNext() {
			stats.JudgmentsIssued++
			_, _ = judgmentIterator.Next()
		}
		judgmentIterator.Close()
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

// ForwardCaseToBenchClerk forwards a case with judgment to the BenchClerk's channel
func (s *JudgeContract) ForwardCaseToBenchClerk(ctx contractapi.TransactionContextInterface, caseID string) error {
	log.Printf("ForwardCaseToBenchClerk called for case ID: %s", caseID)

	// Get MSP ID of the submitting client
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Only JudgesOrg members should call this function
	if clientOrgID != "JudgesOrg" && clientOrgID != "JudgesOrgMSP" {
		return fmt.Errorf("this function can only be called by members of JudgesOrg")
	}

	// Get the case from Judge's ledger
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
		return fmt.Errorf("failed to unmarshal case data: %v", err)
	}

	// Verify case has a judgment
	if caseObj.Judgment == nil {
		return fmt.Errorf("case must have a judgment recorded before forwarding to BenchClerk")
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Update case status for forwarding to bench clerk
	caseObj.Status = "JUDGMENT_ISSUED"
	caseObj.CurrentOrg = "BenchClerksOrg"
	caseObj.LastModified = timestamp

	// Add history item
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       "JUDGMENT_ISSUED",
		Organization: "JudgesOrg",
		Timestamp:    timestamp,
		Comments:     "Judgment issued and case forwarded to BenchClerk",
	})

	// Marshal the updated case data
	updatedCaseJSON, err := json.Marshal(caseObj)
	if err != nil {
		return fmt.Errorf("failed to marshal updated case data: %v", err)
	}

	// Update case in Judge's ledger
	err = ctx.GetStub().PutState(caseID, updatedCaseJSON)
	if err != nil {
		return fmt.Errorf("failed to update case in Judge's ledger: %v", err)
	}

	// Forward the case to BenchClerk through cross-channel invocation
	// Convert the JSON byte array to string as the BenchClerk expects a string parameter
	caseJSONStr := string(updatedCaseJSON)
	args := [][]byte{[]byte("StoreCase"), []byte(caseJSONStr)}
	response := ctx.GetStub().InvokeChaincode("benchclerk", args, "benchclerk-judge-channel")

	// Check if the BenchClerk chaincode response is successful
	if response.Status != 200 {
		errMsg := fmt.Sprintf("Failed to forward case to BenchClerk: %s", string(response.Message))
		log.Printf(errMsg)

		// Revert the status change in case of failure
		caseObj.Status = "DECISION_RECORDED"
		caseObj.CurrentOrg = "JudgesOrg"
		revertJSON, _ := json.Marshal(caseObj)
		ctx.GetStub().PutState(caseID, revertJSON)

		return fmt.Errorf(errMsg)
	}

	log.Printf("Successfully forwarded case %s to BenchClerk", caseID)
	return nil
}

// FetchAndStoreCaseFromBenchClerkChannel fetches a case from BenchClerk channel when it doesn't exist locally
func (s *JudgeContract) FetchAndStoreCaseFromBenchClerkChannel(ctx contractapi.TransactionContextInterface, caseID string) (*Case, error) {
	log.Printf("FetchAndStoreCaseFromBenchClerkChannel called for case ID: %s", caseID)

	// Get MSP ID of the submitting client
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Only JudgesOrg members should call this function
	if clientOrgID != "JudgesOrg" && clientOrgID != "JudgesOrgMSP" {
		return nil, fmt.Errorf("this function can only be called by members of JudgesOrg")
	}

	// Invoke the benchclerk chaincode on the benchclerk-judge-channel to get the case
	args := [][]byte{[]byte("GetCaseById"), []byte(caseID)}
	response := ctx.GetStub().InvokeChaincode("benchclerk", args, "benchclerk-judge-channel")

	// Check the response status - 200 is OK in contractapi
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

	// Verify case is meant for Judge
	if caseData.CurrentOrg != "JudgesOrg" {
		return nil, fmt.Errorf("case %s is not currently assigned to JudgesOrg", caseID)
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

	// Update case with transfer info
	caseData.Status = "RECEIVED_BY_JUDGE"
	caseData.LastModified = timestamp

	// Add history item
	caseData.History = append(caseData.History, HistoryItem{
		Status:       "RECEIVED_BY_JUDGE",
		Organization: "JudgesOrg",
		Timestamp:    timestamp,
		Comments:     "Case transferred from BenchClerk to Judge",
	})

	// Store the case in Judge's ledger
	updatedCaseBytes, err := json.Marshal(caseData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal updated case data: %v", err)
	}

	if err := ctx.GetStub().PutState(caseID, updatedCaseBytes); err != nil {
		return nil, fmt.Errorf("failed to store case in Judge ledger: %v", err)
	}

	log.Printf("Successfully fetched and stored case %s from BenchClerk channel", caseID)
	return &caseData, nil
}

// GetJudgedCases returns all cases with judgment to be forwarded to BenchClerk
func (s *JudgeContract) GetJudgedCases(ctx contractapi.TransactionContextInterface) ([]*Case, error) {
	log.Printf("GetJudgedCases called")

	// Get MSP ID of the submitting client identity
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Check if the caller has proper authorization
	if clientOrgID != "JudgesOrg" && clientOrgID != "JudgesOrgMSP" &&
		clientOrgID != "BenchClerksOrg" && clientOrgID != "BenchClerksOrgMSP" {
		return nil, fmt.Errorf("only JudgesOrg or BenchClerksOrg member can get judged cases")
	}

	// Query all cases with judgment status
	queryString := fmt.Sprintf(`{"selector":{"status":"JUDGMENT_ISSUED","currentOrg":"BenchClerksOrg"}}`)

	// Execute the query
	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, fmt.Errorf("failed to get query result: %v", err)
	}
	defer resultsIterator.Close()

	var judgedCases []*Case
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

		judgedCases = append(judgedCases, &caseObj)
		log.Printf("Found judged case %s", caseObj.ID)
	}
	log.Printf("Returning %d judged cases", len(judgedCases))
	return judgedCases, nil
}

func main() {
	judgeChaincode, err := contractapi.NewChaincode(&JudgeContract{})
	if err != nil {
		log.Panicf("Error creating judge chaincode: %v", err)
	}

	if err := judgeChaincode.Start(); err != nil {
		log.Panicf("Error starting judge chaincode: %v", err)
	}
}
