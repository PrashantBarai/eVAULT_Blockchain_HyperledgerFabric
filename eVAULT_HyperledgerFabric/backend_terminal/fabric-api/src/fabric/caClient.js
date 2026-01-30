const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const gatewaysDir = path.resolve(process.cwd(), '..', '_gateways');
const walletsDir = path.resolve(process.cwd(), '..', '_wallets');
const mspDir = path.resolve(process.cwd(), '..', '_msp');

class CAClient {
    constructor() {
        this.caServices = {};
        this.wallets = {};
        this.orgConfigs = {
            LawyersOrg: {
                caURL: 'http://lawyersorgca-api.127-0-0-1.nip.io:9090',
                mspId: 'LawyersOrgMSP',
                adminUserId: 'lawyersorgadmin',
                adminPassword: 'lawyersorgadminpw',
                affiliations: ['lawyer', 'lawyer.senior', 'lawyer.junior']
            },
            RegistrarsOrg: {
                caURL: 'http://registrarsorgca-api.127-0-0-1.nip.io:9090',
                mspId: 'RegistrarsOrgMSP',
                adminUserId: 'registrarsorgadmin',
                adminPassword: 'registrarsorgadminpw',
                affiliations: ['registrar', 'registrar.senior']
            },
            StampReportersOrg: {
                caURL: 'http://stampreportersorgca-api.127-0-0-1.nip.io:9090',
                mspId: 'StampReportersOrgMSP',
                adminUserId: 'stampreportersorgadmin',
                adminPassword: 'stampreportersorgadminpw',
                affiliations: ['stampreporter', 'stampreporter.senior']
            },
            BenchClerksOrg: {
                caURL: 'http://benchclerksorgca-api.127-0-0-1.nip.io:9090',
                mspId: 'BenchClerksOrgMSP',
                adminUserId: 'benchclerksorgadmin',
                adminPassword: 'benchclerksorgadminpw',
                affiliations: ['benchclerk', 'benchclerk.senior']
            },
            JudgesOrg: {
                caURL: 'http://judgesorgca-api.127-0-0-1.nip.io:9090',
                mspId: 'JudgesOrgMSP',
                adminUserId: 'judgesorgadmin',
                adminPassword: 'judgesorgadminpw',
                affiliations: ['judge', 'judge.senior', 'judge.chief']
            }
        };
    }

