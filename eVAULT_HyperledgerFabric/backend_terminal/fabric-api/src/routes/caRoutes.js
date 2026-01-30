const express = require('express');
const CAClient = require('../fabric/caClient');
const logger = require('../utils/logger');

const router = express.Router();
const caClient = new CAClient();

// ============ CA ADMIN ROUTES ============

/**
 * @route   POST /api/ca/initialize
 * @desc    Initialize all CA clients and enroll admins
 * @access  Public
 */
router.post('/initialize', async (req, res) => {
    try {
        const results = await caClient.initializeAllOrgs();
        
        const successful = results.filter(r => r.status === 'success');
        const failed = results.filter(r => r.status === 'error');
        
        res.status(200).json({
            success: true,
            message: `Initialized ${successful.length} organizations, ${failed.length} failed`,
            results: results,
            summary: {
                total: results.length,
                successful: successful.length,
                failed: failed.length
            }
        });
    } catch (error) {
        logger.error(`CA initialization failed: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize CA clients',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/ca/enroll-admin/:orgName
 * @desc    Enroll admin for specific organization
 * @access  Public
 */
router.post('/enroll-admin/:orgName', async (req, res) => {
    try {
        const { orgName } = req.params;
        const { adminUserId, adminPassword } = req.body;
        
        const result = await caClient.enrollAdmin(orgName, adminUserId, adminPassword);
        
        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error(`Admin enrollment failed: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to enroll admin',
            error: error.message
        });
    }
});

// ============ USER MANAGEMENT ROUTES ============

/**
 * @route   POST /api/ca/register-user
 * @desc    Register and enroll a new user
 * @access  Public
 * @body    { orgName, userId, userRole, adminUserId, affiliation, userType }
 */
