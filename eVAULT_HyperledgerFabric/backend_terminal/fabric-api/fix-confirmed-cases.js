const { connectToNetwork, disconnectFromNetwork } = require('./src/fabric/network');
const config = require('./src/config/config');

async function main() {
    const benchClerkConfig = config.fabric.benchclerk;
    const lawyerConfig = config.fabric.lawyer;
    
    // 1. Get judged cases from Benchclerk namespace
    console.log("Connecting to benchclerk namespace...");
    const { contract: bcContract, gateway: gateway1 } = await connectToNetwork(
        benchClerkConfig.org, benchClerkConfig.user,
        benchClerkConfig.judgeChannel || 'benchclerk-judge-channel', benchClerkConfig.chaincodeName
    );
    
    let confirmedCases = [];
    try {
        console.log("Fetching cases from benchclerk namespace...");
        const result = await bcContract.evaluateTransaction('GetAllCases');
        const allCases = JSON.parse(result.toString());
        confirmedCases = allCases.filter(c => c.status === 'DECISION_CONFIRMED');
        console.log(`Found ${confirmedCases.length} confirmed cases.`);
    } catch(e) { console.error("Error reading namespace:", e.message); }
    
    await disconnectFromNetwork(gateway1);

    if (confirmedCases.length === 0) return;

    // 2. Sync to Lawyer namespace
    console.log("Connecting to lawyer namespace...");
    const { contract: lawyerContract, gateway: gateway2 } = await connectToNetwork(
        lawyerConfig.org, lawyerConfig.user,
        benchClerkConfig.lawyerChannel || 'benchclerk-lawyer-channel', 'lawyer'
    );
    
    for (const c of confirmedCases) {
        try {
           let lawyerData = {...c};
           lawyerData.lastModified = new Date().toISOString();
           console.log(`Syncing ${c.id} to lawyer namespace...`);
           await lawyerContract.submitTransaction('StoreCase', JSON.stringify(lawyerData));
        } catch(e) { console.error(`Failed on lawyer for ${c.id}:`, e.message); }
    }
    await disconnectFromNetwork(gateway2);
    console.log("Done syncing confirmed cases.");
}
main().catch(console.error);