    /**
     * Initialize CA client for an organization
     * @param {string} orgName - Organization name (e.g., 'LawyersOrg')
     */
    async initializeCA(orgName) {
        try {
            if (this.caServices[orgName]) {
                return this.caServices[orgName];
            }

            const orgConfig = this.orgConfigs[orgName];
            if (!orgConfig) {
                throw new Error(`Organization configuration not found for ${orgName}`);
            }

            // Create CA client
            const ca = new FabricCAServices(orgConfig.caURL);
            this.caServices[orgName] = ca;

            // Initialize wallet
            const walletPath = path.join(walletsDir, orgName);
            const wallet = await Wallets.newFileSystemWallet(walletPath);
            this.wallets[orgName] = wallet;

            logger.info(`CA initialized for ${orgName}`);
            return ca;
        } catch (error) {
            logger.error(`Failed to initialize CA for ${orgName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Enroll admin user for an organization
     * @param {string} orgName - Organization name
     * @param {string} adminUserId - Admin user ID (optional, uses default)
     * @param {string} adminPassword - Admin password (optional, uses default)
     */
    async enrollAdmin(orgName, adminUserId = null, adminPassword = null) {
        try {
            const ca = await this.initializeCA(orgName);
            const wallet = this.wallets[orgName];
            const orgConfig = this.orgConfigs[orgName];

            const userId = adminUserId || orgConfig.adminUserId;
            const password = adminPassword || orgConfig.adminPassword;

            // Check if admin already exists
            const adminIdentity = await wallet.get(userId);
            if (adminIdentity) {
                logger.info(`Admin identity ${userId} already exists for ${orgName}`);
                return { success: true, message: 'Admin already enrolled' };
            }

            // Enroll admin
            const enrollment = await ca.enroll({
                enrollmentID: userId,
                enrollmentSecret: password
            });

            // Create identity object
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes()
                },
                mspId: orgConfig.mspId,
                type: 'X.509'
            };

            // Put identity in wallet
            await wallet.put(userId, x509Identity);
            logger.info(`Admin ${userId} enrolled successfully for ${orgName}`);

            return {
                success: true,
                message: 'Admin enrolled successfully',
                userId: userId,
                orgName: orgName
            };
        } catch (error) {
            logger.error(`Failed to enroll admin for ${orgName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Register and enroll a new user
     * @param {string} orgName - Organization name
     * @param {string} userId - New user ID
     * @param {string} userRole - User role (client, peer, orderer, admin)
     * @param {string} adminUserId - Admin user ID for registration
     * @param {string} affiliation - User affiliation
     */
    async registerAndEnrollUser(orgName, userId, userRole = 'client', adminUserId = null, affiliation = null) {
        try {
            const ca = await this.initializeCA(orgName);
            const wallet = this.wallets[orgName];
            const orgConfig = this.orgConfigs[orgName];

            const adminId = adminUserId || orgConfig.adminUserId;

            // Check if user already exists
            const userIdentity = await wallet.get(userId);
            if (userIdentity) {
                logger.info(`User ${userId} already exists for ${orgName}`);
                return { success: true, message: 'User already enrolled', userId };
            }

            // Get admin identity
            const adminIdentity = await wallet.get(adminId);
            if (!adminIdentity) {
                throw new Error(`Admin identity ${adminId} not found. Please enroll admin first.`);
            }

            // Build user object for authenticating with the CA
            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, adminId);

            // Set affiliation
            const userAffiliation = affiliation || orgConfig.affiliations[0] || orgName.toLowerCase();

            // Register user
            const secret = await ca.register({
                affiliation: userAffiliation,
                enrollmentID: userId,
                role: userRole,
                attrs: [
                    { name: 'role', value: userRole, ecert: true },
                    { name: 'orgName', value: orgName, ecert: true }
                ]
            }, adminUser);

            // Enroll user
            const enrollment = await ca.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret
            });

            // Create identity
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes()
                },
                mspId: orgConfig.mspId,
                type: 'X.509'
            };

            // Put identity in wallet
            await wallet.put(userId, x509Identity);
            logger.info(`User ${userId} registered and enrolled successfully for ${orgName}`);

            return {
                success: true,
                message: 'User registered and enrolled successfully',
                userId: userId,
                password: secret,
                orgName: orgName,
                role: userRole
            };
        } catch (error) {
            logger.error(`Failed to register user ${userId} for ${orgName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get all identities in an organization's wallet
     * @param {string} orgName - Organization name
     */
    async getWalletIdentities(orgName) {
        try {
            await this.initializeCA(orgName);
            const wallet = this.wallets[orgName];
            const identityLabels = await wallet.list();
            
            const identities = [];
            for (const label of identityLabels) {
                const identity = await wallet.get(label);
                identities.push({
                    label: label,
                    mspId: identity.mspId,
                    type: identity.type
                });
            }

            return identities;
        } catch (error) {
            logger.error(`Failed to get wallet identities for ${orgName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Remove an identity from the wallet
     * @param {string} orgName - Organization name
     * @param {string} userId - User ID to remove
     */
    async removeIdentity(orgName, userId) {
        try {
            await this.initializeCA(orgName);
            const wallet = this.wallets[orgName];
            
            const identity = await wallet.get(userId);
            if (!identity) {
                throw new Error(`Identity ${userId} not found in ${orgName} wallet`);
            }

            await wallet.remove(userId);
            logger.info(`Identity ${userId} removed from ${orgName} wallet`);

            return {
                success: true,
                message: `Identity ${userId} removed successfully`,
                userId: userId,
                orgName: orgName
            };
        } catch (error) {
            logger.error(`Failed to remove identity ${userId} from ${orgName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Initialize all organizations
     */
    async initializeAllOrgs() {
        try {
            const orgs = Object.keys(this.orgConfigs);
            const results = [];

            for (const org of orgs) {
                try {
                    await this.initializeCA(org);
                    const enrollResult = await this.enrollAdmin(org);
                    results.push({ org, status: 'success', ...enrollResult });
                } catch (error) {
                    results.push({ org, status: 'error', message: error.message });
                    logger.warn(`Failed to initialize ${org}: ${error.message}`);
                }
            }

            return results;
        } catch (error) {
            logger.error(`Failed to initialize organizations: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get CA client for an organization
     * @param {string} orgName - Organization name
     */
    async getCAClient(orgName) {
        return await this.initializeCA(orgName);
    }

    /**
     * Get wallet for an organization
     * @param {string} orgName - Organization name
     */
    async getWallet(orgName) {
        await this.initializeCA(orgName);
        return this.wallets[orgName];
    }

    /**
     * Check if user exists in wallet
     * @param {string} orgName - Organization name
     * @param {string} userId - User ID to check
     */
    async userExists(orgName, userId) {
        try {
            await this.initializeCA(orgName);
            const wallet = this.wallets[orgName];
            const identity = await wallet.get(userId);
            return !!identity;
        } catch (error) {
            logger.error(`Failed to check user existence: ${error.message}`);
            return false;
        }
    }

    /**
     * Get organization configuration
     * @param {string} orgName - Organization name
     */
    getOrgConfig(orgName) {
        return this.orgConfigs[orgName];
    }

    /**
     * Get all supported organizations
     */
    getSupportedOrgs() {
        return Object.keys(this.orgConfigs);
    }
}

module.exports = CAClient;