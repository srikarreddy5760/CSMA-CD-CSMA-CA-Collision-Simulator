/* =========================================================
   CSMA/CD & CSMA/CA COLLISION SIMULATOR
   CSMA/CA Protocol Module
   ========================================================= */

import { NetworkNode } from "./node.js";


/**
 * CSMA/CA Protocol
 *
 * CSMA/CA stands for:
 *
 * Carrier Sense Multiple Access
 * with Collision Avoidance
 *
 * Main process:
 *
 * 1. Sense the wireless channel
 * 2. If the channel is busy, wait
 * 3. If the channel is idle, choose a random backoff
 * 4. Count down the backoff while the channel remains idle
 * 5. Transmit when the backoff reaches zero
 * 6. Wait for an ACK
 * 7. If ACK is received, transmission succeeds
 * 8. If ACK is not received, increase contention window
 * 9. Retry using another backoff period
 *
 * Optional RTS/CTS support is also included in this module.
 */
export class CSMACA {

    constructor(channel) {

        /* =====================================================
           CHANNEL
        ====================================================== */

        this.channel = channel;


        /* =====================================================
           PROTOCOL CONFIGURATION
        ====================================================== */

        this.slotDuration = 100;

        this.sifsDuration = 50;

        this.difsDuration = 100;

        this.ackDuration = 100;

        this.transmissionDuration = 800;


        /* =====================================================
           CONTENTION WINDOW
        ====================================================== */

        this.cwMin = 4;

        this.cwMax = 1024;


        /* =====================================================
           RETRY CONFIGURATION
        ====================================================== */

        this.maximumRetries = 7;


        /* =====================================================
           OPTIONAL RTS/CTS
        ====================================================== */

        this.rtsCtsEnabled = false;

        this.rtsDuration = 100;

        this.ctsDuration = 100;


        /* =====================================================
           PROTOCOL STATE
        ====================================================== */

        this.enabled = true;

        this.currentTime = 0;


        /* =====================================================
           STATISTICS
        ====================================================== */

        this.totalAttempts = 0;

        this.totalSuccessfulTransmissions = 0;

        this.totalFailedTransmissions = 0;

        this.totalCollisions = 0;

        this.totalRetransmissions = 0;

        this.totalBackoffSlots = 0;

        this.totalAckReceived = 0;

        this.totalAckTimeouts = 0;


        /* =====================================================
           EVENT CALLBACKS
        ====================================================== */

        this.onEvent = null;

        this.onCollision = null;

        this.onSuccess = null;

        this.onBackoff = null;

        this.onTransmissionStart = null;

        this.onTransmissionEnd = null;

        this.onAck = null;

        this.onAckTimeout = null;

        this.onRts = null;

        this.onCts = null;
    }


    /* =========================================================
       INITIALIZATION
       ========================================================= */

    /**
     * Initialize the CSMA/CA protocol.
     *
     * @param {NetworkChannel} channel
     */
    initialize(channel = null) {

        if (channel) {

            this.channel = channel;
        }

        this.reset();
    }


    /* =========================================================
       CARRIER SENSING
       ========================================================= */

    /**
     * Sense the wireless channel.
     *
     * @returns {boolean}
     */
    senseChannel() {

        if (!this.channel) {

            return false;
        }

        return this.channel.senseChannel();
    }


    /**
     * Perform carrier sensing for a node.
     *
     * @param {NetworkNode} node
     * @param {number} currentTime
     * @returns {boolean}
     */
    performCarrierSense(
        node,
        currentTime = 0
    ) {

        if (!node) {

            return false;
        }


        this.currentTime = currentTime;


        node.setState(
            "SENSING",
            currentTime
        );


        this.logEvent(
            `${node.name} is sensing the wireless channel.`,
            "info",
            currentTime
        );


        const channelIdle =
            this.senseChannel();


        if (channelIdle) {

            this.logEvent(
                `${node.name} sensed an IDLE channel.`,
                "success",
                currentTime
            );

        } else {

            node.setState(
                "WAITING",
                currentTime
            );


            this.logEvent(
                `${node.name} sensed a BUSY channel and will wait.`,
                "warning",
                currentTime
            );
        }


        return channelIdle;
    }


