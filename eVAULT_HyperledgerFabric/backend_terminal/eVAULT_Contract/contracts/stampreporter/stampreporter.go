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

	return ctx.GetStub().PutState(caseID, caseJSON)
}

// GetPendingCases retrieves cases pending stamp reporter validation
func (s *StampReporterContract) GetPendingCases(ctx contractapi.TransactionContextInterface) ([]*Case, error) {
	queryString := `{
        "selector": {
            "status": "PENDING_STAMP_REPORTER_REVIEW",
            "currentOrg": "StampReportersOrg"
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

		var caseObj Case
		err = json.Unmarshal(queryResponse.Value, &caseObj)
		if err != nil {
			return nil, err
		}

		cases = append(cases, &caseObj)
	}

	return cases, nil
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
