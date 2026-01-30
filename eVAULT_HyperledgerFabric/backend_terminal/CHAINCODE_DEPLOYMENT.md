# Chaincode Deployment Commands for eVAULT

## Prerequisites
Set the package ID after installing chaincode:
```bash
export CC_PACKAGE_ID=<your_package_id>
```

**Note:** Port is 9090 as per MICROFAB.txt configuration.

---

## Channel Membership Overview

| Channel | Members |
|---------|---------|
| lawyer-registrar-channel | LawyersOrg, RegistrarsOrg |
| registrar-stampreporter-channel | RegistrarsOrg, StampReportersOrg |
| stampreporter-lawyer-channel | StampReportersOrg, LawyersOrg |
| stampreporter-benchclerk-channel | StampReportersOrg, BenchClerksOrg |
| benchclerk-judge-channel | BenchClerksOrg, JudgesOrg |
| benchclerk-lawyer-channel | BenchClerksOrg, LawyersOrg |

---

## 1. LAWYER-REGISTRAR-CHANNEL

### Chaincodes: lawyer and registrar in LawyersOrg

**Approve (lawyer) in LawyersOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID lawyer-registrar-channel --name lawyer --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

**Commit (lawyer) in LawyersOrg:**
```bash
peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:9090 --channelID lawyer-registrar-channel --name lawyer --version 1 --sequence 1
```

**Approve (registrar) in LawyersOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID lawyer-registrar-channel --name registrar --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

---

### Chaincodes: registrar and lawyer in RegistrarsOrg

**Approve (registrar) in RegistrarsOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID lawyer-registrar-channel --name registrar --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

**Commit (registrar) in RegistrarsOrg:**
```bash
peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:9090 --channelID lawyer-registrar-channel --name registrar --version 1 --sequence 1
```

**Approve (lawyer) in RegistrarsOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID lawyer-registrar-channel --name lawyer --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

---

## 2. REGISTRAR-STAMPREPORTER-CHANNEL

### Chaincodes: registrar and stampreporter in RegistrarsOrg

**Approve (registrar) in RegistrarsOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID registrar-stampreporter-channel --name registrar --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

**Commit (registrar) in RegistrarsOrg:**
```bash
peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:9090 --channelID registrar-stampreporter-channel --name registrar --version 1 --sequence 1
```

**Approve (stampreporter) in RegistrarsOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID registrar-stampreporter-channel --name stampreporter --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

---

### Chaincodes: stampreporter and registrar in StampReportersOrg

**Approve (stampreporter) in StampReportersOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID registrar-stampreporter-channel --name stampreporter --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

**Commit (stampreporter) in StampReportersOrg:**
```bash
peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:9090 --channelID registrar-stampreporter-channel --name stampreporter --version 1 --sequence 1
```

**Approve (registrar) in StampReportersOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID registrar-stampreporter-channel --name registrar --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

---

## 3. STAMPREPORTER-LAWYER-CHANNEL

### Chaincodes: stampreporter and lawyer in StampReportersOrg

**Approve (stampreporter) in StampReportersOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID stampreporter-lawyer-channel --name stampreporter --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

**Commit (stampreporter) in StampReportersOrg:**
```bash
peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:9090 --channelID stampreporter-lawyer-channel --name stampreporter --version 1 --sequence 1
```

**Approve (lawyer) in StampReportersOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID stampreporter-lawyer-channel --name lawyer --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

---

### Chaincodes: lawyer and stampreporter in LawyersOrg

**Approve (lawyer) in LawyersOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID stampreporter-lawyer-channel --name lawyer --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

**Commit (lawyer) in LawyersOrg:**
```bash
peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:9090 --channelID stampreporter-lawyer-channel --name lawyer --version 1 --sequence 1
```

**Approve (stampreporter) in LawyersOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID stampreporter-lawyer-channel --name stampreporter --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

---

## 4. STAMPREPORTER-BENCHCLERK-CHANNEL

### Chaincodes: stampreporter and benchclerk in StampReportersOrg

**Approve (stampreporter) in StampReportersOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID stampreporter-benchclerk-channel --name stampreporter --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

**Commit (stampreporter) in StampReportersOrg:**
```bash
peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:9090 --channelID stampreporter-benchclerk-channel --name stampreporter --version 1 --sequence 1
```

**Approve (benchclerk) in StampReportersOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID stampreporter-benchclerk-channel --name benchclerk --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

---

### Chaincodes: benchclerk and stampreporter in BenchClerksOrg

