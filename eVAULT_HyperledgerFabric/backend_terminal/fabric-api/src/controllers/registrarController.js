const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Controller for Registrar Contract functions
 */
const registrarController = {
    /**
     * Verify a case by ID
     */
    verifyCase: async (req, res) => {
        const { caseID, verificationDetails } = req.body;
        if (!caseID || !verificationDetails) {
            return res.status(400).json({ error: 'Missing caseID or verificationDetails in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.registrar;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('VerifyCase', caseID, JSON.stringify(verificationDetails));
            logger.info(`Case ${caseID} verified successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} verified successfully`,
            });
        } catch (error) {
            logger.error(`Error verifying case: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to verify case: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Assign case to stamp reporter
     */
    assignToStampReporter: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.registrar;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('AssignToStampReporter', caseID);
            logger.info(`Case ${caseID} assigned to stamp reporter successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} assigned to stamp reporter successfully`,
            });
        } catch (error) {
            logger.error(`Error assigning case to stamp reporter: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to assign case to stamp reporter: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Receive a new case
     */
    receiveCase: async (req, res) => {
        const { caseData } = req.body;
        if (!caseData) {
            return res.status(400).json({ error: 'Missing case data in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.registrar;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('ReceiveCase', JSON.stringify(caseData));
            logger.info('Case received successfully');
            
            return res.status(200).json({
                success: true,
                message: 'Case received successfully',
            });
        } catch (error) {
            logger.error(`Error receiving case: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to receive case: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get pending cases
     */
    getPendingCases: async (req, res) => {
        const filter = req.query.filter || '{}';

        let gateway;
        try {
            const fabricConfig = config.fabric.registrar;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetPendingCases', filter);
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
     * Get verified cases
     */
    getVerifiedCases: async (req, res) => {
        const filter = req.query.filter || '{}';

        let gateway;
        try {
            const fabricConfig = config.fabric.registrar;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            const result = await contract.evaluateTransaction('GetVerifiedCases', filter);
            const cases = JSON.parse(result.toString());
            logger.info(`Retrieved ${cases.length} verified cases`);
            
            return res.status(200).json({
                success: true,
                data: cases
            });
        } catch (error) {
            logger.error(`Error getting verified cases: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get verified cases: ${error.message}`,
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
            const fabricConfig = config.fabric.registrar;
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
     * Update case
     */
    updateCase: async (req, res) => {
        const { caseID, caseData } = req.body;
        if (!caseID || !caseData) {
            return res.status(400).json({ error: 'Missing caseID or caseData in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.registrar;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('UpdateCase', caseID, JSON.stringify(caseData));
            logger.info(`Case ${caseID} updated successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} updated successfully`,
            });
        } catch (error) {
            logger.error(`Error updating case: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to update case: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Fetch case from lawyer channel
     */
    fetchFromLawyerChannel: async (req, res) => {
        const { caseID } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.registrar;
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName, 
                fabricConfig.chaincodeName
            );
            gateway = g;

            await contract.submitTransaction('FetchAndStoreCaseFromLawyerChannel', caseID);
            logger.info(`Case ${caseID} fetched from lawyer channel successfully`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} fetched from lawyer channel successfully`,
            });
        } catch (error) {
            logger.error(`Error fetching case from lawyer channel: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to fetch case from lawyer channel: ${error.message}`,
            });
        } finally {
            await disconnectFromNetwork(gateway);
        }
    },

    /**
     * Get statistical data about cases
     */
    queryStats: async (req, res) => {
        let gateway;
        try {
            const fabricConfig = config.fabric.registrar;
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

module.exports = registrarController;
