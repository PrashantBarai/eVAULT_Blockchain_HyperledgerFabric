const { connectToNetwork, disconnectFromNetwork } = require('../fabric/network');
const config = require('../config/config');
const logger = require('../utils/logger');
const axios = require('axios');

// Client backend URL for MongoDB operations
const CLIENT_BACKEND_URL = 'http://localhost:3000';

/**
 * Controller for Lawyer Contract functions
 */
const lawyerController = {
    /**
     * Create a new case
     */
    createCase: async (req, res) => {
        // Debug logging
        console.log('Request body:', req.body);
        console.log('Content-Type:', req.headers['content-type']);
        
        // Handle FormData from frontend - matching actual field names
        const {
            uid_party1,
            uid_party2,
            filed_date,
            associated_lawyers,
            associated_judge,
            case_subject,
            latest_update,
            status,
            user_id,
            user_name,
            client,
            case_type,
            description,
            documents
        } = req.body;

        // Validate required fields
        if (!uid_party1 || !uid_party2 || !case_subject) {
            return res.status(400).json({ error: 'Missing required fields: uid_party1, uid_party2, case_subject' });
        }

        // Generate unique case ID and number
        const caseId = `CASE_${Date.now()}`;
        const caseNumber = `CN${Math.floor(Math.random() * 100000)}`;
        const currentTimestamp = new Date().toISOString();
        
        // Create case data object matching chaincode structure exactly
        const caseData = {
            id: caseId,
            caseNumber: caseNumber,
            title: case_subject,
            type: case_type || 'GENERAL',
            description: description || '',
            status: 'CREATED',
            currentOrg: 'LawyersOrg',
            uidParty1: uid_party1,
            uidParty2: uid_party2,
            filedDate: filed_date || currentTimestamp,
            associatedLawyers: associated_lawyers ? [associated_lawyers] : [user_name || user_id || 'unknown'],
            associatedJudge: associated_judge || '',
            caseSubject: case_subject,
            clientName: client || '',
            department: 'Civil Court',
            createdBy: user_name || user_id || 'unknown',
            createdAt: currentTimestamp,
            lastModified: currentTimestamp,
            decision: '',
            documents: documents || [],
            history: [],
            hearings: []
        };

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
            logger.info(`Case created successfully with ID: ${caseData.id}`);
            
            // Update user's cases array in MongoDB via client_backend
            if (user_id) {
                try {
                    await axios.post(`${CLIENT_BACKEND_URL}/user/add-case`, {
                        user_id: user_id,
                        case_id: caseData.id
                    });
                    logger.info(`Added case ${caseData.id} to user ${user_id}'s cases array`);
                } catch (mongoErr) {
                    logger.warn(`Failed to update user's cases array: ${mongoErr.message}`);
                    // Continue anyway - blockchain is the source of truth
                }
            }
            
            return res.status(200).json({
                success: true,
                message: 'Case created successfully',
                case_id: caseData.id // Return the actual blockchain case ID
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
     * Get case by ID - Aggregates data from multiple channels for complete timeline
     * 
     * Channel topology for lawyer:
     * - lawyer-registrar-channel: Initial case data + registrar updates
     * - stampreporter-lawyer-channel: Stamp reporter updates  
     * - benchclerk-lawyer-channel: Bench clerk updates
     * 
     * This ensures the lawyer dashboard shows the complete case journey.
     */
    getCaseById: async (req, res) => {
        const { caseID } = req.params;
        if (!caseID) {
            return res.status(400).json({ error: 'Missing caseID parameter' });
        }

        let gateway1 = null;
        let gateway2 = null;
        let gateway3 = null;
        
        try {
            const fabricConfig = config.fabric.lawyer;
            let primaryCaseData = null;
            let allHistoryItems = [];
            let latestStatus = null;
            let latestCurrentOrg = null;
            let latestModified = null;

            // ================================================================
            // Channel 1: lawyer-registrar-channel (primary source)
            // ================================================================
            try {
                const connection1 = await connectToNetwork(
                    fabricConfig.org, 
                    fabricConfig.user, 
                    'lawyer-registrar-channel', 
                    'lawyer'
                );
                gateway1 = connection1.gateway;

                const result1 = await connection1.contract.evaluateTransaction('GetCase', caseID);
                primaryCaseData = JSON.parse(result1.toString());
                
                if (primaryCaseData.history) {
                    allHistoryItems.push(...primaryCaseData.history);
                }
                latestStatus = primaryCaseData.status;
                latestCurrentOrg = primaryCaseData.currentOrg;
                latestModified = primaryCaseData.lastModified;
                
                logger.info(`[Channel 1] Retrieved case ${caseID} from lawyer-registrar-channel`);
            } catch (err) {
                logger.warn(`[Channel 1] Could not fetch from lawyer-registrar-channel: ${err.message}`);
            } finally {
                if (gateway1) await disconnectFromNetwork(gateway1);
                gateway1 = null;
            }

            // ================================================================
            // Channel 2: stampreporter-lawyer-channel (stamp reporter updates)
            // ================================================================
            try {
                const connection2 = await connectToNetwork(
                    fabricConfig.org, 
                    fabricConfig.user, 
                    'stampreporter-lawyer-channel', 
                    'lawyer'
                );
                gateway2 = connection2.gateway;

                const result2 = await connection2.contract.evaluateTransaction('GetCase', caseID);
                const stampReporterData = JSON.parse(result2.toString());
                
                if (stampReporterData.history) {
                    // Add history items that don't already exist
                    stampReporterData.history.forEach(item => {
                        const exists = allHistoryItems.some(h => 
                            h.status === item.status && h.timestamp === item.timestamp
                        );
                        if (!exists) {
                            allHistoryItems.push(item);
                        }
                    });
                }
                
                // Update to latest status if this channel has newer data
                if (stampReporterData.lastModified && 
                    (!latestModified || new Date(stampReporterData.lastModified) > new Date(latestModified))) {
                    latestStatus = stampReporterData.status;
                    latestCurrentOrg = stampReporterData.currentOrg;
                    latestModified = stampReporterData.lastModified;
                }
                
                logger.info(`[Channel 2] Retrieved case ${caseID} from stampreporter-lawyer-channel`);
            } catch (err) {
                logger.debug(`[Channel 2] Case not found on stampreporter-lawyer-channel: ${err.message}`);
            } finally {
                if (gateway2) await disconnectFromNetwork(gateway2);
                gateway2 = null;
            }

            // ================================================================
            // Channel 3: benchclerk-lawyer-channel (bench clerk updates)
            // ================================================================
            try {
                const connection3 = await connectToNetwork(
                    fabricConfig.org, 
                    fabricConfig.user, 
                    'benchclerk-lawyer-channel', 
                    'lawyer'
                );
                gateway3 = connection3.gateway;

                const result3 = await connection3.contract.evaluateTransaction('GetCase', caseID);
                const benchClerkData = JSON.parse(result3.toString());
                
                if (benchClerkData.history) {
                    // Add history items that don't already exist
                    benchClerkData.history.forEach(item => {
                        const exists = allHistoryItems.some(h => 
                            h.status === item.status && h.timestamp === item.timestamp
                        );
                        if (!exists) {
                            allHistoryItems.push(item);
                        }
                    });
                }
                
                // Update to latest status if this channel has newer data
                if (benchClerkData.lastModified && 
                    (!latestModified || new Date(benchClerkData.lastModified) > new Date(latestModified))) {
                    latestStatus = benchClerkData.status;
                    latestCurrentOrg = benchClerkData.currentOrg;
                    latestModified = benchClerkData.lastModified;
                }
                
                logger.info(`[Channel 3] Retrieved case ${caseID} from benchclerk-lawyer-channel`);
            } catch (err) {
                logger.debug(`[Channel 3] Case not found on benchclerk-lawyer-channel: ${err.message}`);
            } finally {
                if (gateway3) await disconnectFromNetwork(gateway3);
                gateway3 = null;
            }

            // ================================================================
            // Merge and return aggregated data
            // ================================================================
            if (!primaryCaseData) {
                return res.status(404).json({
                    success: false,
                    message: `Case ${caseID} not found`
                });
            }

            // Sort history by timestamp
            allHistoryItems.sort((a, b) => {
                const dateA = new Date(a.timestamp || 0);
                const dateB = new Date(b.timestamp || 0);
                return dateA - dateB;
            });

            // Build final aggregated case data
            const aggregatedCaseData = {
                ...primaryCaseData,
                status: latestStatus || primaryCaseData.status,
                currentOrg: latestCurrentOrg || primaryCaseData.currentOrg,
                lastModified: latestModified || primaryCaseData.lastModified,
                history: allHistoryItems
            };

            logger.info(`Retrieved and aggregated case ${caseID} from ${allHistoryItems.length} history items`);
            
            return res.status(200).json({
                success: true,
                data: aggregatedCaseData
            });
        } catch (error) {
            logger.error(`Error getting case by ID: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get case: ${error.message}`,
            });
        } finally {
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
            if (gateway3) await disconnectFromNetwork(gateway3);
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
     * Get all cases - Aggregates from multiple channels for complete status view
     * 
     * Each chaincode has its own namespace on the same channel, and different
     * channels have separate ledgers. To get the latest status of all cases,
     * we need to query the lawyer namespace on all channels the lawyer org is on:
     * - lawyer-registrar-channel (primary: case creation, registrar updates)
     * - stampreporter-lawyer-channel (stamp reporter updates)
     * - benchclerk-lawyer-channel (bench clerk updates)
     */
    getAllCases: async (req, res) => {
        let gateway1 = null;
        let gateway2 = null;
        let gateway3 = null;
        
        try {
            const fabricConfig = config.fabric.lawyer;
            const casesMap = new Map(); // caseID -> case data (keeps latest version)

            // ================================================================
            // Channel 1: lawyer-registrar-channel (primary source)
            // ================================================================
            try {
                const connection1 = await connectToNetwork(
                    fabricConfig.org, 
                    fabricConfig.user, 
                    'lawyer-registrar-channel', 
                    'lawyer'
                );
                gateway1 = connection1.gateway;

                const result = await connection1.contract.evaluateTransaction('GetAllCases');
                const resultString = result.toString();
                if (resultString && resultString.trim() !== '') {
                    const cases = JSON.parse(resultString);
                    if (Array.isArray(cases)) {
                        cases.forEach(c => {
                            casesMap.set(c.id || c.ID, c);
                        });
                    }
                }
                logger.info(`[getAllCases Ch1] Retrieved ${casesMap.size} cases from lawyer-registrar-channel`);
            } catch (err) {
                logger.warn(`[getAllCases Ch1] Error querying lawyer-registrar-channel: ${err.message}`);
            } finally {
                if (gateway1) await disconnectFromNetwork(gateway1);
                gateway1 = null;
            }

            // ================================================================
            // Channel 2: stampreporter-lawyer-channel (stamp reporter updates)
            // ================================================================
            try {
                const connection2 = await connectToNetwork(
                    fabricConfig.org, 
                    fabricConfig.user, 
                    'stampreporter-lawyer-channel', 
                    'lawyer'
                );
                gateway2 = connection2.gateway;

                const result = await connection2.contract.evaluateTransaction('GetAllCases');
                const resultString = result.toString();
                if (resultString && resultString.trim() !== '') {
                    const cases = JSON.parse(resultString);
                    if (Array.isArray(cases)) {
                        cases.forEach(c => {
                            const caseId = c.id || c.ID;
                            const existing = casesMap.get(caseId);
                            // Keep the version with the most recent lastModified
                            if (!existing || 
                                (c.lastModified && new Date(c.lastModified) > new Date(existing.lastModified || 0))) {
                                // Merge history from both sources
                                if (existing && existing.history) {
                                    const mergedHistory = [...(existing.history || [])];
                                    (c.history || []).forEach(item => {
                                        const exists = mergedHistory.some(h => 
                                            h.status === item.status && h.timestamp === item.timestamp
                                        );
                                        if (!exists) mergedHistory.push(item);
                                    });
                                    mergedHistory.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                                    c.history = mergedHistory;
                                }
                                casesMap.set(caseId, c);
                            } else if (existing && c.history) {
                                // Even if not newer, merge history items
                                c.history.forEach(item => {
                                    const exists = existing.history.some(h => 
                                        h.status === item.status && h.timestamp === item.timestamp
                                    );
                                    if (!exists) existing.history.push(item);
                                });
                                existing.history.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                            }
                        });
                    }
                }
                logger.info(`[getAllCases Ch2] Merged cases from stampreporter-lawyer-channel`);
            } catch (err) {
                logger.debug(`[getAllCases Ch2] No cases on stampreporter-lawyer-channel: ${err.message}`);
            } finally {
                if (gateway2) await disconnectFromNetwork(gateway2);
                gateway2 = null;
            }

            // ================================================================
            // Channel 3: benchclerk-lawyer-channel (bench clerk updates)
            // ================================================================
            try {
                const connection3 = await connectToNetwork(
                    fabricConfig.org, 
                    fabricConfig.user, 
                    'benchclerk-lawyer-channel', 
                    'lawyer'
                );
                gateway3 = connection3.gateway;

                const result = await connection3.contract.evaluateTransaction('GetAllCases');
                const resultString = result.toString();
                if (resultString && resultString.trim() !== '') {
                    const cases = JSON.parse(resultString);
                    if (Array.isArray(cases)) {
                        cases.forEach(c => {
                            const caseId = c.id || c.ID;
                            const existing = casesMap.get(caseId);
                            if (!existing || 
                                (c.lastModified && new Date(c.lastModified) > new Date(existing.lastModified || 0))) {
                                if (existing && existing.history) {
                                    const mergedHistory = [...(existing.history || [])];
                                    (c.history || []).forEach(item => {
                                        const exists = mergedHistory.some(h => 
                                            h.status === item.status && h.timestamp === item.timestamp
                                        );
                                        if (!exists) mergedHistory.push(item);
                                    });
                                    mergedHistory.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                                    c.history = mergedHistory;
                                }
                                casesMap.set(caseId, c);
                            } else if (existing && c.history) {
                                c.history.forEach(item => {
                                    const exists = existing.history.some(h => 
                                        h.status === item.status && h.timestamp === item.timestamp
                                    );
                                    if (!exists) existing.history.push(item);
                                });
                                existing.history.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                            }
                        });
                    }
                }
                logger.info(`[getAllCases Ch3] Merged cases from benchclerk-lawyer-channel`);
            } catch (err) {
                logger.debug(`[getAllCases Ch3] No cases on benchclerk-lawyer-channel: ${err.message}`);
            } finally {
                if (gateway3) await disconnectFromNetwork(gateway3);
                gateway3 = null;
            }

            // ================================================================
            // Return aggregated results
            // ================================================================
            const cases = Array.from(casesMap.values());
            logger.info(`Retrieved ${cases.length} aggregated cases from all channels`);
            
            return res.status(200).json({
                success: true,
                data: cases,
                count: cases.length
            });
        } catch (error) {
            logger.error(`Error getting all cases: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: `Failed to get all cases: ${error.message}`,
            });
        } finally {
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
            if (gateway3) await disconnectFromNetwork(gateway3);
        }
    },

    /**
     * Get cases by lawyer ID - Aggregates from multiple channels
     */
    getCasesByLawyerID: async (req, res) => {
        const { lawyerID } = req.params;
        if (!lawyerID) {
            return res.status(400).json({ error: 'Missing lawyerID parameter' });
        }

        let gateway1 = null;
        let gateway2 = null;
        let gateway3 = null;
        
        try {
            const fabricConfig = config.fabric.lawyer;
            const casesMap = new Map();

            // Channel 1: lawyer-registrar-channel
            try {
                const conn1 = await connectToNetwork(
                    fabricConfig.org, fabricConfig.user, 
                    'lawyer-registrar-channel', 'lawyer'
                );
                gateway1 = conn1.gateway;
                const result = await conn1.contract.evaluateTransaction('GetCasesByLawyerID', lawyerID);
                const cases = JSON.parse(result.toString());
                cases.forEach(c => casesMap.set(c.id || c.ID, c));
                logger.info(`[getCasesByLawyerID Ch1] Found ${cases.length} cases`);
            } catch (err) {
                logger.debug(`[getCasesByLawyerID Ch1] ${err.message}`);
            } finally {
                if (gateway1) await disconnectFromNetwork(gateway1);
                gateway1 = null;
            }

            // Channel 2: stampreporter-lawyer-channel
            try {
                const conn2 = await connectToNetwork(
                    fabricConfig.org, fabricConfig.user, 
                    'stampreporter-lawyer-channel', 'lawyer'
                );
                gateway2 = conn2.gateway;
                const result = await conn2.contract.evaluateTransaction('GetCasesByLawyerID', lawyerID);
                const cases = JSON.parse(result.toString());
                cases.forEach(c => {
                    const caseId = c.id || c.ID;
                    const existing = casesMap.get(caseId);
                    if (!existing || 
                        (c.lastModified && new Date(c.lastModified) > new Date(existing.lastModified || 0))) {
                        if (existing && existing.history) {
                            const mergedHistory = [...(existing.history || [])];
                            (c.history || []).forEach(item => {
                                if (!mergedHistory.some(h => h.status === item.status && h.timestamp === item.timestamp)) {
                                    mergedHistory.push(item);
                                }
                            });
                            mergedHistory.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                            c.history = mergedHistory;
                        }
                        casesMap.set(caseId, c);
                    }
                });
                logger.info(`[getCasesByLawyerID Ch2] Merged from stampreporter-lawyer-channel`);
            } catch (err) {
                logger.debug(`[getCasesByLawyerID Ch2] ${err.message}`);
            } finally {
                if (gateway2) await disconnectFromNetwork(gateway2);
                gateway2 = null;
            }

            // Channel 3: benchclerk-lawyer-channel
            try {
                const conn3 = await connectToNetwork(
                    fabricConfig.org, fabricConfig.user, 
                    'benchclerk-lawyer-channel', 'lawyer'
                );
                gateway3 = conn3.gateway;
                const result = await conn3.contract.evaluateTransaction('GetCasesByLawyerID', lawyerID);
                const cases = JSON.parse(result.toString());
                cases.forEach(c => {
                    const caseId = c.id || c.ID;
                    const existing = casesMap.get(caseId);
                    if (!existing || 
                        (c.lastModified && new Date(c.lastModified) > new Date(existing.lastModified || 0))) {
                        if (existing && existing.history) {
                            const mergedHistory = [...(existing.history || [])];
                            (c.history || []).forEach(item => {
                                if (!mergedHistory.some(h => h.status === item.status && h.timestamp === item.timestamp)) {
                                    mergedHistory.push(item);
                                }
                            });
                            mergedHistory.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                            c.history = mergedHistory;
                        }
                        casesMap.set(caseId, c);
                    }
                });
                logger.info(`[getCasesByLawyerID Ch3] Merged from benchclerk-lawyer-channel`);
            } catch (err) {
                logger.debug(`[getCasesByLawyerID Ch3] ${err.message}`);
            } finally {
                if (gateway3) await disconnectFromNetwork(gateway3);
                gateway3 = null;
            }

            const cases = Array.from(casesMap.values());
            logger.info(`Retrieved ${cases.length} aggregated cases for lawyer ${lawyerID}`);
            
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
            if (gateway1) await disconnectFromNetwork(gateway1);
            if (gateway2) await disconnectFromNetwork(gateway2);
            if (gateway3) await disconnectFromNetwork(gateway3);
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
