# Critical Architecture Issues & Solutions

## Issue 1: LocalStorage Authentication ❌

**Current Problem:**
- User credentials stored in localStorage
- Same localStorage shared across all tabs
- When user logs in on Tab 2, Tab 1 gets overwritten
- No proper session management

**Why This is Wrong:**
- localStorage is client-side only, not secure
- All tabs share same localStorage
- No server-side validation
- Easy to manipulate in browser

**Correct Solution:**
```
User Login → MongoDB Validation → Generate JWT Token → Store Token → Use Token for API calls
```

## Issue 2: Case Linking Between Blockchain & MongoDB ❌

**Current Problem:**
- Cases stored on Hyperledger Fabric blockchain
- Trying to link using MongoDB `user_id`
- MongoDB has no case records
- Blockchain has no `user_id` field

**Why This is Wrong:**
- Blockchain and MongoDB are separate systems
- user_id from MongoDB (_id) doesn't exist on blockchain
- Blockchain uses `createdBy` (lawyer name/ID from blockchain identity)

**Correct Solution:**
Cases should be linked by:
1. **Blockchain Identity** - Use Fabric CA identity (lawyersorgadmin, etc.)
2. **User Mapping** - Map MongoDB user email → Blockchain identity
3. **Query by Creator** - Query blockchain by `createdBy` field

## Issue 3: Multiple Users on Different Tabs ❌

**Current Problem:**
```
Tab 1: User A logs in → localStorage stores User A
Tab 2: User B logs in → localStorage stores User B
Tab 1: Now shows User B's data (overwritten!)
```

**Solutions:**

### Option 1: Session Storage (Tab-specific)
```javascript
// Use sessionStorage instead of localStorage
sessionStorage.setItem('user_data', JSON.stringify(user));
```
- Each tab has its own sessionStorage
- Cleared when tab closes

### Option 2: JWT Tokens with Server Sessions
```javascript
// Login returns JWT token
const token = response.data.token;
// Store token
sessionStorage.setItem('auth_token', token);
// Send token with each request
headers: { 'Authorization': `Bearer ${token}` }
```

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  - React App                                                 │
│  - sessionStorage for user session (tab-specific)           │
│  - JWT token for API authentication                         │
└──────────────┬──────────────────────────────────────────────┘
               │
               ├─────────────────┬──────────────────────────────┐
               │                 │                              │
┌──────────────▼───────┐  ┌─────▼──────────┐  ┌──────────────▼──────┐
│   FastAPI Backend    │  │  Fabric API    │  │  Hyperledger Fabric │
│   (Port 3000)        │  │  (Port 8000)   │  │  Blockchain Network │
│                      │  │                │  │                     │
│  - User Auth (JWT)   │  │  - Chaincode   │  │  - Lawyer Contract  │
│  - MongoDB queries   │  │  - Network API │  │  - Registrar        │
│  - Session mgmt      │  │  - CA Client   │  │  - Cases on chain   │
└──────────┬───────────┘  └────────────────┘  └─────────────────────┘
           │
           │
┌──────────▼───────────┐
│      MongoDB         │
│                      │
│  - users_collection  │
│  - profile_collection│
│  - NO case_collection│
└──────────────────────┘
```

## How to Link Cases to Users

### Step 1: User Registration
```python
# In MongoDB
{
  "_id": ObjectId("..."),
  "username": "John Doe",
  "email": "john@law.com",
  "user_type": "lawyer",
  "fabric_identity": "lawyersorgadmin"  # ← Link to blockchain identity
}
```

### Step 2: Case Creation
```javascript
// In Blockchain
{
  "id": "CASE_123",
  "createdBy": "john@law.com",  # ← Use email or username
  "associatedLawyers": ["john@law.com"],
  ...
}
```

### Step 3: Query Cases
```javascript
// Get user's cases
const user = getUserFromSession(); // From JWT token
const email = user.email;

// Query blockchain
const cases = await contract.evaluateTransaction(
  'GetCasesByLawyer', 
  email
);
```

## Implementation Steps

1. **Remove localStorage for authentication**
2. **Implement JWT tokens**
3. **Use sessionStorage for tab-specific data**
4. **Add email/username to blockchain case records**
5. **Query blockchain by user email, not MongoDB _id**
6. **Remove case_collection from MongoDB** (if exists)

## Auto-Submit Issue

The auto-submit after 2-3 seconds is likely:
- The success message setTimeout (line 219)
- But that should only trigger AFTER successful API response

Check:
1. Is the form actually submitting to backend?
2. Or is it just moving to next step automatically?
3. Check browser console for errors/logs