    /* =========================================================
       BACKOFF
       ========================================================= */

    /**
     * Generate a random CSMA/CA backoff value.
     *
     * Formula:
     *
     * Backoff = Random integer
     * from 0 to CW - 1
     *
     * @param {NetworkNode} node
     * @returns {number}
     */
    generateBackoff(node) {

        if (!node) {

            return 0;
        }


        /*
         * Use the node's current contention window.
         */
        const contentionWindow =
            Math.max(
                1,
                Math.min(
                    node.currentCW || this.cwMin,
                    this.cwMax
                )
            );


        const backoff =
            Math.floor(
                Math.random() *
                contentionWindow
            );


        node.backoffCounter =
            backoff;


        node.setState(
            "BACKOFF",
            this.currentTime
        );


        this.totalBackoffSlots += backoff;


        this.logEvent(
            `${node.name} selected random backoff = ${backoff} slots.`,
            "info",
            this.currentTime
        );


        if (
            typeof this.onBackoff ===
            "function"
        ) {

            this.onBackoff(
                node,
                backoff,
                this.currentTime
            );
        }


        return backoff;
    }


    /**
     * Decrease the backoff counter by one slot.
     *
     * The counter decreases only while the channel
     * is idle.
     *
     * @param {NetworkNode} node
     * @param {number} currentTime
     * @returns {number}
     */
    decreaseBackoff(
        node,
        currentTime = 0
    ) {

        if (!node) {

            return 0;
        }


        this.currentTime = currentTime;


        /*
         * If the channel becomes busy during backoff,
         * freeze the counter.
         */
        if (!this.senseChannel()) {

            this.logEvent(
                `${node.name} backoff frozen because the channel became BUSY.`,
                "warning",
                currentTime
            );


            return node.backoffCounter;
        }


        if (
            node.backoffCounter > 0
        ) {

            node.backoffCounter -= 1;
        }


        if (
            node.backoffCounter <= 0
        ) {

            node.backoffCounter = 0;


            node.setState(
                "SENSING",
                currentTime
            );


            this.logEvent(
                `${node.name} backoff completed.`,
                "success",
                currentTime
            );
        }


        return node.backoffCounter;
    }


    /**
     * Check whether a node's backoff has completed.
     *
     * @param {NetworkNode} node
     * @returns {boolean}
     */
    isBackoffComplete(node) {

        if (!node) {

            return false;
        }


        return (
            node.backoffCounter <= 0
        );
    }


    /* =========================================================
       TRANSMISSION
       ========================================================= */

    /**
     * Attempt to transmit a packet.
     *
     * @param {NetworkNode} node
     * @param {number} currentTime
     * @returns {Object}
     */
    attemptTransmission(
        node,
        currentTime = 0
    ) {

        if (!node) {

            return {
                success: false,
                reason: "Invalid node"
            };
        }


        this.currentTime = currentTime;


        /*
         * Check retry limit.
         */
        if (
            node.retransmissions >=
            this.maximumRetries
        ) {

            this.logEvent(
                `${node.name} reached the maximum retry limit.`,
                "error",
                currentTime
            );


            node.setState(
                "IDLE",
                currentTime
            );


            return {
                success: false,
                reason: "Maximum retries reached"
            };
        }


        /*
         * Sense the channel.
         */
        const channelIdle =
            this.performCarrierSense(
                node,
                currentTime
            );


        if (!channelIdle) {

            return {
                success: false,
                reason: "Channel busy"
            };
        }


        /*
         * If RTS/CTS is enabled,
         * perform the RTS/CTS exchange.
         */
        if (this.rtsCtsEnabled) {

            const exchange =
                this.performRtsCts(
                    node,
                    currentTime
                );


            if (!exchange.success) {

                return exchange;
            }
        }


        /*
         * Start the actual transmission.
         */
        this.totalAttempts += 1;


        const result =
            this.channel.startTransmission(
                node,
                currentTime
            );


        if (!result.success) {

            return result;
        }


        node.ackReceived = false;


        this.logEvent(
            `${node.name} started wireless transmission.`,
            "info",
            currentTime
        );


        if (
            typeof this.onTransmissionStart ===
            "function"
        ) {

            this.onTransmissionStart(
                node,
                currentTime
            );
        }


        /*
         * In a simulation, multiple simultaneous
         * transmissions can still result in a
         * modeled collision.
         */
        if (result.collision) {

            this.handleCollision(
                node,
                currentTime
            );


            return {
                success: false,
                collision: true
            };
        }


        return {
            success: true,
            collision: false
        };
    }


