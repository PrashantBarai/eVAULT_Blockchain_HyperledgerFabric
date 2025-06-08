package judge

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

func main() {
	judgeChaincode, err := contractapi.NewChaincode(&JudgeContract{})
	if err != nil {
		log.Panicf("Error creating judge chaincode: %v", err)
	}

	if err := judgeChaincode.Start(); err != nil {
		log.Panicf("Error starting judge chaincode: %v", err)
	}
}
