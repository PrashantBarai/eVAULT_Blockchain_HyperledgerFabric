# eVAULT Hyperledger Fabric API

This is a Node.js REST API for interacting with eVAULT Hyperledger Fabric blockchain network.

## Prerequisites

- Node.js v16.0.0 or higher
- npm v7.0.0 or higher
- Running Hyperledger Fabric network with eVAULT chaincodes deployed

## Installation

```bash
cd /home/quantum_pulse/TE_Code/eVAULT_HyperledgerFabric/backend_terminal/fabric-api
npm install
```

## Running the API

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

The API will be available at http://localhost:3000

## API Endpoints

The API is organized into five main sections, one for each organization:

### Registrar API

- `GET /api/registrar/cases/pending` - Get pending cases
- `GET /api/registrar/cases/verified` - Get verified cases
- `GET /api/registrar/case/:caseID` - Get case by ID
- `POST /api/registrar/case/verify` - Verify a case
- `POST /api/registrar/case/assign` - Assign case to stamp reporter
- `POST /api/registrar/case/receive` - Receive a new case
- `PUT /api/registrar/case/update` - Update case details
- `POST /api/registrar/case/fetch-from-lawyer` - Fetch and store case from lawyer channel
- `GET /api/registrar/stats` - Get case statistics

### Stamp Reporter API

- `GET /api/stampreporter/cases/pending` - Get pending cases
- `GET /api/stampreporter/cases/rejected` - Get rejected cases
- `GET /api/stampreporter/cases/onhold` - Get on hold cases
- `GET /api/stampreporter/case/:caseID` - Get case by ID
- `POST /api/stampreporter/case/validate` - Validate documents for a case
- `POST /api/stampreporter/case/forward-to-benchclerk` - Forward case to bench clerk
- `POST /api/stampreporter/case/forward-to-lawyer` - Forward case to lawyer
- `POST /api/stampreporter/case/fetch-from-registrar` - Fetch and store case from registrar channel
- `POST /api/stampreporter/case/sync-across-channels` - Sync case across channels
- `POST /api/stampreporter/cases/fetch-all-pending` - Get all pending cases from registrar
- `GET /api/stampreporter/stats` - Get case statistics

### Lawyer API

- `POST /api/lawyer/case/create` - Create a new case
- `POST /api/lawyer/case/submit` - Submit case to registrar
- `GET /api/lawyer/case/:caseID` - Get case by ID
- `PUT /api/lawyer/case/update` - Update case details
- `GET /api/lawyer/cases/filter` - Get cases by filter
- `POST /api/lawyer/case/add-document` - Add document to case
- `GET /api/lawyer/decisions/confirmed` - Get confirmed decisions
- `GET /api/lawyer/judgment/:caseID` - View judgment details
- `GET /api/lawyer/cases/all` - Get all cases
- `GET /api/lawyer/cases/by-lawyer/:lawyerID` - Get cases by lawyer ID
- `GET /api/lawyer/case/track/:caseID` - Track case status
- `GET /api/lawyer/stats` - Get case statistics

### Judge API

- `POST /api/judge/judgment/record` - Record judgment for a case
- `POST /api/judge/hearing/add-notes` - Add hearing notes to case
- `POST /api/judge/case/store` - Store a case
- `GET /api/judge/case/:caseID` - Get case by ID
- `POST /api/judge/case/forward-to-benchclerk` - Forward case to bench clerk
- `POST /api/judge/case/fetch-from-benchclerk` - Fetch and store case from bench clerk channel
- `GET /api/judge/cases/judged` - Get judged cases
- `GET /api/judge/stats` - Get case statistics

### Bench Clerk API

- `POST /api/benchclerk/case/forward-to-judge` - Forward case to judge
- `PUT /api/benchclerk/case/update-hearing` - Update hearing details
- `POST /api/benchclerk/case/notify-lawyer` - Notify lawyer
- `GET /api/benchclerk/case/details/:caseID` - Get case details
- `GET /api/benchclerk/case/:caseID` - Get case by ID
- `POST /api/benchclerk/case/store` - Store case
- `POST /api/benchclerk/case/fetch-from-stampreporter` - Fetch and store case from stamp reporter channel
- `POST /api/benchclerk/cases/fetch-from-judge` - Fetch and store cases from judge channel
- `GET /api/benchclerk/stats` - Get case statistics

## Folder Structure

```
fabric-api/
├── index.js
├── package.json
├── logs/
└── src/
    ├── config/
    │   └── config.js
    ├── controllers/
    │   ├── benchClerkController.js
    │   ├── judgeController.js
    │   ├── lawyerController.js
    │   ├── registrarController.js
    │   └── stampReporterController.js
    ├── fabric/
    │   └── network.js
    ├── routes/
    │   ├── benchClerkRoutes.js
    │   ├── judgeRoutes.js
    │   ├── lawyerRoutes.js
    │   ├── registrarRoutes.js
    │   └── stampReporterRoutes.js
    └── utils/
        └── logger.js
```
