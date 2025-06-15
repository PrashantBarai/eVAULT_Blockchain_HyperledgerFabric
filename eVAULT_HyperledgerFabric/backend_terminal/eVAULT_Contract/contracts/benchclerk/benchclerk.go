package benchclerk

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
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
	Decision          string        `json:"decision"`
}

// Judge represents a judicial officer in the system
type Judge struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Division string `json:"division"`
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

// BenchClerkContract provides functions for managing bench clerk activities in eVAULT
type BenchClerkContract struct {
	contractapi.Contract
}

// InitLedger initializes the bench clerk contract ledger with sample data
func (bc *BenchClerkContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	// Sample judges
	judges := []Judge{
		{ID: "J001", Name: "Hon. Justice Patel", Division: "Civil"},
		{ID: "J002", Name: "Hon. Justice Sharma", Division: "Criminal"},
		{ID: "J003", Name: "Hon. Justice Singh", Division: "Commercial"},
	}

	for _, judge := range judges {
		judgeJSON, err := json.Marshal(judge)
		if err != nil {
			return err
		}
		if err := ctx.GetStub().PutState("JUDGE_"+judge.ID, judgeJSON); err != nil {
			return fmt.Errorf("failed to put judge data: %v", err)
		}
	}

	return nil
}

// ForwardToJudge forwards a verified case to a judge
func (s *BenchClerkContract) ForwardToJudge(ctx contractapi.TransactionContextInterface, caseID string, assignmentDetails string) error {
	log.Printf("ForwardToJudge called for case ID: %s", caseID)

	// Get the case
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		log.Printf("Failed to read case: %v", err)
		return fmt.Errorf("failed to read case: %v", err)
	}
	if caseJSON == nil {
		log.Printf("Case does not exist: %s", caseID)
		return fmt.Errorf("case does not exist: %s", caseID)
	}

	var caseObj Case
	err = json.Unmarshal(caseJSON, &caseObj)
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

	// Parse assignment details
	var details struct {
		JudgeID  string `json:"judgeId"`
		Comments string `json:"comments"`
	}
	err = json.Unmarshal([]byte(assignmentDetails), &details)
	if err != nil {
		return err
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Update case status and judge assignment
	caseObj.Status = "PENDING_JUDGE_REVIEW"
	caseObj.CurrentOrg = "JudgesOrg"
	caseObj.AssociatedJudge = details.JudgeID
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       "FORWARDED_TO_JUDGE",
		Organization: "BenchClerksOrg",
		Timestamp:    timestamp,
		Comments:     fmt.Sprintf("Case forwarded to judge (ID: %s). %s", details.JudgeID, details.Comments),
	})

	// Save updated case
	caseObj.LastModified = timestamp
	caseJSON, err = json.Marshal(caseObj)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(caseID, caseJSON)
}

// UpdateHearingDetails updates the hearing details for a case
func (s *BenchClerkContract) UpdateHearingDetails(ctx contractapi.TransactionContextInterface, caseID string, hearingDetails string) error {
	log.Printf("UpdateHearingDetails called for case ID: %s", caseID)

	// Get the case
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		log.Printf("Failed to read case: %v", err)
		return fmt.Errorf("failed to read case: %v", err)
	}
	if caseJSON == nil {
		log.Printf("Case does not exist: %s", caseID)
		return fmt.Errorf("case does not exist: %s", caseID)
	}

	var caseObj Case
	err = json.Unmarshal(caseJSON, &caseObj)
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

	// Parse hearing details
	var details struct {
		HearingDate string `json:"hearingDate"`
		Comments    string `json:"comments"`
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

	// Update case history with hearing details
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       "HEARING_SCHEDULED",
		Organization: "BenchClerksOrg",
		Timestamp:    timestamp,
		Comments:     fmt.Sprintf("Hearing scheduled for %s. %s", details.HearingDate, details.Comments),
	})

	// Save updated case
	caseObj.LastModified = timestamp
	caseJSON, err = json.Marshal(caseObj)
	if err != nil {
		log.Printf("Failed to marshal updated case: %v", err)
		return err
	}

	log.Printf("Successfully updated hearing details for case ID: %s", caseID)
	return ctx.GetStub().PutState(caseID, caseJSON)
}

