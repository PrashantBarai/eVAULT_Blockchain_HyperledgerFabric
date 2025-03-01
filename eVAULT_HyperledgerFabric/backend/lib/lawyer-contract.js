'use strict';

const { Contract } = require('fabric-contract-api');

class LawyerContract extends Contract {

    async InitLedger(ctx) {
        console.log("Initializing Ledger with sample cases...");

        const sampleCases = [
            {
                lawyerID: "LAWYER_001",
                caseDetails: "Property Dispute Case",
                ipfsHash: "Qm123abc..."
            },
            {
                lawyerID: "LAWYER_002",
                caseDetails: "Corporate Fraud Case",
                ipfsHash: "Qm456def..."
            }
        ];

        for (const caseData of sampleCases) {
            const caseID = `CASE_${Date.now()}`;
            const caseRecord = {
                caseID,
                lawyerID: caseData.lawyerID,
                caseDetails: caseData.caseDetails,
                ipfsHash: caseData.ipfsHash,
                status: "Pending Verification"
            };

            await ctx.stub.putState(caseID, Buffer.from(JSON.stringify(caseRecord)));
        }

        console.log("Ledger Initialized Successfully");
    }

    // Submit a new case (Lawyer uploads case)
    async submitCase(ctx, lawyerID, caseDetails, ipfsHash) {
        const caseID = `CASE_${Date.now()}`; // Unique Case ID

        const caseData = {
            caseID,
            lawyerID,
            caseDetails,
            ipfsHash,  // IPFS CID for media files
            status: "Pending Verification"
        };

        await ctx.stub.putState(caseID, Buffer.from(JSON.stringify(caseData)));
        return JSON.stringify({ message: `Case ${caseID} submitted successfully!`, caseID });
    }

    // Assign case to Registrar (Queue-based Random Allocation)
    async assignToRegistrar(ctx, caseID) {
        const caseData = await ctx.stub.getState(caseID);
        if (!caseData || caseData.length === 0) {
            throw new Error(`Case ${caseID} not found`);
        }

        let caseObj = JSON.parse(caseData.toString());

        // Get all registrars and assign based on queue
        const registrars = await this.getAllRegistrars(ctx);
        const assignedRegistrar = registrars.reduce((minQueueRegistrar, currentRegistrar) => {
            return (currentRegistrar.queueLength < minQueueRegistrar.queueLength) ? currentRegistrar : minQueueRegistrar;
        });

        caseObj.assignedTo = assignedRegistrar.registrarID;
        caseObj.status = "Assigned to Registrar";

        await ctx.stub.putState(caseID, Buffer.from(JSON.stringify(caseObj)));
        return JSON.stringify({ message: `Case ${caseID} assigned to Registrar ${assignedRegistrar.registrarID}` });
    }

    // Retrieve case details
    async getCaseDetails(ctx, caseID) {
        const caseData = await ctx.stub.getState(caseID);
        if (!caseData || caseData.length === 0) {
            throw new Error(`Case ${caseID} not found`);
        }
        return caseData.toString();
    }

    // Get all registrars (Stub method)
    async getAllRegistrars(ctx) {
        return [
            { registrarID: "R1", queueLength: 3 },
            { registrarID: "R2", queueLength: 1 },
            { registrarID: "R3", queueLength: 2 }
        ];
    }
}

module.exports = LawyerContract;
