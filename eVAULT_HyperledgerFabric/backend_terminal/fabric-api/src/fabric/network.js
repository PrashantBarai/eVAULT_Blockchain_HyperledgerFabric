const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const gatewaysDir = path.resolve(process.cwd(), '..', '_gateways');
const walletsDir = path.resolve(process.cwd(), '..', '_wallets');

/**
 * Connect to the Fabric network
 * @param {string} org - The organization name (e.g., 'LawyersOrg', 'RegistrarsOrg')
 * @param {string} user - The user identity to use (e.g., 'lawyersorgadmin')
 * @param {string} channelName - The channel to connect to
 * @param {string} chaincodeName - The chaincode to connect to
 * @returns {Promise<{contract: Contract, gateway: Gateway}>} - The contract and gateway objects
 */
async function connectToNetwork(org, user, channelName, chaincodeName) {
    try {
        // Load the network configuration from the gateway file
        const gatewayPath = path.join(gatewaysDir, `${org.toLowerCase()}gateway.json`);
        if (!fs.existsSync(gatewayPath)) {
            throw new Error(`Gateway configuration not found for ${org}`);
        }

        const connectionProfile = JSON.parse(fs.readFileSync(gatewayPath, 'utf8'));
        
        // Create a new wallet for identity
        const walletPath = path.join(walletsDir, org);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        // Check if user identity exists in the wallet
        const identity = await wallet.get(`${user}`);
        if (!identity) {
            throw new Error(`Identity for the user ${user} not found in the wallet`);
        }
        
        // Set connection options; identity and wallet
        const gateway = new Gateway();
        const connectionOptions = {
            identity: user,
            wallet: wallet,
            discovery: { enabled: true, asLocalhost: true }
        };
        
        // Connect to gateway and get network
        await gateway.connect(connectionProfile, connectionOptions);
        const network = await gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);
        
        logger.info(`Connected to network: ${org} | ${channelName} | ${chaincodeName}`);
        return { contract, gateway };
    } catch (error) {
        logger.error(`Error connecting to the Fabric network: ${error.message}`);
        throw error;
    }
}

/**
 * Disconnect from the Fabric network
 * @param {Gateway} gateway - The gateway to disconnect from
 */
async function disconnectFromNetwork(gateway) {
    if (gateway) {
        gateway.disconnect();
        logger.info('Disconnected from Fabric network');
    }
}

module.exports = {
    connectToNetwork,
    disconnectFromNetwork
};