// NotifyLawyer sends notifications to lawyers about case updates
func (s *BenchClerkContract) NotifyLawyer(ctx contractapi.TransactionContextInterface, caseID string, notificationDetails string) error {
	log.Printf("NotifyLawyer called for case ID: %s", caseID)

	// Get the case
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		log.Printf("Failed to read case: %v", err)
		return fmt.Errorf("failed to read case: %v", err)
	}
	if caseJSON == nil {
		log.Printf("Case does not exist: %s", caseID)
		return fmt.Errorf("case does not exist: %s", caseID)
	}

	var caseObj Case
	err = json.Unmarshal(caseJSON, &caseObj)
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

	// Parse notification details
	var details struct {
		NotificationType string `json:"notificationType"`
		Message          string `json:"message"`
	}
	err = json.Unmarshal([]byte(notificationDetails), &details)
	if err != nil {
		log.Printf("Failed to unmarshal notification details: %v", err)
		return err
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		log.Printf("Failed to get transaction timestamp: %v", err)
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Add notification to case history
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       fmt.Sprintf("NOTIFICATION_%s", details.NotificationType),
		Organization: "BenchClerksOrg",
		Timestamp:    timestamp,
		Comments:     details.Message,
	})

	// Save updated case
	caseObj.LastModified = timestamp
	caseJSON, err = json.Marshal(caseObj)
	if err != nil {
		log.Printf("Failed to marshal updated case: %v", err)
		return err
	}

	log.Printf("Successfully sent notification for case ID: %s", caseID)
	return ctx.GetStub().PutState(caseID, caseJSON)
}

// GetCaseDetails retrieves case details
func (bc *BenchClerkContract) GetCaseDetails(ctx contractapi.TransactionContextInterface, caseID string) (*Case, error) {
	log.Printf("GetCaseDetails called for case ID: %s", caseID)

	caseAsBytes, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		log.Printf("Failed to read case data: %v", err)
		return nil, fmt.Errorf("failed to read case data: %v", err)
	}
	if caseAsBytes == nil {
		log.Printf("Case %s does not exist", caseID)
		return nil, fmt.Errorf("case %s does not exist", caseID)
	}

	var caseData Case
	if err := json.Unmarshal(caseAsBytes, &caseData); err != nil {
		log.Printf("Failed to unmarshal case data: %v", err)
		return nil, err
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

	log.Printf("Successfully retrieved case with ID: %s", caseID)
	return &caseData, nil
}

// GetAllCases retrieves all cases from the ledger
func (bc *BenchClerkContract) GetAllCases(ctx contractapi.TransactionContextInterface) ([]*Case, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("CASE_", "")
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

		var caseData Case
		if err := json.Unmarshal(queryResponse.Value, &caseData); err != nil {
			return nil, err
		}
		cases = append(cases, &caseData)
	}

	return cases, nil
}

// GetAllJudges retrieves all judges from the ledger
func (bc *BenchClerkContract) GetAllJudges(ctx contractapi.TransactionContextInterface) ([]*Judge, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("JUDGE_", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var judges []*Judge
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var judge Judge
		if err := json.Unmarshal(queryResponse.Value, &judge); err != nil {
			return nil, err
		}
		judges = append(judges, &judge)
	}

	return judges, nil
}

