# E-VAULT: Blockchain-Based Legal Document Management System

## Overview
E-VAULT is a secure, tamper-proof blockchain platform for managing legal documents in the Indian judicial system using Hyperledger Fabric. The system provides end-to-end document lifecycle management from case filing to verdict delivery.

## System Architecture

### Organizations
- LawyersOrg: Case file management
- RegistrarsOrg (DeskBabu): Initial verification
- StampReportersOrg: Detailed verification
- BenchClerksOrg: Court documentation
- JudgesOrg: Legal proceedings

### Technical Stack
- **Blockchain**: Hyperledger Fabric
- **Storage**: IPFS for documents, CouchDB for world state
- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Fabric SDK
- **Network**: Single channel (eva-channel)

## Project Structure
```
├── network/                    # Hyperledger Fabric network configuration
│   ├── organizations/         # Crypto material and MSP configs
│   └── scripts/              # Network setup scripts
├── chaincode/                 # Smart contracts
│   ├── case-contract/        # Case management logic
│   └── access-control/       # Role-based access control
├── backend/                   # Node.js backend server
│   ├── api/                  # REST API endpoints
│   └── fabric/               # Fabric SDK integration
├── frontend/                  # React.js frontend application
│   └── src/                  # Frontend source code
└── docs/                     # Project documentation
```

## Setup Instructions
1. Set up the Hyperledger Fabric network
2. Deploy the chaincodes
3. Start the backend server
4. Launch the frontend application

## Development Status
🚧 Under Development
