const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Controller for Lawyer Contract functions
 */
const lawyerController = {
    /**
     * Create a new case
     */
    createCase: async (req, res) => {
        const { caseData } = req.body;
        if (!caseData) {
            return res.status(400).json({ error: 'Missing caseData in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.lawyer;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('CreateCase', JSON.stringify(caseData));
            logger.info(`Case created successfully`);
            
            return res.status(200).json({
                success: true,
                message: 'Case created successfully',
            });
        } catch (error) {
            logger.error(`Error creating case: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to create case: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Submit case to registrar
     */
    submitToRegistrar: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.lawyer;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('SubmitToRegistrar', caseID);
            logger.info(`Case ${caseID} submitted to registrar successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} submitted to registrar successfully`,
            });
        } catch (error) {
            logger.error(`Error submitting case to registrar: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to submit case to registrar: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get case by ID
     */
    getCaseById: async (req, res) => {
        const { caseID } = req.params;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID parameter' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.lawyer;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetCase', caseID);
            const caseData = JSON.parse(result.toString());
            logger.info(`Retrieved case ${caseID}`);
            
            return res.status(200).json({
                success: true,
                data: caseData
            });
        } catch (error) {
            logger.error(`Error getting case by ID: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get case: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Update case details
     */
    updateCaseDetails: async (req, res) => {
        const { caseID, updates } = req.body;
        if (!caseID || !updates) {
            return res.status(400).json({ error: 'Missing caseID or updates in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.lawyer;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('UpdateCaseDetails', caseID, JSON.stringify(updates));
            logger.info(`Case ${caseID} details updated successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} details updated successfully`,
            });
        } catch (error) {
            logger.error(`Error updating case details: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to update case details: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get cases by filter
     */
    getCasesByFilter: async (req, res) => {
        const filter = req.query.filter || '{}';

        let gateway;
        try {
            const fabricConfig = config.fabric.lawyer;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetCasesByFilter', filter);
            const cases = JSON.parse(result.toString());
            logger.info(`Retrieved ${cases.length} cases by filter`);
            
            return res.status(200).json({
                success: true,
                data: cases
            });
        } catch (error) {
            logger.error(`Error getting cases by filter: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get cases by filter: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Add document to case
     */
    addDocumentToCase: async (req, res) => {
        const { caseID, document } = req.body;
        if (!caseID || !document) {
            return res.status(400).json({ error: 'Missing caseID or document in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.lawyer;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('AddDocumentToCase', caseID, JSON.stringify(document));
            logger.info(`Document added to case ${caseID} successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Document added to case ${caseID} successfully`,
            });
        } catch (error) {
            logger.error(`Error adding document to case: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to add document to case: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get confirmed decisions
     */
    getConfirmedDecisions: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.lawyer;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetConfirmedDecisions');
            const cases = JSON.parse(result.toString());
            logger.info(`Retrieved ${cases.length} confirmed decisions`);
            
            return res.status(200).json({
                success: true,
                data: cases
            });
        } catch (error) {
            logger.error(`Error getting confirmed decisions: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get confirmed decisions: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * View judgment details
     */
    viewJudgmentDetails: async (req, res) => {
        const { caseID } = req.params;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID parameter' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.lawyer;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('ViewJudgmentDetails', caseID);
            const judgmentDetails = JSON.parse(result.toString());
            logger.info(`Retrieved judgment details for case ${caseID}`);
            
            return res.status(200).json({
                success: true,
                data: judgmentDetails
            });
        } catch (error) {
            logger.error(`Error getting judgment details: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get judgment details: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get all cases
     */
    getAllCases: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.lawyer;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetAllCases');
            const cases = JSON.parse(result.toString());
            logger.info(`Retrieved ${cases.length} cases`);
            
            return res.status(200).json({
                success: true,
                data: cases
            });
        } catch (error) {
            logger.error(`Error getting all cases: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get all cases: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get cases by lawyer ID
     */
    getCasesByLawyerID: async (req, res) => {
        const { lawyerID } = req.params;
        if (!lawyerID) {
            return res.status(400).json({ error: 'Missing lawyerID parameter' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.lawyer;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetCasesByLawyerID', lawyerID);
            const cases = JSON.parse(result.toString());
            logger.info(`Retrieved ${cases.length} cases for lawyer ${lawyerID}`);
            
            return res.status(200).json({
                success: true,
                data: cases
            });
        } catch (error) {
            logger.error(`Error getting cases by lawyer ID: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get cases by lawyer ID: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Track case status
     */
    trackCaseStatus: async (req, res) => {
        const { caseID } = req.params;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID parameter' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.lawyer;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('TrackCaseStatus', caseID);
            const statusInfo = JSON.parse(result.toString());
            logger.info(`Retrieved status tracking info for case ${caseID}`);
            
            return res.status(200).json({
                success: true,
                data: statusInfo
            });
        } catch (error) {
            logger.error(`Error tracking case status: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to track case status: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Query stats
     */
    queryStats: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.lawyer;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('QueryStats');
            const stats = JSON.parse(result.toString());
            logger.info('Retrieved case statistics');
            
            return res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error(`Error getting case statistics: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get case statistics: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    }
};

module.exports = lawyerController;
