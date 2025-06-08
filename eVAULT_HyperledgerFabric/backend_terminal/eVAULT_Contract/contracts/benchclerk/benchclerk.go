package benchclerk

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
		Comments    string `json:"comments"`
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
		return err
	}

	return ctx.GetStub().PutState(caseID, caseJSON)
}

// NotifyLawyer sends notifications to lawyers about case updates
func (s *BenchClerkContract) NotifyLawyer(ctx contractapi.TransactionContextInterface, caseID string, notificationDetails string) error {
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

	// Parse notification details
	var details struct {
		NotificationType string `json:"notificationType"`
		Message          string `json:"message"`
	}
	err = json.Unmarshal([]byte(notificationDetails), &details)
	if err != nil {
		return err
	}

	// Get current timestamp
	txTimestamp, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
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
		return err
	}

	return ctx.GetStub().PutState(caseID, caseJSON)
}

// GetCaseDetails retrieves case details
func (bc *BenchClerkContract) GetCaseDetails(ctx contractapi.TransactionContextInterface, caseID string) (*Case, error) {
	caseAsBytes, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return nil, fmt.Errorf("failed to read case data: %v", err)
	}
	if caseAsBytes == nil {
		return nil, fmt.Errorf("case %s does not exist", caseID)
	}

	var caseData Case
	if err := json.Unmarshal(caseAsBytes, &caseData); err != nil {
		return nil, err
	}

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
	caseAsBytes, err := ctx.GetStub().GetState(caseID)
	if err != nil {
		return fmt.Errorf("failed to read case data: %v", err)
	}
	if caseAsBytes == nil {
		return fmt.Errorf("case %s does not exist", caseID)
	}

	var caseData Case
	if err := json.Unmarshal(caseAsBytes, &caseData); err != nil {
		return err
	}

	if caseData.Decision == "" {
		return fmt.Errorf("case %s has no decision to confirm", caseID)
	}

	// Update case status to indicate decision is confirmed
	caseData.Status = "Decision Confirmed"

	// Save updated case
	updatedCaseAsBytes, err := json.Marshal(caseData)
	if err != nil {
		return err
	}

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

func main() {
	benchClerkChaincode, err := contractapi.NewChaincode(&BenchClerkContract{})
	if err != nil {
		log.Panicf("Error creating bench clerk chaincode: %v", err)
	}

	if err := benchClerkChaincode.Start(); err != nil {
		log.Panicf("Error starting bench clerk chaincode: %v", err)
	}
}