    /* =========================================================
       COLLISION HANDLING
       ========================================================= */

    /**
     * Handle a collision in the simulated wireless channel.
     *
     * CSMA/CA primarily tries to avoid collisions rather
     * than detect them during transmission. In the simulator,
     * a missing ACK can therefore indicate a collision.
     *
     * @param {NetworkNode} node
     * @param {number} currentTime
     */
    handleCollision(
        node,
        currentTime = 0
    ) {

        if (!node) {

            return;
        }


        this.totalCollisions += 1;

        this.totalRetransmissions += 1;


        node.collisionCount += 1;

        node.retransmissions += 1;


        node.setState(
            "COLLISION",
            currentTime
        );


        this.logEvent(
            `⚠ Possible collision detected for ${node.name}. Waiting for ACK.`,
            "collision",
            currentTime
        );


        /*
         * Increase contention window after failure.
         */
        this.increaseContentionWindow(
            node
        );


        /*
         * Generate a new random backoff.
         */
        const backoff =
            this.generateBackoff(
                node
            );


        if (
            typeof this.onCollision ===
            "function"
        ) {

            this.onCollision(
                node,
                backoff,
                currentTime
            );
        }
    }


    /**
     * Increase the node's contention window.
     *
     * @param {NetworkNode} node
     */
    increaseContentionWindow(node) {

        if (!node) {

            return;
        }


        const current =
            node.currentCW ||
            this.cwMin;


        const next =
            Math.min(
                current * 2,
                this.cwMax
            );


        node.currentCW = next;


        this.logEvent(
            `${node.name} contention window increased to ${next}.`,
            "warning",
            this.currentTime
        );
    }


    /**
     * Reset a node's contention window after
     * successful transmission.
     *
     * @param {NetworkNode} node
     */
    resetContentionWindow(node) {

        if (!node) {

            return;
        }


        node.currentCW =
            this.cwMin;
    }


    /* =========================================================
       ACKNOWLEDGEMENT
       ========================================================= */

    /**
     * Simulate receiving an acknowledgement.
     *
     * @param {NetworkNode} node
     * @param {number} currentTime
     */
    receiveAck(
        node,
        currentTime = 0
    ) {

        if (!node) {

            return;
        }


        node.receiveAck();


        this.totalAckReceived += 1;


        this.logEvent(
            `✓ ACK received by ${node.name}.`,
            "success",
            currentTime
        );


        if (
            typeof this.onAck ===
            "function"
        ) {

            this.onAck(
                node,
                currentTime
            );
        }
    }


    /**
     * Handle ACK timeout.
     *
     * @param {NetworkNode} node
     * @param {number} currentTime
     */
    handleAckTimeout(
        node,
        currentTime = 0
    ) {

        if (!node) {

            return;
        }


        this.totalAckTimeouts += 1;


        this.totalFailedTransmissions += 1;


        node.ackReceived = false;


        node.retransmissions += 1;


        this.logEvent(
            `⚠ ACK timeout for ${node.name}. Retransmission required.`,
            "warning",
            currentTime
        );


        this.increaseContentionWindow(
            node
        );


        const backoff =
            this.generateBackoff(
                node
            );


        if (
            typeof this.onAckTimeout ===
            "function"
        ) {

            this.onAckTimeout(
                node,
                backoff,
                currentTime
            );
        }


        return backoff;
    }


