# eVAULT Fabric CA Client Integration Guide

This guide explains how to use the Fabric CA client to interact with your eVAULT Hyperledger Fabric network.

## 🚀 Quick Start

### 1. Initialize CA Clients
```bash
curl -X POST http://localhost:3001/api/ca/initialize
```

### 2. Check CA Health
```bash
curl -X GET http://localhost:3001/api/ca/health
```

### 3. Register a New User
```bash
curl -X POST http://localhost:3001/api/ca/register-user \
  -H "Content-Type: application/json" \
  -d '{
    "orgName": "LawyersOrg",
    "userId": "lawyer123",
    "userType": "lawyer",
    "email": "lawyer123@example.com",
    "licenseId": "LAW123"
  }'
```

## 📋 API Endpoints

### CA Administration

#### Initialize All Organizations
- **POST** `/api/ca/initialize`
- **Description**: Initialize all CA clients and enroll admin users
- **Response**: Status of initialization for each organization

#### Enroll Admin for Organization
- **POST** `/api/ca/enroll-admin/:orgName`
- **Body**: `{ "adminUserId": "admin", "adminPassword": "password" }` (optional)
- **Description**: Enroll admin user for a specific organization

#### CA Health Check
- **GET** `/api/ca/health`
- **Description**: Check health status of all CA services

### User Management

#### Register New User
- **POST** `/api/ca/register-user`
- **Body**:
```json
{
  "orgName": "LawyersOrg",
  "userId": "lawyer123",
  "userRole": "client",
  "userType": "lawyer",
  "affiliation": "lawyer",
  "email": "lawyer123@example.com",
  "licenseId": "LAW123"
}
```

#### Get Organization Users
- **GET** `/api/ca/users/:orgName`
- **Description**: List all enrolled users in an organization

#### Remove User
- **DELETE** `/api/ca/user/:orgName/:userId`
- **Description**: Remove user from organization wallet

#### Check User Exists
- **GET** `/api/ca/user-exists/:orgName/:userId`
- **Description**: Check if user exists in organization

### Organization Information

#### Get All Organizations
- **GET** `/api/ca/organizations`
- **Description**: List all supported organizations

#### Get Organization Details
- **GET** `/api/ca/organization/:orgName`
- **Description**: Get detailed information about an organization

### Integration

#### Register User from Client Backend
- **POST** `/api/ca/register-from-backend`
- **Body**:
```json
{
  "userType": "lawyer",
  "username": "john_lawyer",
  "email": "john@example.com",
  "licenseId": "LAW123",
  "password": "securepass"
}
```

## 🏢 Supported Organizations

| Organization | MSP ID | User Types | Affiliations |
|-------------|---------|------------|-------------|
| LawyersOrg | LawyersOrgMSP | lawyer | lawyer, lawyer.senior, lawyer.junior |
| RegistrarsOrg | RegistrarsOrgMSP | registrar | registrar, registrar.senior |
| StampReportersOrg | StampReportersOrgMSP | stampreporter | stampreporter, stampreporter.senior |
| BenchClerksOrg | BenchClerksOrgMSP | benchclerk | benchclerk, benchclerk.senior |
| JudgesOrg | JudgesOrgMSP | judge | judge, judge.senior, judge.chief |

## 🔧 Integration with Your FastAPI Backend

### 1. Register Users from FastAPI
When users sign up in your FastAPI backend, also register them on the blockchain:

```python
import httpx

async def register_blockchain_user(user_data):
    fabric_api_url = "http://localhost:3001/api/ca/register-from-backend"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(fabric_api_url, json={
            "userType": user_data["user_type"],
            "username": user_data["username"],
            "email": user_data["email"],
            "licenseId": user_data["licenseId"]
        })
        
        if response.status_code == 201:
            blockchain_data = response.json()
            # Store blockchain ID in your MongoDB
            return blockchain_data
        else:
            raise Exception("Blockchain registration failed")
```

