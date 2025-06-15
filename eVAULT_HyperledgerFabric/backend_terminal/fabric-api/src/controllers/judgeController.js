const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Controller for Judge Contract functions
 */
const judgeController = {
    /**
     * Record judgment for a case
     */
    recordJudgment: async (req, res) => {
        const { caseID, judgmentDetails } = req.body;
        if (!caseID || !judgmentDetails) {
            return res.status(400).json({ error: 'Missing caseID or judgmentDetails in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.judge;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('RecordJudgment', caseID, JSON.stringify(judgmentDetails));
            logger.info(`Judgment for case ${caseID} recorded successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Judgment for case ${caseID} recorded successfully`,
            });
        } catch (error) {
            logger.error(`Error recording judgment: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to record judgment: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Add hearing notes to case
     */
    addHearingNotes: async (req, res) => {
        const { caseID, hearingDetails } = req.body;
        if (!caseID || !hearingDetails) {
            return res.status(400).json({ error: 'Missing caseID or hearingDetails in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.judge;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('AddHearingNotes', caseID, JSON.stringify(hearingDetails));
            logger.info(`Hearing notes added to case ${caseID} successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Hearing notes added to case ${caseID} successfully`,
            });
        } catch (error) {
            logger.error(`Error adding hearing notes: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to add hearing notes: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Store a case
     */
    storeCase: async (req, res) => {
        const { caseData } = req.body;
        if (!caseData) {
            return res.status(400).json({ error: 'Missing caseData in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.judge;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('StoreCase', JSON.stringify(caseData));
            logger.info(`Case stored successfully`);
            
            return res.status(200).json({
                success: true,
                message: 'Case stored successfully',
            });
        } catch (error) {
            logger.error(`Error storing case: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to store case: ${error.message}`,
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
            const fabricConfig = config.fabric.judge;
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
            const fabricConfig = config.fabric.judge;
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
     * Fetch and store case from bench clerk channel
     */
    fetchFromBenchClerkChannel: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.judge;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.submitTransaction('FetchAndStoreCaseFromBenchClerkChannel', caseID);
            const caseData = JSON.parse(result.toString());
            logger.info(`Case ${caseID} fetched from bench clerk channel successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} fetched from bench clerk channel successfully`,
                data: caseData
            });
        } catch (error) {
            logger.error(`Error fetching case from bench clerk channel: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to fetch case from bench clerk channel: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get judged cases
     */
    getJudgedCases: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.judge;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetJudgedCases');
            const cases = JSON.parse(result.toString());
            logger.info(`Retrieved ${cases.length} judged cases`);
            
            return res.status(200).json({
                success: true,
                data: cases
            });
        } catch (error) {
            logger.error(`Error getting judged cases: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get judged cases: ${error.message}`,
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
            const fabricConfig = config.fabric.judge;
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

module.exports = judgeController;