    /* =========================================================
       RTS / CTS
       ========================================================= */

    /**
     * Perform a simulated RTS/CTS exchange.
     *
     * @param {NetworkNode} node
     * @param {number} currentTime
     * @returns {Object}
     */
    performRtsCts(
        node,
        currentTime = 0
    ) {

        if (!node) {

            return {
                success: false,
                reason: "Invalid node"
            };
        }


        this.logEvent(
            `${node.name} sent RTS (Request To Send).`,
            "info",
            currentTime
        );


        node.rtsEnabled = true;


        if (
            typeof this.onRts ===
            "function"
        ) {

            this.onRts(
                node,
                currentTime
            );
        }


        /*
         * In this educational simulator,
         * CTS is immediately returned when
         * the channel is available.
         */
        if (
            this.senseChannel()
        ) {

            node.receiveCts();


            this.logEvent(
                `${node.name} received CTS (Clear To Send).`,
                "success",
                currentTime
            );


            if (
                typeof this.onCts ===
                "function"
            ) {

                this.onCts(
                    node,
                    currentTime
                );
            }


            return {
                success: true
            };
        }


        this.logEvent(
            `${node.name} did not receive CTS because the channel is busy.`,
            "warning",
            currentTime
        );


        return {
            success: false,
            reason: "Channel busy"
        };
    }


    /* =========================================================
       TRANSMISSION COMPLETION
       ========================================================= */

    /**
     * Complete a transmission and wait for ACK.
     *
     * @param {NetworkNode} node
     * @param {number} currentTime
     * @returns {Object}
     */
    completeTransmission(
        node,
        currentTime = 0
    ) {

        if (!node) {

            return {
                success: false,
                reason: "Invalid node"
            };
        }


        /*
         * If a collision exists, the packet
         * cannot be completed successfully.
         */
        if (
            this.channel.isCollision()
        ) {

            this.handleCollision(
                node,
                currentTime
            );


            return {
                success: false,
                collision: true
            };
        }


        /*
         * End the transmission at the channel.
         */
        const result =
            this.channel.endTransmission(
                node,
                currentTime
            );


        if (!result.success) {

            return result;
        }


        /*
         * Simulate ACK reception.
         */
        this.receiveAck(
            node,
            currentTime
        );


        /*
         * Complete the node's packet.
         */
        const delay =
            node.completeTransmission(
                currentTime +
                this.ackDuration
            );


        this.totalSuccessfulTransmissions += 1;


        this.resetContentionWindow(
            node
        );


        this.logEvent(
            `✓ ${node.name} successfully transmitted and received ACK.`,
            "success",
            currentTime
        );


        if (
            typeof this.onSuccess ===
            "function"
        ) {

            this.onSuccess(
                node,
                delay,
                currentTime
            );
        }


        if (
            typeof this.onTransmissionEnd ===
            "function"
        ) {

            this.onTransmissionEnd(
                node,
                currentTime
            );
        }


        return {
            success: true,
            delay
        };
    }


    /* =========================================================
       NODE PROCESSING
       ========================================================= */