router.post('/register-user', async (req, res) => {
    try {
        const {
            orgName,
            userId,
            userRole = 'client',
            adminUserId,
            affiliation,
            userType,
            licenseId,
            email
        } = req.body;

        // Validate required fields
        if (!orgName || !userId) {
            return res.status(400).json({
                success: false,
                message: 'orgName and userId are required'
            });
        }

        // Set affiliation based on user type
        let userAffiliation = affiliation;
        if (!userAffiliation && userType) {
            const orgConfig = caClient.getOrgConfig(orgName);
            if (orgConfig && orgConfig.affiliations) {
                // Try to match user type with available affiliations
                const matchingAffiliation = orgConfig.affiliations.find(aff => 
                    aff.includes(userType.toLowerCase())
                );
                userAffiliation = matchingAffiliation || orgConfig.affiliations[0];
            }
        }

        const result = await caClient.registerAndEnrollUser(
            orgName,
            userId,
            userRole,
            adminUserId,
            userAffiliation
        );
        
        res.status(201).json({
            success: true,
            ...result,
            userDetails: {
                userId,
                orgName,
                userRole,
                affiliation: userAffiliation,
                userType,
                licenseId,
                email
            }
        });
    } catch (error) {
        logger.error(`User registration failed: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to register user',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/ca/users/:orgName
 * @desc    Get all users in an organization
 * @access  Public
 */
router.get('/users/:orgName', async (req, res) => {
    try {
        const { orgName } = req.params;
        
        const identities = await caClient.getWalletIdentities(orgName);
        
        res.status(200).json({
            success: true,
            message: `Retrieved ${identities.length} identities for ${orgName}`,
            orgName: orgName,
            identities: identities,
            count: identities.length
        });
    } catch (error) {
        logger.error(`Failed to get users: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/ca/user/:orgName/:userId
 * @desc    Remove user from organization
 * @access  Public
 */
router.delete('/user/:orgName/:userId', async (req, res) => {
    try {
        const { orgName, userId } = req.params;
        
        const result = await caClient.removeIdentity(orgName, userId);
        
        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        logger.error(`Failed to remove user: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to remove user',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/ca/user-exists/:orgName/:userId
 * @desc    Check if user exists in organization
 * @access  Public
 */
router.get('/user-exists/:orgName/:userId', async (req, res) => {
    try {
        const { orgName, userId } = req.params;
        
        const exists = await caClient.userExists(orgName, userId);
        
        res.status(200).json({
            success: true,
            exists: exists,
            userId: userId,
            orgName: orgName,
            message: exists ? 'User exists' : 'User not found'
        });
    } catch (error) {
        logger.error(`Failed to check user existence: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to check user existence',
            error: error.message
        });
    }
});

// ============ ORGANIZATION INFO ROUTES ============

/**
 * @route   GET /api/ca/organizations
 * @desc    Get all supported organizations
 * @access  Public
 */
router.get('/organizations', async (req, res) => {
    try {
        const orgs = caClient.getSupportedOrgs();
        const orgDetails = {};
        
        for (const org of orgs) {
            const config = caClient.getOrgConfig(org);
            orgDetails[org] = {
                mspId: config.mspId,
                caURL: config.caURL,
                affiliations: config.affiliations
            };
        }
        
        res.status(200).json({
            success: true,
            message: `Retrieved ${orgs.length} organizations`,
            organizations: orgs,
            details: orgDetails,
            count: orgs.length
        });
    } catch (error) {
        logger.error(`Failed to get organizations: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve organizations',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/ca/organization/:orgName
 * @desc    Get organization details
 * @access  Public
 */
router.get('/organization/:orgName', async (req, res) => {
    try {
        const { orgName } = req.params;
        
        const config = caClient.getOrgConfig(orgName);
        if (!config) {
            return res.status(404).json({
                success: false,
                message: `Organization ${orgName} not found`
            });
        }
        
        const identities = await caClient.getWalletIdentities(orgName);
        
        res.status(200).json({
            success: true,
            orgName: orgName,
            config: {
                mspId: config.mspId,
                caURL: config.caURL,
                affiliations: config.affiliations
            },
            identities: identities,
            userCount: identities.length
        });
    } catch (error) {
        logger.error(`Failed to get organization details: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve organization details',
            error: error.message
        });
    }
});

// ============ INTEGRATION ROUTES ============

/**
 * @route   POST /api/ca/register-from-backend
 * @desc    Register user from client backend
 * @access  Public
 * @body    { userType, username, email, licenseId, password, ... }
 */
router.post('/register-from-backend', async (req, res) => {
    try {
        const { userType, username, email, licenseId, ...otherData } = req.body;
        
        // Map user types to organizations
        const userTypeToOrg = {
            'lawyer': 'LawyersOrg',
            'registrar': 'RegistrarsOrg', 
            'stampreporter': 'StampReportersOrg',
            'benchclerk': 'BenchClerksOrg',
            'judge': 'JudgesOrg'
        };
        
        const orgName = userTypeToOrg[userType];
        if (!orgName) {
            return res.status(400).json({
                success: false,
                message: `Unsupported user type: ${userType}`
            });
        }
        
        // Create blockchain identity
        const userId = username || email.split('@')[0];
        const result = await caClient.registerAndEnrollUser(
            orgName,
            userId,
            'client',
            null, // Use default admin
            userType
        );
        
        res.status(201).json({
            success: true,
            message: 'User registered on blockchain successfully',
            blockchain: result,
            userData: {
                userType,
                username,
                email,
                licenseId,
                blockchainId: userId,
                orgName
            }
        });
    } catch (error) {
        logger.error(`Blockchain registration failed: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'Failed to register user on blockchain',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/ca/health
 * @desc    CA health check
 * @access  Public
 */
router.get('/health', async (req, res) => {
    try {
        const orgs = caClient.getSupportedOrgs();
        const healthStatus = {};
        
        for (const org of orgs) {
            try {
                const adminExists = await caClient.userExists(org, caClient.getOrgConfig(org).adminUserId);
                healthStatus[org] = {
                    status: 'healthy',
                    adminEnrolled: adminExists,
                    caURL: caClient.getOrgConfig(org).caURL
                };
            } catch (error) {
                healthStatus[org] = {
                    status: 'unhealthy',
                    error: error.message
                };
            }
        }
        
        const healthyCount = Object.values(healthStatus).filter(s => s.status === 'healthy').length;
        
        res.status(200).json({
            success: true,
            message: `CA Health: ${healthyCount}/${orgs.length} organizations healthy`,
            timestamp: new Date().toISOString(),
            organizations: healthStatus,
            summary: {
                total: orgs.length,
                healthy: healthyCount,
                unhealthy: orgs.length - healthyCount
            }
        });
    } catch (error) {
        logger.error(`CA health check failed: ${error.message}`);
        res.status(500).json({
            success: false,
            message: 'CA health check failed',
            error: error.message
        });
    }
});

module.exports = router;