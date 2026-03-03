const { connectToNetwork, disconnectFromNetwork } = require('./src/fabric/network');
const config = require('./src/config/config');

async function main() {
    const orgConfig = config.fabric.benchclerk;
    
    // Connect to judge channel where it's stuck
    const { contract, gateway } = await connectToNetwork(
        orgConfig.org, orgConfig.user,
        'benchclerk-judge-channel', orgConfig.chaincodeName
    );
    
    try {
        const result = await contract.evaluateTransaction('GetCaseById', 'CASE_1772392951897');
        const caseData = JSON.parse(result.toString());
        if(caseData.status === 'PENDING_BENCHCLERK_REVIEW') {
           caseData.status = 'PENDING_JUDGE_REVIEW';
           caseData.currentOrg = 'JudgesOrg';
           console.log("Fixing case on judge channel...");
           await contract.submitTransaction('StoreCase', JSON.stringify(caseData));
           console.log("Case fixed!");
        } else {
           console.log("Status is:", caseData.status);
        }
    } catch(e) { console.error("Error:", e.message); }
    
    await disconnectFromNetwork(gateway);
}
main().catch(console.error);