    /**
     * Process a node during one simulation step.
     *
     * @param {NetworkNode} node
     * @param {number} currentTime
     * @returns {Object}
     */
    processNode(
        node,
        currentTime = 0
    ) {

        if (!node) {

            return {
                action: "none"
            };
        }


        this.currentTime = currentTime;


        switch (node.getState()) {


            /* ===============================================
               IDLE
            =============================================== */

            case "IDLE": {

                if (
                    !node.hasDataToSend()
                ) {

                    return {
                        action: "idle"
                    };
                }


                const channelIdle =
                    this.performCarrierSense(
                        node,
                        currentTime
                    );


                if (!channelIdle) {

                    return {
                        action: "wait"
                    };
                }


                /*
                 * Start a random backoff before
                 * transmission.
                 */
                this.generateBackoff(
                    node
                );


                return {
                    action: "backoff"
                };
            }


            /* ===============================================
               SENSING
            =============================================== */

            case "SENSING": {

                if (
                    !this.senseChannel()
                ) {

                    node.setState(
                        "WAITING",
                        currentTime
                    );


                    return {
                        action: "wait"
                    };
                }


                /*
                 * Channel is idle.
                 * Start backoff.
                 */
                if (
                    node.backoffCounter <= 0
                ) {

                    this.generateBackoff(
                        node
                    );
                }


                return {
                    action: "backoff"
                };
            }


            /* ===============================================
               WAITING
            =============================================== */

            case "WAITING": {

                if (
                    !this.senseChannel()
                ) {

                    return {
                        action: "wait"
                    };
                }


                node.setState(
                    "SENSING",
                    currentTime
                );


                return {
                    action: "sense"
                };
            }


            /* ===============================================
               BACKOFF
            =============================================== */

            case "BACKOFF": {

                /*
                 * If channel becomes busy,
                 * freeze the counter.
                 */
                if (
                    !this.senseChannel()
                ) {

                    return {
                        action: "freeze-backoff"
                    };
                }


                /*
                 * Backoff completed.
                 */
                if (
                    node.backoffCounter <= 0
                ) {

                    node.setState(
                        "SENSING",
                        currentTime
                    );


                    return {
                        action: "transmit"
                    };
                }


                return {
                    action: "countdown"
                };
            }


            /* ===============================================
               TRANSMITTING
            =============================================== */

            case "TRANSMITTING": {

                /*
                 * CSMA/CA does not detect collisions
                 * in the same way as CSMA/CD.
                 *
                 * A collision is modeled through
                 * channel state / missing ACK.
                 */
                if (
                    this.channel.isCollision()
                ) {

                    this.handleCollision(
                        node,
                        currentTime
                    );


                    return {
                        action: "collision"
                    };
                }


                const elapsed =
                    currentTime -
                    node.transmissionStartTime;


                if (
                    elapsed >=
                    this.transmissionDuration
                ) {

                    return {
                        action: "complete"
                    };
                }


                return {
                    action: "transmitting"
                };
            }


            /* ===============================================
               COLLISION
            =============================================== */

            case "COLLISION": {

                if (
                    node.backoffCounter <= 0
                ) {

                    this.generateBackoff(
                        node
                    );
                }


                return {
                    action: "backoff"
                };
            }


            /* ===============================================
               SUCCESS
            =============================================== */

            case "SUCCESS": {

                node.setState(
                    "IDLE",
                    currentTime
                );


                return {
                    action: "idle"
                };
            }


            /* ===============================================
               DEFAULT
            =============================================== */

            default: {

                node.setState(
                    "IDLE",
                    currentTime
                );


                return {
                    action: "idle"
                };
            }
        }
    }


    /* =========================================================
       CONFIGURATION
       ========================================================= */

    /**
     * Enable RTS/CTS.
     *
     * @param {boolean} enabled
     */
    setRtsCtsEnabled(enabled) {

        this.rtsCtsEnabled =
            Boolean(enabled);
    }


    /**
     * Set minimum contention window.
     *
     * @param {number} value
     */
    setCwMin(value) {

        if (
            Number.isFinite(value) &&
            value >= 1
        ) {

            this.cwMin =
                Math.floor(value);
        }
    }


    /**
     * Set maximum contention window.
     *
     * @param {number} value
     */
    setCwMax(value) {

        if (
            Number.isFinite(value) &&
            value >= this.cwMin
        ) {

            this.cwMax =
                Math.floor(value);
        }
    }


    /**
     * Set maximum retries.
     *
     * @param {number} value
     */
    setMaximumRetries(value) {

        if (
            Number.isFinite(value) &&
            value >= 1
        ) {

            this.maximumRetries =
                Math.floor(value);
        }
    }


