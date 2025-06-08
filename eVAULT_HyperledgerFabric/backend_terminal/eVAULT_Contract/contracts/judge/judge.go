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

	// Parse judgment details
	var details struct {
		Decision  string `json:"decision"`
		Reasoning string `json:"reasoning"`
		JudgeID   string `json:"judgeId"`
	}
	err = json.Unmarshal([]byte(judgmentDetails), &details)
	if err != nil {
		return err
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
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
		return err
	}

	return ctx.GetStub().PutState(caseID, caseJSON)
}

// AddHearingNotes adds notes for a case hearing
func (s *JudgeContract) AddHearingNotes(ctx contractapi.TransactionContextInterface, caseID string, hearingDetails string) error {
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

	// Parse hearing details
	var details struct {
		HearingDate string `json:"hearingDate"`
		Notes       string `json:"notes"`
	}
	err = json.Unmarshal([]byte(hearingDetails), &details)
	if err != nil {
		return err
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
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
		return err
	}

	return ctx.GetStub().PutState(caseID, caseJSON)
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
