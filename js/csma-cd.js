/* =========================================================
   CSMA/CD & CSMA/CA COLLISION SIMULATOR
   CSMA/CD Protocol Module
   ========================================================= */

import { NetworkNode } from "./node.js";


/**
 * CSMA/CD Protocol
 *
 * CSMA/CD stands for:
 *
 * Carrier Sense Multiple Access
 * with Collision Detection
 *
 * Main process:
 *
 * 1. Sense the channel
 * 2. If channel is idle, transmit
 * 3. Monitor the transmission
 * 4. Detect collision
 * 5. Stop transmission if collision occurs
 * 6. Generate binary exponential backoff
 * 7. Wait for the backoff period
 * 8. Sense the channel again
 * 9. Retransmit
 */
export class CSMACD {

    constructor(channel) {

        /* =====================================================
           CHANNEL
        ====================================================== */

        this.channel = channel;


        /* =====================================================
           PROTOCOL CONFIGURATION
        ====================================================== */

        this.slotDuration = 100;

        this.transmissionDuration = 800;

        this.maximumAttempts = 16;

        this.maximumBackoffStage = 10;


        /* =====================================================
           SIMULATION INFORMATION
        ====================================================== */

        this.enabled = true;

        this.totalAttempts = 0;

        this.totalCollisions = 0;

        this.totalSuccessfulTransmissions = 0;

        this.totalRetransmissions = 0;


        /* =====================================================
           TIMING
        ====================================================== */

        this.currentTime = 0;


        /* =====================================================
           EVENT CALLBACKS
        ====================================================== */

        this.onEvent = null;

        this.onCollision = null;

        this.onSuccess = null;

        this.onBackoff = null;

        this.onTransmissionStart = null;

        this.onTransmissionEnd = null;
    }


    /* =========================================================
       INITIALIZATION
       ========================================================= */

    /**
     * Initialize the CSMA/CD protocol.
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
     * Sense whether the channel is idle.
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
            `${node.name} is sensing the channel.`,
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
                `${node.name} sensed a BUSY channel and must wait.`,
                "warning",
                currentTime
            );
        }


        return channelIdle;
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
         * Check maximum attempts.
         */
        if (
            node.transmissionAttempts >=
            this.maximumAttempts
        ) {

            this.logEvent(
                `${node.name} reached the maximum transmission attempts.`,
                "error",
                currentTime
            );


            node.setState(
                "IDLE",
                currentTime
            );


            return {
                success: false,
                reason: "Maximum attempts reached"
            };
        }


        /*
         * Carrier sensing.
         */
        const channelIdle =
            this.performCarrierSense(
                node,
                currentTime
            );


        /*
         * If channel is busy, do not transmit.
         */
        if (!channelIdle) {

            return {
                success: false,
                reason: "Channel busy"
            };
        }


        /*
         * Start transmission.
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


        this.logEvent(
            `${node.name} started transmitting.`,
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
         * A collision may have occurred if another
         * node started transmitting at the same time.
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
       COLLISION DETECTION
       ========================================================= */