**Approve (benchclerk) in BenchClerksOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID stampreporter-benchclerk-channel --name benchclerk --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

**Commit (benchclerk) in BenchClerksOrg:**
```bash
peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:9090 --channelID stampreporter-benchclerk-channel --name benchclerk --version 1 --sequence 1
```

**Approve (stampreporter) in BenchClerksOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID stampreporter-benchclerk-channel --name stampreporter --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

---

## 5. BENCHCLERK-JUDGE-CHANNEL

### Chaincodes: benchclerk and judge in BenchClerksOrg

**Approve (benchclerk) in BenchClerksOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID benchclerk-judge-channel --name benchclerk --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

**Commit (benchclerk) in BenchClerksOrg:**
```bash
peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:9090 --channelID benchclerk-judge-channel --name benchclerk --version 1 --sequence 1
```

**Approve (judge) in BenchClerksOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID benchclerk-judge-channel --name judge --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

---

### Chaincodes: judge and benchclerk in JudgesOrg

**Approve (judge) in JudgesOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID benchclerk-judge-channel --name judge --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

**Commit (judge) in JudgesOrg:**
```bash
peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:9090 --channelID benchclerk-judge-channel --name judge --version 1 --sequence 1
```

**Approve (benchclerk) in JudgesOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID benchclerk-judge-channel --name benchclerk --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

---

## 6. BENCHCLERK-LAWYER-CHANNEL

### Chaincodes: benchclerk and lawyer in BenchClerksOrg

**Approve (benchclerk) in BenchClerksOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID benchclerk-lawyer-channel --name benchclerk --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

**Commit (benchclerk) in BenchClerksOrg:**
```bash
peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:9090 --channelID benchclerk-lawyer-channel --name benchclerk --version 1 --sequence 1
```

**Approve (lawyer) in BenchClerksOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID benchclerk-lawyer-channel --name lawyer --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

---

### Chaincodes: lawyer and benchclerk in LawyersOrg

**Approve (lawyer) in LawyersOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID benchclerk-lawyer-channel --name lawyer --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

**Commit (lawyer) in LawyersOrg:**
```bash
peer lifecycle chaincode commit -o orderer-api.127-0-0-1.nip.io:9090 --channelID benchclerk-lawyer-channel --name lawyer --version 1 --sequence 1
```

**Approve (benchclerk) in LawyersOrg:**
```bash
peer lifecycle chaincode approveformyorg -o orderer-api.127-0-0-1.nip.io:9090 --channelID benchclerk-lawyer-channel --name benchclerk --version 1 --sequence 1 --waitForEvent --package-id ${CC_PACKAGE_ID}
```

---

## Quick Reference: Chaincodes per Channel

| Channel | Chaincodes | Member Orgs |
|---------|------------|-------------|
| lawyer-registrar-channel | lawyer, registrar | LawyersOrg, RegistrarsOrg |
| registrar-stampreporter-channel | registrar, stampreporter | RegistrarsOrg, StampReportersOrg |
| stampreporter-lawyer-channel | stampreporter, lawyer | StampReportersOrg, LawyersOrg |
| stampreporter-benchclerk-channel | stampreporter, benchclerk | StampReportersOrg, BenchClerksOrg |
| benchclerk-judge-channel | benchclerk, judge | BenchClerksOrg, JudgesOrg |
| benchclerk-lawyer-channel | benchclerk, lawyer | BenchClerksOrg, LawyersOrg |

---

## Check Commit Readiness

Before committing, verify all orgs have approved:
```bash
peer lifecycle chaincode checkcommitreadiness --channelID <channel-name> --name <chaincode-name> --version 1 --sequence 1
```

## Query Committed Chaincodes

After commit, verify chaincode is committed:
```bash
peer lifecycle chaincode querycommitted --channelID <channel-name> --name <chaincode-name>
```

---

## Deployment Order Recommendation

For proper cross-channel invocation, deploy chaincodes in this order:

1. **lawyer-registrar-channel** - Deploy `lawyer` and `registrar` chaincodes
2. **registrar-stampreporter-channel** - Deploy `registrar` and `stampreporter` chaincodes
3. **stampreporter-lawyer-channel** - Deploy `stampreporter` and `lawyer` chaincodes
4. **stampreporter-benchclerk-channel** - Deploy `stampreporter` and `benchclerk` chaincodes
5. **benchclerk-judge-channel** - Deploy `benchclerk` and `judge` chaincodes
6. **benchclerk-lawyer-channel** - Deploy `benchclerk` and `lawyer` chaincodes

---