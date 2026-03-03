const { connectToNetwork, disconnectFromNetwork } = require('./src/fabric/network');
const config = require('./src/config/config');

async function main() {
    const orgConfig = config.fabric.benchclerk;
    const lawyerConfig = config.fabric.lawyer;
    const { contract: c1, gateway: g1 } = await connectToNetwork(
        lawyerConfig.org, lawyerConfig.user,
        'benchclerk-lawyer-channel', 'lawyer'
    );
    try {
        const r1 = await c1.evaluateTransaction('GetCaseById', 'CASE_1772392951897');
        console.log("On benchclerk-lawyer-channel:\n", JSON.parse(r1.toString()).status);
    } catch(e) { console.error("Error c1:", e.message) }
    await disconnectFromNetwork(g1);
}
main().catch(console.error);