    /**
     * Set transmission duration.
     *
     * @param {number} value
     */
    setTransmissionDuration(value) {

        if (
            Number.isFinite(value) &&
            value > 0
        ) {

            this.transmissionDuration =
                value;
        }


        if (this.channel) {

            this.channel.setTransmissionDuration(
                this.transmissionDuration
            );
        }
    }


    /**
     * Set slot duration.
     *
     * @param {number} value
     */
    setSlotDuration(value) {

        if (
            Number.isFinite(value) &&
            value > 0
        ) {

            this.slotDuration =
                value;
        }


        if (this.channel) {

            this.channel.setSlotDuration(
                this.slotDuration
            );
        }
    }


    /* =========================================================
       STATISTICS
       ========================================================= */

    /**
     * Get CSMA/CA statistics.
     *
     * @returns {Object}
     */
    getStatistics() {

        return {

            totalAttempts:
                this.totalAttempts,

            totalSuccessfulTransmissions:
                this.totalSuccessfulTransmissions,

            totalFailedTransmissions:
                this.totalFailedTransmissions,

            totalCollisions:
                this.totalCollisions,

            totalRetransmissions:
                this.totalRetransmissions,

            totalBackoffSlots:
                this.totalBackoffSlots,

            totalAckReceived:
                this.totalAckReceived,

            totalAckTimeouts:
                this.totalAckTimeouts
        };
    }


    /* =========================================================
       EVENT LOGGING
       ========================================================= */

    /**
     * Send an event to the simulation.
     *
     * @param {string} message
     * @param {string} type
     * @param {number} time
     */
    logEvent(
        message,
        type = "info",
        time = 0
    ) {

        if (
            typeof this.onEvent ===
            "function"
        ) {

            this.onEvent({

                message,

                type,

                time
            });
        }
    }


    /* =========================================================
       RESET
       ========================================================= */

    /**
     * Reset CSMA/CA statistics.
     */
    reset() {

        this.totalAttempts = 0;

        this.totalSuccessfulTransmissions = 0;

        this.totalFailedTransmissions = 0;

        this.totalCollisions = 0;

        this.totalRetransmissions = 0;

        this.totalBackoffSlots = 0;

        this.totalAckReceived = 0;

        this.totalAckTimeouts = 0;

        this.currentTime = 0;
    }


    /* =========================================================
       ENABLE / DISABLE
       ========================================================= */

    /**
     * Enable CSMA/CA.
     */
    enable() {

        this.enabled = true;
    }


    /**
     * Disable CSMA/CA.
     */
    disable() {

        this.enabled = false;
    }


    /**
     * Check whether CSMA/CA is enabled.
     *
     * @returns {boolean}
     */
    isEnabled() {

        return this.enabled;
    }


    /* =========================================================
       DEBUG / SERIALIZATION
       ========================================================= */

    /**
     * Return protocol information.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            protocol: "CSMA/CA",

            enabled:
                this.enabled,

            slotDuration:
                this.slotDuration,

            sifsDuration:
                this.sifsDuration,

            difsDuration:
                this.difsDuration,

            ackDuration:
                this.ackDuration,

            transmissionDuration:
                this.transmissionDuration,

            cwMin:
                this.cwMin,

            cwMax:
                this.cwMax,

            maximumRetries:
                this.maximumRetries,

            rtsCtsEnabled:
                this.rtsCtsEnabled,

            totalAttempts:
                this.totalAttempts,

            totalSuccessfulTransmissions:
                this.totalSuccessfulTransmissions,

            totalFailedTransmissions:
                this.totalFailedTransmissions,

            totalCollisions:
                this.totalCollisions,

            totalRetransmissions:
                this.totalRetransmissions,

            totalBackoffSlots:
                this.totalBackoffSlots,

            totalAckReceived:
                this.totalAckReceived,

            totalAckTimeouts:
                this.totalAckTimeouts
        };
    }
}