    /**
     * Handle a detected collision.
     *
     * @param {NetworkNode} node
     * @param {number} currentTime
     */
    handleCollision(
        node,
        currentTime = 0
    ) {

        this.totalCollisions += 1;


        this.logEvent(
            `⚠ COLLISION DETECTED involving ${node.name}.`,
            "collision",
            currentTime
        );


        /*
         * Stop the transmitting node.
         */
        node.setState(
            "COLLISION",
            currentTime
        );


        /*
         * Calculate binary exponential backoff.
         */
        const backoff =
            this.generateBackoff(node);


        this.totalRetransmissions += 1;


        this.logEvent(
            `${node.name} stopped transmission and selected backoff = ${backoff} slots.`,
            "warning",
            currentTime
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


        if (
            typeof this.onBackoff ===
            "function"
        ) {

            this.onBackoff(
                node,
                backoff,
                currentTime
            );
        }
    }


    /**
     * Detect whether a collision is currently occurring.
     *
     * @returns {boolean}
     */
    detectCollision() {

        if (!this.channel) {

            return false;
        }

        return this.channel.isCollision();
    }


    /* =========================================================
       BINARY EXPONENTIAL BACKOFF
       ========================================================= */

    /**
     * Generate a binary exponential backoff.
     *
     * Formula:
     *
     * K = random integer from:
     *
     * 0 to (2^c - 1)
     *
     * where c is the collision/backoff stage.
     *
     * @param {NetworkNode} node
     * @returns {number}
     */
    generateBackoff(node) {

        if (!node) {

            return 0;
        }


        /*
         * Increase the backoff stage.
         */
        node.backoffStage =
            Math.min(
                node.backoffStage + 1,
                this.maximumBackoffStage
            );


        /*
         * Calculate contention window.
         *
         * For example:
         *
         * Stage 1 → 0 to 1
         * Stage 2 → 0 to 3
         * Stage 3 → 0 to 7
         * Stage 4 → 0 to 15
         */
        const stage =
            node.backoffStage;


        const maxSlots =
            Math.pow(
                2,
                stage
            ) - 1;


        /*
         * Select random backoff slot.
         */
        const backoff =
            Math.floor(
                Math.random() *
                (maxSlots + 1)
            );


        node.backoffCounter =
            backoff;


        node.backoffWindow =
            Math.pow(
                2,
                stage
            );


        node.setState(
            "BACKOFF",
            this.currentTime
        );


        return backoff;
    }


    /**
     * Decrease the node's backoff timer.
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


        if (
            node.backoffCounter > 0
        ) {

            node.backoffCounter -= 1;
        }


        /*
         * If backoff reaches zero,
         * the node can attempt transmission.
         */
        if (
            node.backoffCounter <= 0
        ) {

            node.backoffCounter = 0;


            node.setState(
                "SENSING",
                currentTime
            );


            this.logEvent(
                `${node.name} backoff completed. Sensing channel again.`,
                "info",
                currentTime
            );
        }


        return node.backoffCounter;
    }


    /**
     * Check whether backoff is complete.
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
       TRANSMISSION COMPLETION
       ========================================================= */

    /**
     * Complete a successful transmission.
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
         * Do not mark a collision as successful.
         */
        if (
            this.channel.isCollision()
        ) {

            return {
                success: false,
                collision: true
            };
        }


        const result =
            this.channel.endTransmission(
                node,
                currentTime
            );


        if (!result.success) {

            return result;
        }


        this.totalSuccessfulTransmissions += 1;


        this.logEvent(
            `✓ ${node.name} successfully transmitted the packet.`,
            "success",
            currentTime
        );


        if (
            typeof this.onSuccess ===
            "function"
        ) {

            this.onSuccess(
                node,
                result.delay,
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
            delay: result.delay
        };
    }


    /* =========================================================
       NODE PROCESSING
       ========================================================= */

    /**
     * Process a node during a simulation step.
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

                /*
                 * A node without a packet has nothing
                 * to transmit.
                 */
                if (
                    !node.hasDataToSend()
                ) {

                    return {
                        action: "idle"
                    };
                }


                /*
                 * Try carrier sensing.
                 */
                const channelIdle =
                    this.performCarrierSense(
                        node,
                        currentTime
                    );


                if (channelIdle) {

                    return {
                        action: "ready"
                    };
                }


