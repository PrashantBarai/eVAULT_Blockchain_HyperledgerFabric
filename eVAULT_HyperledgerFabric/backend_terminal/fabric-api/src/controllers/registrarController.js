const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');
const config = require('../config/config');
const logger = require('../utils/logger');
const axios = require('axios');

// Client backend URL for MongoDB operations
const CLIENT_BACKEND_URL = 'http://localhost:3000';

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
    },

    /**
     * Forward case to stamp reporter channel (cross-channel invocation)
     * Uses the smart contract's FetchAndStoreCaseFromLawyerChannel function which handles
     * cross-channel invocation internally via ctx.GetStub().InvokeChaincode()
     * 
     * The flow is:
     * 1. Connect to registrar-stampreporter-channel
     * 2. Call FetchAndStoreCaseFromLawyerChannel which:
     *    a. Reads case from lawyer-registrar-channel via InvokeChaincode
     *    b. Updates status on lawyer-registrar-channel to TRANSFERRED_TO_STAMPREPORTER
     *    c. Stores case on registrar-stampreporter-channel
     *    d. Calls StoreCase on stampreporter chaincode via InvokeChaincode
     *    e. Assigns case to stamp reporter
     */
    forwardToStampReporterChannel: async (req, res) => {
        const { caseID, department } = req.body;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }

        let gateway;
        try {
            const fabricConfig = config.fabric.registrar;
            const forwardChannelName = fabricConfig.forwardChannel || 'registrar-stampreporter-channel';
            
            // Connect to registrar-stampreporter-channel using registrar chaincode
            // The registrar chaincode handles the cross-channel invocation internally
            const { contract, gateway: g } = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                forwardChannelName,  // registrar-stampreporter-channel
                fabricConfig.chaincodeName  // registrar chaincode (has FetchAndStoreCaseFromLawyerChannel)
            );
            gateway = g;

            logger.info(`Calling FetchAndStoreCaseFromLawyerChannel for case ${caseID}`);
            
            // This function handles:
            // - Reading from lawyer-registrar-channel
            // - Updating status on lawyer-registrar-channel
            // - Storing on registrar-stampreporter-channel
            // - Syncing to stampreporter chaincode via StoreCase
            // - Assigning to stamp reporter
            await contract.submitTransaction('FetchAndStoreCaseFromLawyerChannel', caseID);
            
            logger.info(`Case ${caseID} successfully forwarded to stamp reporter channel`);
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} forwarded to stamp reporter channel successfully`,
                data: { caseID, channel: forwardChannelName }
            });
        } catch (error) {
            logger.error(`Error forwarding case to stamp reporter channel: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to forward case to stamp reporter channel: ${error.message}`,
            });
        } finally {
            if (gateway) await disconnectFromNetwork(gateway);
        }
    },

    /**
     * SEQUENTIAL BLOCKCHAIN OPERATIONS: Verify and Forward Case to Stamp Reporter
     * 
     * This endpoint performs multiple blockchain operations in sequence:
     * 1. VerifyCase on lawyer-registrar-channel (marks case as VERIFIED_BY_REGISTRAR)
     * 2. FetchAndStoreCaseFromLawyerChannel on registrar-stampreporter-channel (cross-channel transfer)
     * 
     * The lawyer dashboard aggregates data from multiple channels to show complete timeline.
     */
    verifyAndForwardToStampReporter: async (req, res) => {
        const { caseID, verificationDetails, department } = req.body;
        
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID in request body' });
        }
        if (!verificationDetails) {
            return res.status(400).json({ error: 'Missing verificationDetails in request body' });
        }

        let gateway1 = null;
        let gateway2 = null;
        const results = {
            verify: { success: false, message: '' },
            forward: { success: false, message: '' }
        };

        try {
            const fabricConfig = config.fabric.registrar;
            
            // ================================================================
            // PRE-CHECK: Get current case status
            // ================================================================
            const connection1 = await connectToNetwork(
                fabricConfig.org, 
                fabricConfig.user, 
                fabricConfig.channelName,  // lawyer-registrar-channel
                fabricConfig.chaincodeName // registrar
            );
            gateway1 = connection1.gateway;

            // Check current status
            const currentCaseResult = await connection1.contract.evaluateTransaction('GetCaseById', caseID);
            const currentCase = JSON.parse(currentCaseResult.toString());
            logger.info(`[Pre-check] Current case status: ${currentCase.status}`);

            // If already verified, skip Step 1 and go directly to Step 2
            const skipVerification = currentCase.status === 'VERIFIED_BY_REGISTRAR';
            
            // ================================================================
            // STEP 1: VerifyCase on lawyer-registrar-channel (if not already verified)
            // ================================================================
            if (!skipVerification) {
                logger.info(`[Step 1/2] Verifying case ${caseID} on ${fabricConfig.channelName}`);
                
                await connection1.contract.submitTransaction(
                    'VerifyCase', 
                    caseID, 
                    JSON.stringify(verificationDetails)
                );
                
                results.verify = {
                    success: true,
                    message: `Case ${caseID} verified on ${fabricConfig.channelName}`
                };
                logger.info(`[Step 1/2] ✓ Case ${caseID} verified successfully`);
            } else {
                results.verify = {
                    success: true,
                    message: `Case ${caseID} already verified, skipping verification step`
                };
                logger.info(`[Step 1/2] ⊙ Case ${caseID} already verified, proceeding to forward`);
            }
            
            // ================================================================
            // STEP 2: Fetch case data and store on registrar-stampreporter-channel
            // ================================================================
            // First, get the case data from lawyer-registrar-channel
            const caseResult = await connection1.contract.evaluateTransaction('GetCaseById', caseID);
            const caseData = JSON.parse(caseResult.toString());
            logger.info(`[Step 2/2] Retrieved case data from lawyer-registrar-channel`);
            
            // Disconnect from first channel before connecting to second
            await disconnectFromNetwork(gateway1);
            gateway1 = null;

            // Update case status for the new channel
            caseData.status = 'PENDING_STAMP_REPORTER_REVIEW';
            caseData.currentOrg = 'StampReportersOrg';
            caseData.lastModified = new Date().toISOString();
            
            // Add history entry for the transfer
            if (!caseData.history) caseData.history = [];
            caseData.history.push({
                status: 'TRANSFERRED_TO_STAMPREPORTER',
                organization: 'RegistrarsOrg',
                timestamp: new Date().toISOString(),
                comments: 'Case transferred to stamp reporter for validation'
            });

            const forwardChannelName = fabricConfig.forwardChannel || 'registrar-stampreporter-channel';
            logger.info(`[Step 2/2] Storing case ${caseID} on ${forwardChannelName} via STAMPREPORTER chaincode namespace`);
            
            // CRITICAL: Must use the STAMPREPORTER chaincode (not registrar) because
            // each chaincode has its own namespace on the same channel.
            // The stampreporter dashboard reads from the stampreporter namespace,
            // so we must write to that namespace via the stampreporter chaincode.
            // stampreporter.go StoreCase allows RegistrarsOrg to call it.
            const stampreporterChaincode = 'stampreporter';
            
            // Retry logic for Step 2 - DiscoveryService can intermittently fail on Microfab
            const MAX_RETRIES = 3;
            let lastError = null;
            
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    if (gateway2) {
                        await disconnectFromNetwork(gateway2);
                        gateway2 = null;
                    }
                    
                    logger.info(`[Step 2/2] Connection attempt ${attempt}/${MAX_RETRIES} to ${forwardChannelName} using ${stampreporterChaincode} chaincode`);
                    
                    const connection2 = await connectToNetwork(
                        fabricConfig.org, 
                        fabricConfig.user, 
                        forwardChannelName,       // registrar-stampreporter-channel
                        stampreporterChaincode     // stampreporter chaincode = stampreporter namespace
                    );
                    gateway2 = connection2.gateway;

                    // StoreCase uses PutState which is an upsert - always use StoreCase
                    logger.info(`[Step 2/2] Storing case on ${forwardChannelName} via stampreporter chaincode`);
                    await connection2.contract.submitTransaction(
                        'StoreCase', 
                        JSON.stringify(caseData)
                    );
                    
                    // Success - break out of retry loop
                    lastError = null;
                    break;
                } catch (retryErr) {
                    lastError = retryErr;
                    logger.warn(`[Step 2/2] Attempt ${attempt}/${MAX_RETRIES} failed: ${retryErr.message}`);
                    if (attempt < MAX_RETRIES) {
                        const delay = attempt * 2000; // 2s, 4s backoff
                        logger.info(`[Step 2/2] Retrying in ${delay/1000}s...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            
            if (lastError) {
                throw lastError; // All retries exhausted - will trigger rollback
            }
            
            results.forward = {
                success: true,
                message: `Case ${caseID} stored on ${forwardChannelName}`
            };
            logger.info(`[Step 2/2] ✓ Case ${caseID} stored on ${forwardChannelName} successfully`);
            
            // ================================================================
            // STEP 3: Update lawyer-registrar-channel with forwarded status
            // So lawyers can see the case has been forwarded
            // CRITICAL: Must use the LAWYER chaincode (not registrar) because
            // the lawyer dashboard's GetAllCases reads from the lawyer namespace.
            // Each chaincode has its own namespace on the same channel.
            // ================================================================
            logger.info(`[Step 3/3] Updating lawyer-registrar-channel via LAWYER chaincode namespace`);
            
            // Reconnect to lawyer-registrar-channel
            await disconnectFromNetwork(gateway2);
            gateway2 = null;
            
            // Update the case with forwarded status
            caseData.status = 'FORWARDED_TO_STAMPREPORTER';
            caseData.currentOrg = 'StampReportersOrg';
            caseData.lastModified = new Date().toISOString();
            
            // Add forwarded history entry
            caseData.history.push({
                status: 'FORWARDED_TO_STAMPREPORTER',
                organization: 'RegistrarsOrg',
                timestamp: new Date().toISOString(),
                comments: 'Case forwarded to stamp reporter organization'
            });
            
            // Retry logic for Step 3 as well
            let step3Error = null;
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
                try {
                    if (gateway1) {
                        await disconnectFromNetwork(gateway1);
                        gateway1 = null;
                    }
                    
                    // Use LAWYER chaincode config to write to the lawyer namespace
                    const lawyerConfig = config.fabric.lawyer;
                    const connection3 = await connectToNetwork(
                        lawyerConfig.org, 
                        lawyerConfig.user, 
                        'lawyer-registrar-channel',  // Same channel
                        'lawyer'                     // LAWYER chaincode = lawyer namespace
                    );
                    gateway1 = connection3.gateway;
                    
                    // Use StoreCase on the LAWYER chaincode to update the lawyer namespace
                    await connection3.contract.submitTransaction(
                        'StoreCase',
                        JSON.stringify(caseData)
                    );
                    
                    step3Error = null;
                    break;
                } catch (retryErr) {
                    step3Error = retryErr;
                    logger.warn(`[Step 3/3] Attempt ${attempt}/${MAX_RETRIES} failed: ${retryErr.message}`);
                    if (attempt < MAX_RETRIES) {
                        const delay = attempt * 2000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            
            if (step3Error) {
                // Step 3 failed but Step 2 succeeded - case IS on stampreporter channel
                // Log warning but don't rollback - lawyer can still see via getCaseById aggregation
                logger.warn(`[Step 3/3] Failed to update lawyer namespace: ${step3Error.message}. Case is on stampreporter channel.`);
            } else {
                logger.info(`[Step 3/3] ✓ Updated lawyer namespace on lawyer-registrar-channel with forwarded status`);
            }
            
            // ================================================================
            // ALL BLOCKCHAIN OPERATIONS COMPLETE - NOW UPDATE MONGODB
            // ================================================================
            logger.info(`All blockchain operations complete for case ${caseID}`);
            
            // CRITICAL: Update MongoDB ONLY after blockchain success
            try {
                await axios.post(`${CLIENT_BACKEND_URL}/update-case-status`, {
                    caseID: caseID,
                    status: 'FORWARDED_TO_STAMPREPORTER',
                    currentOrg: 'StampReportersOrg',
                    timeline: [
                        {
                            status: 'VERIFIED_BY_REGISTRAR',
                            organization: 'RegistrarsOrg',
                            timestamp: new Date().toISOString(),
                            comments: verificationDetails.comments || 'Case verified by registrar'
                        },
                        {
                            status: 'FORWARDED_TO_STAMPREPORTER',
                            organization: 'RegistrarsOrg',
                            timestamp: new Date().toISOString(),
                            comments: 'Case forwarded to stamp reporter organization'
                        }
                    ]
                });
                logger.info(`✓ MongoDB updated successfully for case ${caseID}`);
            } catch (mongoError) {
                logger.warn(`MongoDB update failed (non-critical): ${mongoError.message}`);
                // Don't fail the request - blockchain is source of truth
            }
            
            return res.status(200).json({
                success: true,
                message: `Case ${caseID} verified and forwarded to stamp reporter successfully`,
                data: {
                    caseID,
                    department: department || '',
                    steps: results
                }
            });

        } catch (error) {
            logger.error(`Error in verifyAndForwardToStampReporter: ${error.message}`);
            
            // ================================================================
            // CRITICAL: REVERT Step 1 if Step 2 failed
            // Use StoreCase to reset status to PENDING_REGISTRAR_REVIEW instead of
            // VerifyCase(isVerified=false) which would create a REJECTED_BY_REGISTRAR
            // history entry on-chain. StoreCase overwrites the entire case state cleanly.
            // ================================================================
            if (results.verify.success && !results.forward.success) {
                logger.warn(`[ROLLBACK] Step 2 failed, reverting Step 1 verification...`);
                
                try {
                    // Reconnect to lawyer-registrar-channel to revert
                    const revertConnection = await connectToNetwork(
                        config.fabric.registrar.org, 
                        config.fabric.registrar.user, 
                        config.fabric.registrar.channelName,
                        config.fabric.registrar.chaincodeName
                    );
                    
                    // Get the current case state from registrar namespace
                    const currentResult = await revertConnection.contract.evaluateTransaction('GetCaseById', caseID);
                    const currentState = JSON.parse(currentResult.toString());
                    
                    // Reset status back to pending without adding REJECTED history
                    currentState.status = 'PENDING_REGISTRAR_REVIEW';
                    currentState.currentOrg = 'RegistrarsOrg';
                    currentState.lastModified = new Date().toISOString();
                    
                    // Add a clean rollback history entry (not REJECTED)
                    if (!currentState.history) currentState.history = [];
                    currentState.history.push({
                        status: 'PENDING_REGISTRAR_REVIEW',
                        organization: 'RegistrarsOrg',
                        timestamp: new Date().toISOString(),
                        comments: 'Verification rolled back due to forward failure - please retry'
                    });
                    
                    // Use StoreCase to overwrite cleanly (no REJECTED status)
                    await revertConnection.contract.submitTransaction(
                        'StoreCase',
                        JSON.stringify(currentState)
                    );
                    
                    await disconnectFromNetwork(revertConnection.gateway);
                    logger.info(`[ROLLBACK] ✓ Successfully reverted to PENDING_REGISTRAR_REVIEW for case ${caseID}`);
                    
                    return res.status(500).json({
                        success: false,
                        message: `Transaction failed and was rolled back. Please retry the operation.`,
                        error: error.message,
                        rolledBack: true
                    });
                } catch (revertError) {
                    logger.error(`[ROLLBACK] ✗ Failed to revert: ${revertError.message}`);
                    
                    return res.status(500).json({
                        success: false,
                        message: `Transaction failed. Case is in inconsistent state (verified but not forwarded). Contact admin.`,
                        error: error.message,
                        revertError: revertError.message,
                        rolledBack: false,
                        caseID: caseID
                    });
                }
            }
            
            // Return partial results so frontend knows what succeeded/failed
            return res.status(500).json({
                success: false,
                message: `Failed during sequential blockchain operations: ${error.message}`,
                partialResults: results,
                failedAt: results.verify.success ? 'forward' : 'verify'
            });
        } finally {
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
        }
    }
};

module.exports = registrarController;
