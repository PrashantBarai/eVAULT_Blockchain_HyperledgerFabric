const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Controller for StampReporter Contract functions
 */
const stampReporterController = {
    /**
     * Validate documents for a case
     */
    validateDocuments: async (req, res) => {
        const { caseID, validationDetails } = req.body;
        if (!caseID || !validationDetails) {
            return res.status(400).json({ error: 'Missing caseID or validationDetails in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('ValidateDocuments', caseID, JSON.stringify(validationDetails));
            logger.info(`Documents for case ${caseID} validated successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Documents for case ${caseID} validated successfully`,
            });
        } catch (error) {
            logger.error(`Error validating documents: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to validate documents: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get pending cases
     */
    getPendingCases: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetPendingCases');
            const cases = JSON.parse(result.toString());
            logger.info(`Retrieved ${cases.length} pending cases`);
            
            return res.status(200).json({
                success: true,
                data: cases
            });
        } catch (error) {
            logger.error(`Error getting pending cases: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get pending cases: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get rejected cases
     */
    getRejectedCases: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetRejectedCases');
            const cases = JSON.parse(result.toString());
            logger.info(`Retrieved ${cases.length} rejected cases`);
            
            return res.status(200).json({
                success: true,
                data: cases
            });
        } catch (error) {
            logger.error(`Error getting rejected cases: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get rejected cases: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get on hold cases
     */
    getOnHoldCases: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetOnHoldCases');
            const cases = JSON.parse(result.toString());
            logger.info(`Retrieved ${cases.length} on hold cases`);
            
            return res.status(200).json({
                success: true,
                data: cases
            });
        } catch (error) {
            logger.error(`Error getting on hold cases: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get on hold cases: ${error.message}`,
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
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetCaseById', caseID);
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
     * Forward case to bench clerk
     */
    forwardCaseToBenchClerk: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('ForwardCaseToBenchClerk', caseID);
            logger.info(`Case ${caseID} forwarded to bench clerk successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} forwarded to bench clerk successfully`,
            });
        } catch (error) {
            logger.error(`Error forwarding case to bench clerk: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to forward case to bench clerk: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Forward case to lawyer
     */
    forwardCaseToLawyer: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('ForwardCaseToLawyer', caseID);
            logger.info(`Case ${caseID} forwarded to lawyer successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} forwarded to lawyer successfully`,
            });
        } catch (error) {
            logger.error(`Error forwarding case to lawyer: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to forward case to lawyer: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Fetch and store case from registrar channel
     */
    fetchFromRegistrarChannel: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.submitTransaction('FetchAndStoreCaseFromRegistrarChannel', caseID);
            const caseData = JSON.parse(result.toString());
            logger.info(`Case ${caseID} fetched from registrar channel successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} fetched from registrar channel successfully`,
                data: caseData
            });
        } catch (error) {
            logger.error(`Error fetching case from registrar channel: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to fetch case from registrar channel: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Sync case across channels
     */
    syncCaseAcrossChannels: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('SyncCaseAcrossChannels', caseID);
            logger.info(`Case ${caseID} synced across channels successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} synced across channels successfully`
            });
        } catch (error) {
            logger.error(`Error syncing case across channels: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to sync case across channels: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },
    
    /**
     * Get all pending cases from registrar
     */
    getAllPendingCasesFromRegistrar: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('GetAllPendingCasesFromRegistrar');
            logger.info('All pending cases fetched from registrar successfully');
            
            return res.status(200).json({
                success: true,
                message: 'All pending cases fetched from registrar successfully'
            });
        } catch (error) {
            logger.error(`Error fetching all pending cases from registrar: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to fetch all pending cases from registrar: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },
    
    /**
     * Get case statistics
     */
    queryStats: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.stampreporter;
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

module.exports = stampReporterController;