### 2. Update Your FastAPI Signup
```python
@app.post("/signup")
async def signup(user_data: UserCreate):
    try:
        # Create user in MongoDB (existing code)
        mongodb_user = users_collection.insert_one(user_data.dict())
        
        # Register user on blockchain
        blockchain_result = await register_blockchain_user(user_data.dict())
        
        # Update MongoDB user with blockchain ID
        users_collection.update_one(
            {"_id": mongodb_user.inserted_id},
            {"$set": {"blockchain_id": blockchain_result["blockchain"]["userId"]}}
        )
        
        return {
            "message": "User registered successfully",
            "mongodb_id": str(mongodb_user.inserted_id),
            "blockchain_id": blockchain_result["blockchain"]["userId"]
        }
        
    except Exception as e:
        # Cleanup if needed
        return {"error": str(e)}
```

### 3. Submit Cases to Blockchain
```python
async def submit_case_to_blockchain(case_data, user_blockchain_id):
    fabric_api_url = "http://localhost:3001/api/lawyer/case/create"
    
    blockchain_case = {
        "id": case_data["case_id"],
        "caseNumber": case_data["case_id"],
        "title": case_data["case_subject"],
        "type": case_data["case_type"],
        "description": case_data["description"],
        "clientName": case_data["client"],
        "lawyerId": user_blockchain_id,
        "createdBy": user_blockchain_id
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{fabric_api_url}", json={
            "caseData": blockchain_case
        })
        
        return response.json()
```

## 🎯 Testing Your CA Integration

### 1. Test CA Initialization
```bash
# Initialize all CAs
curl -X POST http://localhost:3001/api/ca/initialize

# Check health
curl -X GET http://localhost:3001/api/ca/health
```

### 2. Test User Registration
```bash
# Register a lawyer
curl -X POST http://localhost:3001/api/ca/register-user \
  -H "Content-Type: application/json" \
  -d '{
    "orgName": "LawyersOrg",
    "userId": "testlawyer",
    "userType": "lawyer"
  }'

# Check if user exists
curl -X GET http://localhost:3001/api/ca/user-exists/LawyersOrg/testlawyer
```

### 3. Test Blockchain Case Creation
```bash
# Create a case (after user registration)
curl -X POST http://localhost:3001/api/lawyer/case/create \
  -H "Content-Type: application/json" \
  -d '{
    "caseData": {
      "id": "CASE-TEST-123",
      "caseNumber": "CASE-TEST-123",
      "title": "Test Case",
      "type": "Civil",
      "description": "Test case description",
      "clientName": "Test Client",
      "lawyerId": "testlawyer",
      "createdBy": "testlawyer"
    }
  }'
```

## 🔄 Workflow Integration

### Complete User Journey:
1. **User signs up** in React frontend
2. **FastAPI backend** creates MongoDB record
3. **FastAPI calls** Fabric API to register blockchain identity
4. **User submits case** through React frontend
5. **FastAPI backend** creates MongoDB case record
6. **FastAPI calls** Fabric API to create immutable blockchain record
7. **Case flows** through blockchain workflow (lawyer → registrar → stamp reporter → etc.)

### Benefits:
- ✅ **Dual storage**: MongoDB for fast queries, blockchain for immutability
- ✅ **Identity management**: Proper CA-based user enrollment
- ✅ **Auditability**: All case actions recorded on blockchain
- ✅ **Flexibility**: Can query either MongoDB or blockchain as needed

## 🚨 Error Handling

The CA client includes comprehensive error handling:
- Missing identities trigger auto-enrollment
- Network connection failures are logged and reported
- Invalid organizations return proper error codes
- User registration conflicts are handled gracefully

## 📝 Next Steps

1. **Initialize your CA clients**: `POST /api/ca/initialize`
2. **Test user registration**: Register a test user for each organization
3. **Integrate with FastAPI**: Add blockchain registration to your signup flow
4. **Test case submission**: Submit test cases through the blockchain
5. **Monitor and debug**: Use the health endpoints to monitor system status

Your eVAULT system now has full Fabric CA integration! 🎉