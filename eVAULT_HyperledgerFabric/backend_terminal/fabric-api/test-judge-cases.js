const { connectToNetwork, disconnectFromNetwork } = require('./src/fabric/network');
const config = require('./src/config/config');

async function main() {
    const orgConfig = config.fabric.benchclerk;
    const { contract, gateway: g } = await connectToNetwork(
        orgConfig.org, orgConfig.user,
        'benchclerk-judge-channel', orgConfig.chaincodeName
    );
    try {
        const result = await contract.evaluateTransaction('GetAllCases');
        const str = result.toString();
        const cases = str ? JSON.parse(str) : [];
        console.log("GetAllCases returned:", cases.length, "cases");
        if (cases.length > 0) {
            console.log("First case:", JSON.stringify(cases[0], null, 2));
        }
    } finally {
        await disconnectFromNetwork(g);
    }
}
main().catch(console.error);