                return {
                    action: "waiting"
                };
            }


            /* ===============================================
               SENSING
            =============================================== */

            case "SENSING": {

                const idle =
                    this.senseChannel();


                if (idle) {

                    return {
                        action: "transmit"
                    };
                }


                node.setState(
                    "WAITING",
                    currentTime
                );


                return {
                    action: "wait"
                };
            }


            /* ===============================================
               WAITING
            =============================================== */

            case "WAITING": {

                /*
                 * Keep waiting while the channel is busy.
                 */
                if (
                    !this.senseChannel()
                ) {

                    return {
                        action: "wait"
                    };
                }


                /*
                 * Channel became idle.
                 */
                node.setState(
                    "SENSING",
                    currentTime
                );


                return {
                    action: "sense"
                };
            }


            /* ===============================================
               TRANSMITTING
            =============================================== */

            case "TRANSMITTING": {

                /*
                 * Check for collision.
                 */
                if (
                    this.detectCollision()
                ) {

                    this.handleCollision(
                        node,
                        currentTime
                    );


                    return {
                        action: "collision"
                    };
                }


                /*
                 * Determine whether transmission
                 * duration has elapsed.
                 */
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

                /*
                 * A collision node needs to back off.
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
               BACKOFF
            =============================================== */

            case "BACKOFF": {

                /*
                 * Backoff counter reaches zero.
                 */
                if (
                    node.backoffCounter <= 0
                ) {

                    node.setState(
                        "SENSING",
                        currentTime
                    );


                    return {
                        action: "sense"
                    };
                }


                return {
                    action: "backoff"
                };
            }


            /* ===============================================
               SUCCESS
            =============================================== */

            case "SUCCESS": {

                /*
                 * Return the node to idle after
                 * successful transmission.
                 */
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
       PROTOCOL PARAMETERS
       ========================================================= */

    /**
     * Set the transmission duration.
     *
     * @param {number} duration
     */
    setTransmissionDuration(duration) {

        if (
            Number.isFinite(duration) &&
            duration > 0
        ) {

            this.transmissionDuration =
                duration;
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
     * @param {number} duration
     */
    setSlotDuration(duration) {

        if (
            Number.isFinite(duration) &&
            duration > 0
        ) {

            this.slotDuration =
                duration;
        }


        if (this.channel) {

            this.channel.setSlotDuration(
                this.slotDuration
            );
        }
    }


    /**
     * Set maximum transmission attempts.
     *
     * @param {number} attempts
     */
    setMaximumAttempts(attempts) {

        if (
            Number.isFinite(attempts) &&
            attempts > 0
        ) {

            this.maximumAttempts =
                Math.floor(attempts);
        }
    }


    /* =========================================================
       STATISTICS
       ========================================================= */

    /**
     * Get CSMA/CD statistics.
     *
     * @returns {Object}
     */
    getStatistics() {

        return {

            totalAttempts:
                this.totalAttempts,

            totalCollisions:
                this.totalCollisions,

            successfulTransmissions:
                this.totalSuccessfulTransmissions,

            retransmissions:
                this.totalRetransmissions
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
     * Reset protocol statistics and timing.
     */
    reset() {

        this.totalAttempts = 0;

        this.totalCollisions = 0;

        this.totalSuccessfulTransmissions = 0;

        this.totalRetransmissions = 0;

        this.currentTime = 0;
    }


    /* =========================================================
       ENABLE / DISABLE
       ========================================================= */

    /**
     * Enable CSMA/CD.
     */
    enable() {

        this.enabled = true;
    }


    /**
     * Disable CSMA/CD.
     */
    disable() {

        this.enabled = false;
    }


    /**
     * Check whether CSMA/CD is enabled.
     *
     * @returns {boolean}
     */
    isEnabled() {

        return this.enabled;
    }


    /* =========================================================
       DEBUG INFORMATION
       ========================================================= */

    /**
     * Return protocol configuration and statistics.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            protocol: "CSMA/CD",

            enabled:
                this.enabled,

            slotDuration:
                this.slotDuration,

            transmissionDuration:
                this.transmissionDuration,

            maximumAttempts:
                this.maximumAttempts,

            maximumBackoffStage:
                this.maximumBackoffStage,

            totalAttempts:
                this.totalAttempts,

            totalCollisions:
                this.totalCollisions,

            totalSuccessfulTransmissions:
                this.totalSuccessfulTransmissions,

            totalRetransmissions:
                this.totalRetransmissions
        };
    }
}