// ConfirmJudgeDecision confirms and forwards the judge's decision to relevant parties
func (bc *BenchClerkContract) ConfirmJudgeDecision(ctx contractapi.TransactionContextInterface, caseID string) error {
	log.Printf("ConfirmJudgeDecision called for case ID: %s", caseID)

	caseAsBytes, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		log.Printf("Failed to read case data: %v", err)
		return fmt.Errorf("failed to read case data: %v", err)
	}
	if caseAsBytes == nil {
		log.Printf("Case %s does not exist", caseID)
		return fmt.Errorf("case %s does not exist", caseID)
	}

	var caseData Case
	if err := json.Unmarshal(caseAsBytes, &caseData); err != nil {
		log.Printf("Failed to unmarshal case data: %v", err)
		return err
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
	// Check if the case has a judgment to confirm
	// Looking for JUDGMENT_ISSUED status instead of checking Decision field
	if caseData.Status != "JUDGMENT_ISSUED" {
		log.Printf("Case %s has no judgment to confirm (status: %s)", caseID, caseData.Status)
		return fmt.Errorf("case %s has no judgment to confirm, status must be JUDGMENT_ISSUED", caseID)
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		log.Printf("Failed to get transaction timestamp: %v", err)
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339) // Update case status to indicate decision is confirmed
	caseData.Status = "DECISION_CONFIRMED"

	// Forward the confirmed decision to lawyers by changing the current organization
	caseData.CurrentOrg = "LawyersOrg"

	// Add to history
	caseData.History = append(caseData.History, HistoryItem{
		Status:       "DECISION_CONFIRMED",
		Organization: "BenchClerksOrg",
		Timestamp:    timestamp,
		Comments:     "Judge's decision confirmed by bench clerk and forwarded to lawyers",
	})

	// Create automatic notification for all associated lawyers
	if len(caseData.AssociatedLawyers) > 0 {
		lawyerNames := strings.Join(caseData.AssociatedLawyers, ", ")
		notificationMsg := fmt.Sprintf("Decision confirmed and forwarded to associated lawyers: %s", lawyerNames)
		log.Printf("%s", notificationMsg)

		caseData.History = append(caseData.History, HistoryItem{
			Status:       "LAWYERS_NOTIFIED",
			Organization: "BenchClerksOrg",
			Timestamp:    timestamp,
			Comments:     notificationMsg,
		})
	}

	// Update last modified timestamp
	caseData.LastModified = timestamp

	// Save updated case
	updatedCaseAsBytes, err := json.Marshal(caseData)
	if err != nil {
		log.Printf("Failed to marshal updated case: %v", err)
		return err
	}

	log.Printf("Successfully confirmed decision and forwarded to lawyers for case ID: %s", caseID)
	return ctx.GetStub().PutState(caseID, updatedCaseAsBytes)
}

// QueryCasesByStatus retrieves cases filtered by their status
func (bc *BenchClerkContract) QueryCasesByStatus(ctx contractapi.TransactionContextInterface, status string) ([]*Case, error) {
	queryString := fmt.Sprintf(`{"selector":{"status":"%s"}}`, status)

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

		var caseData Case
		if err := json.Unmarshal(queryResponse.Value, &caseData); err != nil {
			return nil, err
		}
		cases = append(cases, &caseData)
	}

	return cases, nil
}

