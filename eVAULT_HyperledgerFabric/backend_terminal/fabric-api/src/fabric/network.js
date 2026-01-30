const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const CAClient = require('./caClient');

const gatewaysDir = path.resolve(process.cwd(), '..', '_gateways');
const walletsDir = path.resolve(process.cwd(), '..', '_wallets');

// Initialize CA client instance
const caClient = new CAClient();

/**
 * Connect to the Fabric network with CA integration
 * @param {string} org - The organization name (e.g., 'LawyersOrg', 'RegistrarsOrg')
 * @param {string} user - The user identity to use (e.g., 'lawyersorgadmin')
 * @param {string} channelName - The channel to connect to
 * @param {string} chaincodeName - The chaincode to connect to
 * @param {boolean} autoEnroll - Whether to auto-enroll admin if not found
 * @returns {Promise<{contract: Contract, gateway: Gateway, wallet: Wallet}>} - The contract, gateway and wallet objects
 */
async function connectToNetwork(org, user, channelName, chaincodeName, autoEnroll = true) {
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
        let identity = await wallet.get(user);
        if (!identity && autoEnroll) {
            logger.info(`Identity ${user} not found for ${org}, attempting to enroll...`);
            
            // Try to enroll admin user
            if (user.includes('admin')) {
                const adminPassword = `${user}pw`; // Default password pattern
                try {
                    await caClient.enrollAdmin(org, user, adminPassword);
                    identity = await wallet.get(user);
                } catch (enrollError) {
                    logger.error(`Failed to auto-enroll admin ${user}: ${enrollError.message}`);
                }
            }
        }
        
        if (!identity) {
            throw new Error(`Identity for the user ${user} not found in the wallet. Please enroll the user first.`);
        }
        
        // Set connection options; identity and wallet
        const gateway = new Gateway();
        const connectionOptions = {
            identity: user,
            wallet: wallet,
            discovery: { 
                enabled: true,
                asLocalhost: true
            },
            eventHandlerOptions: {
                strategy: null // Use default strategy
            }
        };
        
        // Connect to gateway and get network
        await gateway.connect(connectionProfile, connectionOptions);
        const network = await gateway.getNetwork(channelName);
        
        // Get contract - specify empty contract name to use default contract in chaincode
        const contract = network.getContract(chaincodeName, '');
        
        logger.info(`Connected to network: ${org} | ${channelName} | ${chaincodeName} | User: ${user}`);
        return { contract, gateway, wallet };
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

/**
 * Initialize network with CA client
 * @returns {Promise<void>}
 */
async function initializeNetwork() {
    try {
        logger.info('Initializing Fabric network with CA client...');
        await caClient.initializeAllOrgs();
        logger.info('Network initialization completed');
    } catch (error) {
        logger.error(`Network initialization failed: ${error.message}`);
        throw error;
    }
}

/**
 * Register a new user for an organization
 * @param {string} org - Organization name
 * @param {string} userId - User ID to register
 * @param {string} userRole - User role ('client', 'peer', 'orderer', 'admin')
 * @param {string} department - User department
 * @returns {Promise<string>} - User password
 */
async function registerUser(org, userId, userRole = 'client', department = '') {
    try {
        const adminUserId = `${org.toLowerCase().replace('org', '')}admin`;
        const password = await caClient.registerAndEnrollUser(org, userId, userRole, adminUserId, department);
        return password;
    } catch (error) {
        logger.error(`Failed to register user ${userId} for ${org}: ${error.message}`);
        throw error;
    }
}

/**
 * Get all identities for an organization
 * @param {string} org - Organization name
 * @returns {Promise<Array>} - List of identities
 */
async function getOrgIdentities(org) {
    try {
        return await caClient.getWalletIdentities(org);
    } catch (error) {
        logger.error(`Failed to get identities for ${org}: ${error.message}`);
        throw error;
    }
}

/**
 * Remove user identity
 * @param {string} org - Organization name
 * @param {string} userId - User ID to remove
 * @returns {Promise<void>}
 */
async function removeUser(org, userId) {
    try {
        await caClient.removeIdentity(org, userId);
    } catch (error) {
        logger.error(`Failed to remove user ${userId} from ${org}: ${error.message}`);
        throw error;
    }
}

module.exports = {
    connectToNetwork,
    disconnectFromNetwork,
    initializeNetwork,
    registerUser,
    getOrgIdentities,
    removeUser,
    caClient
};
