const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Controller for BenchClerk Contract functions
 */
const benchClerkController = {
    /**
     * Forward case to judge
     */
    forwardToJudge: async (req, res) => {
        const { caseID, assignmentDetails } = req.body;
        if (!caseID || !assignmentDetails) {
            return res.status(400).json({ error: 'Missing caseID or assignmentDetails in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('ForwardToJudge', caseID, JSON.stringify(assignmentDetails));
            logger.info(`Case ${caseID} forwarded to judge successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} forwarded to judge successfully`,
            });
        } catch (error) {
            logger.error(`Error forwarding case to judge: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to forward case to judge: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Update hearing details
     */
    updateHearingDetails: async (req, res) => {
        const { caseID, hearingDetails } = req.body;
        if (!caseID || !hearingDetails) {
            return res.status(400).json({ error: 'Missing caseID or hearingDetails in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('UpdateHearingDetails', caseID, JSON.stringify(hearingDetails));
            logger.info(`Hearing details for case ${caseID} updated successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Hearing details for case ${caseID} updated successfully`,
            });
        } catch (error) {
            logger.error(`Error updating hearing details: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to update hearing details: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Notify lawyer
     */
    notifyLawyer: async (req, res) => {
        const { caseID, notificationDetails } = req.body;
        if (!caseID || !notificationDetails) {
            return res.status(400).json({ error: 'Missing caseID or notificationDetails in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('NotifyLawyer', caseID, JSON.stringify(notificationDetails));
            logger.info(`Lawyer notified for case ${caseID} successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Lawyer notified for case ${caseID} successfully`,
            });
        } catch (error) {
            logger.error(`Error notifying lawyer: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to notify lawyer: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get case details
     */
    getCaseDetails: async (req, res) => {
        const { caseID } = req.params;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID parameter' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetCaseDetails', caseID);
            const caseData = JSON.parse(result.toString());
            logger.info(`Retrieved case details for ${caseID}`);
            
            return res.status(200).json({
                success: true,
                data: caseData
            });
        } catch (error) {
            logger.error(`Error getting case details: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get case details: ${error.message}`,
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
            const fabricConfig = config.fabric.benchclerk;
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
     * Store case
     */
    storeCase: async (req, res) => {
        const { caseData } = req.body;
        if (!caseData) {
            return res.status(400).json({ error: 'Missing caseData in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('StoreCase', JSON.stringify(caseData));
            logger.info('Case stored successfully');
            
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
     * Fetch and store case from stamp reporter channel
     */
    fetchFromStampReporterChannel: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.submitTransaction('FetchAndStoreCaseFromStampReporterChannel', caseID);
            const caseData = JSON.parse(result.toString());
            logger.info(`Case ${caseID} fetched from stamp reporter channel successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} fetched from stamp reporter channel successfully`,
                data: caseData
            });
        } catch (error) {
            logger.error(`Error fetching case from stamp reporter channel: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to fetch case from stamp reporter channel: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Fetch and store case from judge channel
     */
    fetchFromJudgeChannel: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.benchclerk;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('FetchAndStoreCaseFromJudgeChannel');
            logger.info('Cases fetched from judge channel successfully');
            
            return res.status(200).json({
                success: true,
                message: 'Cases fetched from judge channel successfully'
            });
        } catch (error) {
            logger.error(`Error fetching cases from judge channel: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to fetch cases from judge channel: ${error.message}`,
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
            const fabricConfig = config.fabric.benchclerk;
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

module.exports = benchClerkController;
