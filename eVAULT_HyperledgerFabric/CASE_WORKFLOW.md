# eVAULT Case Workflow

## Overview
This document outlines the complete workflow for case processing in the eVAULT blockchain-based court management system.

---

## Workflow Stages

### 1. **Lawyer Stage** (LawyersOrg)
**Role:** Case Creation and Initial Filing

**Responsibilities:**
- Create new cases with all required information
- Upload supporting documents to IPFS
- Submit cases for processing
- Track case progress across all stages

**Actions:**
- Create Case
- Upload Evidence Documents
- View Case Status

**Stage Duration:** Until lawyer submits to Registrar

---

### 2. **Registrar Stage** (RegistrarsOrg)
**Role:** Departmental Categorization

**Responsibilities:**
- Receive cases from lawyers in queue (random allocation)
- Categorize cases by department (Civil, Criminal, Family, etc.)
- Forward categorized cases to Stamp Reporter
- **NO VERIFICATION** - Only categorization

**Actions:**
- Accept Case from Queue (Random Allocation)
- Categorize by Department
- Forward to Stamp Reporter

**Stage Duration:** Queue-based allocation, categorization time

---

### 3. **Stamp Reporter Stage** (StampReportersOrg)
**Role:** Procedural Verification and Digital Signature

**Responsibilities:**
- Receive cases from Registrar in queue (random allocation)
- **Verify procedural compliance** (completeness of documents, proper format)
- Apply digital signatures to valid filings
- **Reject incomplete cases** with detailed reasons
- Forward verified cases to Bench Clerk

**Actions:**
- Accept Case from Queue (Random Allocation)
- Verify Document Completeness
- Check Procedural Compliance
- Apply Digital Signature (if valid)
- Reject with Reasons (if incomplete)
- Forward to Bench Clerk (if verified)

**Possible Outcomes:**
- ✅ **VERIFIED** → Forward to Bench Clerk
- ❌ **REJECTED** → Return to Lawyer with reasons

**Stage Duration:** Queue-based allocation, verification time

---

### 4. **Bench Clerk Stage** (BenchClerksOrg)
**Role:** Case Filing and Judge Assignment

**Responsibilities:**
- File verified cases in the system
- Assign cases to appropriate judges
- Update case statuses throughout the process
- Schedule hearings

**Actions:**
- File Verified Cases
- Assign Judge (using ForwardToJudge function)
- Update Case Status
- Schedule Hearing Dates

**Stage Duration:** Until case is forwarded to assigned Judge

---

### 5. **Judge Stage** (JudgesOrg)
**Role:** Review and Judgment

**Responsibilities:**
- Review verified filings and evidence
- Evaluate all case documents
- Conduct hearings
- Record judgments in the blockchain system
- Make final decisions

**Actions:**
- Review Case Documents
- Evaluate Evidence
- Conduct Hearings
- Record Judgment
- Update Final Decision

**Final Outcomes:**
- Decision Recorded
- Case Closed

---

## Stage Tracking in UI

### Cases Page Display
**Current Stage Column** shows:
- 🔵 **With Lawyer** (LawyersOrg) - Initial stage
- 🟠 **With Registrar (Queue)** (RegistrarsOrg) - Awaiting categorization
- 🔵 **With Stamp Reporter (Verification)** (StampReportersOrg) - Under verification
- 🟣 **With Bench Clerk** (BenchClerksOrg) - Filing and judge assignment
- 🟢 **With Judge (Review)** (JudgesOrg) - Final review and judgment

---

## Key Clarifications

### Registrar Role
- **Does NOT verify** documents
- **Only categorizes** by department
- Cases allocated from queue randomly

### Stamp Reporter Role
- **Only procedural verification** (completeness, format)
- **NOT content evaluation** (that's Judge's role)
- Can reject incomplete filings
- Must provide reasons for rejection
- Applies digital signature when verified

### Bench Clerk Role
- **Does NOT verify** (already done by Stamp Reporter)
- Files cases and assigns judges
- Uses `ForwardToJudge` function to assign
- Manages case status updates

### Judge Role
- **Final authority** on case content
- Reviews evidence and makes decisions
- Records judgment on blockchain

---

## Associated Judge Field

**Important:** The `associatedJudge` field in the Case struct:
- Remains **empty** when lawyer creates case
- Remains **empty** through Registrar and Stamp Reporter stages
- Is **filled by Bench Clerk** using `ForwardToJudge` function
- Contains Judge ID after assignment

**Lawyers CANNOT** assign judges - this maintains judicial independence and proper case allocation.

---

## Random Queue Allocation

Both Registrar and Stamp Reporter receive cases through **random queue allocation** to:
- Ensure fair distribution of workload
- Prevent case cherry-picking
- Maintain transparency
- Balance caseload across officials

---

## Document Flow

1. **Lawyer** → Uploads to IPFS, stores hash on blockchain
2. **Registrar** → Reviews document categories
3. **Stamp Reporter** → Verifies document completeness, applies signature
4. **Bench Clerk** → Files documents officially
5. **Judge** → Reviews all documents for judgment

---

## Blockchain Data

All stages are tracked on the Hyperledger Fabric blockchain with:
- Immutable case history
- Timestamp for each stage transition
- Digital signatures at verification
- Complete audit trail
- Decentralized storage of document hashes (IPFS)

---

## Current Implementation Status

✅ Lawyer case creation with IPFS upload
✅ Case tracking across all stages
✅ Dashboard with statistics
✅ Stage-based filtering in Cases page
✅ Timestamp tracking (createdAt, lastModified)
✅ Judge assignment by Bench Clerk only

🔄 Queue allocation system (to be implemented)
🔄 Rejection workflow with reasons
🔄 Digital signature application
🔄 Hearing scheduling

---

Last Updated: December 7, 2025
