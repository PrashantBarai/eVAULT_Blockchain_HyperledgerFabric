const { connectToNetwork, disconnectFromNetwork } = require('./src/fabric/network');
const config = require('./src/config/config');

async function main() {
    const orgConfig = config.fabric.benchclerk;
    const { contract: c1, gateway: g1 } = await connectToNetwork(
        orgConfig.org, orgConfig.user,
        'stampreporter-benchclerk-channel', orgConfig.chaincodeName
    );
    try {
        const r1 = await c1.evaluateTransaction('GetCaseById', 'CASE_1772392951897');
        console.log("On stampreporter-benchclerk-channel:\n", JSON.parse(r1.toString()).status);
    } catch(e) { console.error("Error c1:", e.message) }
    await disconnectFromNetwork(g1);

    const { contract: c2, gateway: g2 } = await connectToNetwork(
        orgConfig.org, orgConfig.user,
        'benchclerk-judge-channel', orgConfig.chaincodeName
    );
    try {
        const r2 = await c2.evaluateTransaction('GetCaseById', 'CASE_1772392951897');
        console.log("On benchclerk-judge-channel:\n", JSON.parse(r2.toString()).status);
    } catch(e) { console.error("Error c2:", e.message) }
    await disconnectFromNetwork(g2);
}
main().catch(console.error);
