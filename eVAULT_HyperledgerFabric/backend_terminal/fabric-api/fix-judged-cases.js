const { connectToNetwork, disconnectFromNetwork } = require('./src/fabric/network');
const config = require('./src/config/config');

async function main() {
    const judgeConfig = config.fabric.judge;
    const benchClerkConfig = config.fabric.benchclerk;
    
    // 1. Get judged cases from Judge namespace
    console.log("Connecting to judge namespace...");
    const { contract: judgeContract, gateway: gateway1 } = await connectToNetwork(
        judgeConfig.org, judgeConfig.user,
        judgeConfig.channelName, judgeConfig.chaincodeName
    );
    
    let judgedCases = [];
    try {
        console.log("Fetching judged cases...");
        const result = await judgeContract.evaluateTransaction('GetAllCases');
        const allCases = JSON.parse(result.toString());
        judgedCases = allCases.filter(c => c.status === 'JUDGMENT_ISSUED');
        console.log(`Found ${judgedCases.length} judged cases on judge namespace.`);
    } catch(e) { console.error("Error reading judge namespace:", e.message); }
    
    await disconnectFromNetwork(gateway1);

    if (judgedCases.length === 0) return;

    // 2. Sync to BenchClerk namespace
    console.log("Connecting to benchclerk namespace...");
    const { contract: bcContract, gateway: gateway2 } = await connectToNetwork(
        benchClerkConfig.org, benchClerkConfig.user,
        judgeConfig.channelName, benchClerkConfig.chaincodeName
    );
    
    for (const c of judgedCases) {
        try {
           console.log(`Syncing ${c.id} to benchclerk namespace...`);
           await bcContract.submitTransaction('StoreCase', JSON.stringify(c));
        } catch(e) { console.error(`Failed on benchclerk for ${c.id}:`, e.message); }
    }
    await disconnectFromNetwork(gateway2);

    // 3. Sync to Lawyer namespace
    console.log("Connecting to lawyer namespace...");
    const { contract: lawyerContract, gateway: gateway3 } = await connectToNetwork(
        config.fabric.lawyer.org, config.fabric.lawyer.user,
        'benchclerk-lawyer-channel', 'lawyer'
    );
    
    for (const c of judgedCases) {
        try {
           let lawyerData = {...c};
           lawyerData.lastModified = new Date().toISOString();
           console.log(`Syncing ${c.id} to lawyer namespace...`);
           await lawyerContract.submitTransaction('StoreCase', JSON.stringify(lawyerData));
        } catch(e) { console.error(`Failed on lawyer for ${c.id}:`, e.message); }
    }
    await disconnectFromNetwork(gateway3);
    console.log("Done syncing judged cases.");
}
main().catch(console.error);