// GetCaseById retrieves a specific case by its ID
func (bc *BenchClerkContract) GetCaseById(ctx contractapi.TransactionContextInterface, caseID string) (*Case, error) {
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

// QueryStats gets statistics for bench clerk dashboard
func (bc *BenchClerkContract) QueryStats(ctx contractapi.TransactionContextInterface) (string, error) {
	log.Printf("QueryStats called")

	stats := struct {
		PendingCases       int `json:"pendingCases"`
		ForwardedToJudge   int `json:"forwardedToJudge"`
		HearingsScheduled  int `json:"hearingsScheduled"`
		DecisionsConfirmed int `json:"decisionsConfirmed"`
	}{}

	// Count pending cases
	pendingIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"VALIDATED_BY_STAMP_REPORTER","currentOrg":"BenchClerksOrg"}}`)
	if err == nil {
		for pendingIterator.HasNext() {
			stats.PendingCases++
			_, _ = pendingIterator.Next()
		}
		pendingIterator.Close()
	}

	// Count cases forwarded to judges
	forwardedIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"PENDING_JUDGE_REVIEW","currentOrg":"JudgesOrg"}}`)
	if err == nil {
		for forwardedIterator.HasNext() {
			stats.ForwardedToJudge++
			_, _ = forwardedIterator.Next()
		}
		forwardedIterator.Close()
	}

	// Count cases with hearings scheduled
	hearingQuery := fmt.Sprintf(`{"selector":{"$or":[{"status":"HEARING_SCHEDULED"},{"history":{"$elemMatch":{"status":"HEARING_SCHEDULED"}}}]}}`)
	hearingIterator, err := ctx.GetStub().GetQueryResult(hearingQuery)
	if err == nil {
		for hearingIterator.HasNext() {
			stats.HearingsScheduled++
			_, _ = hearingIterator.Next()
		}
		hearingIterator.Close()
	}
	// Count confirmed decisions
	decisionIterator, err := ctx.GetStub().GetQueryResult(`{"selector":{"status":"DECISION_CONFIRMED"}}`)
	if err == nil {
		for decisionIterator.HasNext() {
			stats.DecisionsConfirmed++
			_, _ = decisionIterator.Next()
		}
		decisionIterator.Close()
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

// StoreCase stores a case submitted from another organization's chaincode
func (bc *BenchClerkContract) StoreCase(ctx contractapi.TransactionContextInterface, caseJSON string) error {
	log.Printf("StoreCase called with payload length: %d bytes", len(caseJSON))

	// Parse case data
	var newCase Case
	err := json.Unmarshal([]byte(caseJSON), &newCase)
	if err != nil {
		log.Printf("Failed to unmarshal case data: %v", err)
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

// ForwardCaseToLawyer forwards a case with judgment to the lawyer's channel
func (bc *BenchClerkContract) ForwardCaseToLawyer(ctx contractapi.TransactionContextInterface, caseID string) error {
	log.Printf("ForwardCaseToLawyer called for case ID: %s", caseID)

	// Get MSP ID of the submitting client
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Only BenchClerksOrg members should call this function
	if clientOrgID != "BenchClerksOrg" && clientOrgID != "BenchClerksOrgMSP" {
		return fmt.Errorf("this function can only be called by members of BenchClerksOrg")
	}

	// Declare case object
	var caseObj Case

	// Get the case from BenchClerk's ledger
	caseJSON, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return fmt.Errorf("failed to read case: %v", err)
	}

	if caseJSON == nil {
		// Case doesn't exist locally, try to fetch it from judge channel
		log.Printf("Case %s not found in benchclerk-lawyer-channel, attempting to fetch from benchclerk-judge-channel", caseID)

		// Create a function to fetch the case from benchclerk-judge-channel
		channelName := "benchclerk-judge-channel"
		args := [][]byte{[]byte("GetCaseById"), []byte(caseID)}
		log.Printf("Invoking GetCaseById on benchclerk chaincode in %s to fetch case", channelName)

		// Attempt cross-channel fetch
		response := ctx.GetStub().InvokeChaincode("benchclerk", args, channelName)
		if response.Status != 200 {
			return fmt.Errorf("case does not exist in either channel: %s, error: %s", caseID, string(response.Message))
		}

		// Parse the response and store it locally for forwarding
		err = json.Unmarshal(response.Payload, &caseObj)
		if err != nil {
			return fmt.Errorf("failed to unmarshal case from judge channel: %v", err)
		}
		log.Printf("Successfully fetched case %s from benchclerk-judge-channel", caseID)

		// Store the case locally first
		tempJSON, err := json.Marshal(caseObj)
		if err != nil {
			return fmt.Errorf("failed to marshal case data: %v", err)
		}
		err = ctx.GetStub().PutState(caseID, tempJSON)
		if err != nil {
			return fmt.Errorf("failed to store case locally: %v", err)
		}
		log.Printf("Successfully stored case %s in benchclerk-lawyer-channel", caseID)
	} else {
		// Case exists locally, parse it
		err = json.Unmarshal(caseJSON, &caseObj)
		if err != nil {
			return fmt.Errorf("failed to unmarshal case data: %v", err)
		}
	}

	// Verify case status - preferably forward cases with received judgments,
	// but allow other statuses for testing and troubleshooting
	allowedStatuses := map[string]bool{
		"JUDGMENT_RECEIVED": true,
		"JUDGMENT_ISSUED":   true,
	}

	if !allowedStatuses[caseObj.Status] {
		return fmt.Errorf("case status must be JUDGMENT_RECEIVED, JUDGMENT_ISSUED, or DECISION_CONFIRMED for forwarding to Lawyer, current status: %s", caseObj.Status)
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Update case status for forwarding to lawyer
	caseObj.Status = "DECISION_CONFIRMED"
	caseObj.CurrentOrg = "LawyersOrg"
	caseObj.LastModified = timestamp

	// Add history item
	caseObj.History = append(caseObj.History, HistoryItem{
		Status:       "DECISION_CONFIRMED",
		Organization: "BenchClerksOrg",
		Timestamp:    timestamp,
		Comments:     "Judgment confirmed and forwarded to lawyer",
	})

	// Marshal the updated case data
	updatedCaseJSON, err := json.Marshal(caseObj)
	if err != nil {
		return fmt.Errorf("failed to marshal updated case data: %v", err)
	}

	// Update case in BenchClerk's ledger
	err = ctx.GetStub().PutState(caseID, updatedCaseJSON)
	if err != nil {
		return fmt.Errorf("failed to update case in BenchClerk's ledger: %v", err)
	}

	// Forward the case to lawyer through cross-channel invocation
	// Convert the JSON byte array to string as the lawyer expects a string parameter
	caseJSONStr := string(updatedCaseJSON)
	args := [][]byte{[]byte("StoreCase"), []byte(caseJSONStr)}
	log.Printf("Invoking StoreCase on lawyer chaincode with case ID %s in benchclerk-lawyer-channel", caseID)
	response := ctx.GetStub().InvokeChaincode("lawyer", args, "benchclerk-lawyer-channel")

	// Check if the lawyer chaincode response is successful
	if response.Status != 200 {
		errMsg := fmt.Sprintf("Failed to forward case to lawyer: %s", string(response.Message))
		log.Printf(errMsg)

		// Revert the status change in case of failure
		caseObj.Status = "JUDGMENT_RECEIVED"
		caseObj.CurrentOrg = "BenchClerksOrg"
		revertJSON, _ := json.Marshal(caseObj)
		ctx.GetStub().PutState(caseID, revertJSON)

		return fmt.Errorf(errMsg)
	}

	log.Printf("Successfully forwarded case %s to lawyer", caseID)
	return nil
}

// FetchAndStoreCaseFromJudgeChannel fetches cases with judgment from the Judge organization
func (bc *BenchClerkContract) FetchAndStoreCaseFromJudgeChannel(ctx contractapi.TransactionContextInterface) error {
	log.Printf("FetchAndStoreCaseFromJudgeChannel called")

	// Get MSP ID of the submitting client
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Only BenchClerksOrg members should call this function
	if clientOrgID != "BenchClerksOrg" && clientOrgID != "BenchClerksOrgMSP" {
		return fmt.Errorf("this function can only be called by members of BenchClerksOrg")
	}

	// Invoke the GetJudgedCases function in the Judge chaincode to get all cases with judgment
	args := [][]byte{[]byte("GetJudgedCases")}
	response := ctx.GetStub().InvokeChaincode("judge", args, "benchclerk-judge-channel")

	// Check if the Judge chaincode response is successful
	if response.Status != 200 {
		errMsg := fmt.Sprintf("Failed to fetch judged cases from Judge: %s", string(response.Message))
		log.Printf(errMsg)
		return fmt.Errorf(errMsg)
	}

	// If no cases were found, return without error
	if string(response.Payload) == "[]" {
		log.Printf("No judged cases to fetch from Judge")
		return nil
	}

	// Parse the response payload which should be a JSON array of cases
	var judgedCases []Case
	err = json.Unmarshal(response.Payload, &judgedCases)
	if err != nil {
		return fmt.Errorf("failed to unmarshal judged cases: %v", err)
	}

	log.Printf("Fetched %d judged cases from Judge", len(judgedCases))

	// Store each case in BenchClerk's ledger
	for _, caseObj := range judgedCases {
		// Verify the case has a judgment and the current org is BenchClerksOrg
		if caseObj.Status != "JUDGMENT_ISSUED" || caseObj.CurrentOrg != "BenchClerksOrg" {
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

		// Update case status to indicate judgment has been received
		caseObj.Status = "JUDGMENT_RECEIVED"
		caseObj.LastModified = timestamp

		// Add history item
		caseObj.History = append(caseObj.History, HistoryItem{
			Status:       "JUDGMENT_RECEIVED",
			Organization: "BenchClerksOrg",
			Timestamp:    timestamp,
			Comments:     fmt.Sprintf("Judgment received from Judge: %s", caseObj.Decision),
		})

		// Marshal the updated case
		caseJSON, err := json.Marshal(caseObj)
		if err != nil {
			log.Printf("Failed to marshal case %s: %v", caseObj.ID, err)
			continue
		}

		// Store the case in BenchClerk's ledger
		err = ctx.GetStub().PutState(caseObj.ID, caseJSON)
		if err != nil {
			log.Printf("Failed to store case %s: %v", caseObj.ID, err)
			continue
		}

		log.Printf("Successfully stored case %s with judgment in BenchClerk's ledger", caseObj.ID)
	}

	return nil
}

// FetchAndStoreCaseFromStampReporterChannel fetches a case from StampReporter channel when it doesn't exist locally
func (bc *BenchClerkContract) FetchAndStoreCaseFromStampReporterChannel(ctx contractapi.TransactionContextInterface, caseID string) (*Case, error) {
	log.Printf("FetchAndStoreCaseFromStampReporterChannel called for case ID: %s", caseID)

	// Get MSP ID of the submitting client
	clientOrgID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return nil, fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	// Only BenchClerksOrg members should call this function
	if clientOrgID != "BenchClerksOrg" && clientOrgID != "BenchClerksOrgMSP" {
		return nil, fmt.Errorf("this function can only be called by members of BenchClerksOrg")
	}

	// Invoke the benchclerk chaincode on the stampreporter-benchclerk-channel to get the case
	args := [][]byte{[]byte("GetCaseById"), []byte(caseID)}
	log.Printf("Invoking GetCaseById on benchclerk chaincode with case ID %s in stampreporter-benchclerk-channel", caseID)
	// Invoke the chaincode
	response := ctx.GetStub().InvokeChaincode("benchclerk", args, "stampreporter-benchclerk-channel")

	// Check the response status
	if response.Status != 200 {
		errMsg := fmt.Sprintf("Failed to fetch case from StampReporter channel: %s", string(response.Message))
		log.Printf(errMsg)
		return nil, fmt.Errorf(errMsg)
	}

	// Check if payload is empty
	if response.Payload == nil || len(response.Payload) == 0 {
		errMsg := fmt.Sprintf("Case data not found on StampReporter channel for ID: %s", caseID)
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

	// Verify case status should be for BenchClerk
	if caseData.CurrentOrg != "BenchClerksOrg" {
		return nil, fmt.Errorf("case %s is not currently assigned to BenchClerksOrg", caseID)
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

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction timestamp: %v", err)
	}
	timestamp := time.Unix(txTimestamp.Seconds, 0).Format(time.RFC3339)

	// Add receipt history
	caseData.History = append(caseData.History, HistoryItem{
		Status:       "RECEIVED_BY_BENCHCLERK",
		Organization: "BenchClerksOrg",
		Timestamp:    timestamp,
		Comments:     "Case retrieved from StampReporter channel",
	})

	// Update last modified timestamp
	caseData.LastModified = timestamp

	// Store the case in BenchClerk's ledger
	updatedCaseBytes, err := json.Marshal(caseData)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal updated case data: %v", err)
	}

	if err := ctx.GetStub().PutState(caseID, updatedCaseBytes); err != nil {
		return nil, fmt.Errorf("failed to store case in BenchClerk's ledger: %v", err)
	}

	log.Printf("Successfully fetched and stored case %s from StampReporter channel", caseID)
	return &caseData, nil
}

// This is the correct implementation - removed duplicate declaration

func main() {
	benchClerkChaincode, err := contractapi.NewChaincode(&BenchClerkContract{})
	if err != nil {
		log.Panicf("Error creating bench clerk chaincode: %v", err)
	}

	if err := benchClerkChaincode.Start(); err != nil {
		log.Panicf("Error starting bench clerk chaincode: %v", err)
	}
}
