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

func main() {
	benchClerkChaincode, err := contractapi.NewChaincode(&BenchClerkContract{})
	if err != nil {
		log.Panicf("Error creating bench clerk chaincode: %v", err)
	}

	if err := benchClerkChaincode.Start(); err != nil {
		log.Panicf("Error starting bench clerk chaincode: %v", err)
	}
}
