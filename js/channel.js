/* =========================================================
   CSMA/CD & CSMA/CA COLLISION SIMULATOR
   Shared Network Channel Module
   ========================================================= */


/**
 * Represents the shared communication channel.
 *
 * The channel is responsible for:
 * - Detecting whether it is idle or busy
 * - Tracking transmitting nodes
 * - Detecting collisions
 * - Tracking successful transmissions
 * - Providing channel utilization information
 */
export class NetworkChannel {

    constructor() {

        /* =====================================================
           CHANNEL STATE
        ====================================================== */

        /*
         * Possible states:
         *
         * IDLE
         * BUSY
         * COLLISION
         * SUCCESS
         */

        this.state = "IDLE";


        /* =====================================================
           TRANSMITTING NODES
        ====================================================== */

        this.transmittingNodes = [];

        this.lastTransmittingNodes = [];


        /* =====================================================
           COLLISION INFORMATION
        ====================================================== */

        this.collisionDetected = false;

        this.collisionCount = 0;

        this.lastCollisionTime = 0;

        this.collisionStartTime = 0;


        /* =====================================================
           SUCCESS INFORMATION
        ====================================================== */

        this.successCount = 0;

        this.lastSuccessTime = 0;


        /* =====================================================
           CHANNEL TIMING
        ====================================================== */

        this.busyStartTime = 0;

        this.totalBusyTime = 0;

        this.lastStateChangeTime = 0;


        /* =====================================================
           TRANSMISSION INFORMATION
        ====================================================== */

        this.totalTransmissionAttempts = 0;

        this.totalSuccessfulTransmissions = 0;

        this.totalFailedTransmissions = 0;


        /* =====================================================
           CHANNEL CONFIGURATION
        ====================================================== */

        this.transmissionDuration = 1000;

        this.slotDuration = 100;

        this.propagationDelay = 20;


        /* =====================================================
           EVENT CALLBACKS
        ====================================================== */

        this.onStateChange = null;

        this.onCollision = null;

        this.onSuccess = null;

        this.onTransmissionStart = null;

        this.onTransmissionEnd = null;
    }


    /* =========================================================
       CHANNEL STATE
       ========================================================= */

    /**
     * Get the current channel state.
     *
     * @returns {string}
     */
    getState() {

        return this.state;
    }


    /**
     * Check whether the channel is idle.
     *
     * @returns {boolean}
     */
    isIdle() {

        return this.state === "IDLE";
    }


    /**
     * Check whether the channel is busy.
     *
     * @returns {boolean}
     */
    isBusy() {

        return this.state === "BUSY";
    }


    /**
     * Check whether a collision is occurring.
     *
     * @returns {boolean}
     */
    isCollision() {

        return this.state === "COLLISION";
    }


    /**
     * Change channel state.
     *
     * @param {string} newState
     * @param {number} currentTime
     */
    setState(newState, currentTime = 0) {

        if (this.state === newState) {

            return;
        }

        const previousState = this.state;

        /*
         * If the channel was busy and is now leaving
         * the busy state, calculate the total busy time.
         */
        if (
            (
                previousState === "BUSY" ||
                previousState === "COLLISION"
            ) &&
            (
                newState === "IDLE" ||
                newState === "SUCCESS"
            )
        ) {

            const elapsed =
                Math.max(
                    0,
                    currentTime - this.busyStartTime
                );

            this.totalBusyTime += elapsed;
        }


        this.state = newState;

        this.lastStateChangeTime = currentTime;


        /*
         * Start tracking busy time.
         */
        if (
            newState === "BUSY" ||
            newState === "COLLISION"
        ) {

            this.busyStartTime = currentTime;
        }


        /*
         * Notify the simulation if a callback exists.
         */
        if (
            typeof this.onStateChange === "function"
        ) {

            this.onStateChange(
                newState,
                previousState,
                currentTime
            );
        }
    }


    /* =========================================================
       CARRIER SENSING
       ========================================================= */

    /**
     * Sense the channel.
     *
     * @returns {boolean}
     *
     * true  = channel is idle
     * false = channel is busy
     */
    senseChannel() {

        return this.isIdle();
    }


    /**
     * Return whether a node can begin transmission.
     *
     * @returns {boolean}
     */
    canTransmit() {

        return this.isIdle();
    }


    /* =========================================================
       TRANSMISSION MANAGEMENT
       ========================================================= */

    /**
     * Start transmission by a node.
     *
     * @param {NetworkNode} node
     * @param {number} currentTime
     * @returns {Object}
     */
    startTransmission(node, currentTime = 0) {

        if (!node) {

            return {
                success: false,
                reason: "Invalid node"
            };
        }


        /*
         * Prevent the same node from being added twice.
         */
        if (
            this.transmittingNodes.includes(node)
        ) {

            return {
                success: false,
                reason: "Node is already transmitting"
            };
        }


        this.totalTransmissionAttempts += 1;


        /*
         * Add the node to the active transmitters.
         */
        this.transmittingNodes.push(node);


        /*
         * Update node state.
         */
        node.startTransmission(currentTime);


        /*
         * Determine whether a collision exists.
         */
        if (this.transmittingNodes.length > 1) {

            this.detectCollision(currentTime);

        } else {

            this.setState(
                "BUSY",
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
        }


        return {
            success: true,
            collision:
                this.transmittingNodes.length > 1
        };
    }


    /**
     * End transmission for a node.
     *
     * @param {NetworkNode} node
     * @param {number} currentTime
     * @returns {Object}
     */
    endTransmission(node, currentTime = 0) {

        if (!node) {

            return {
                success: false,
                reason: "Invalid node"
            };
        }


        const index =
            this.transmittingNodes.indexOf(node);


        if (index === -1) {

            return {
                success: false,
                reason: "Node is not transmitting"
            };
        }


        /*
         * If there is currently a collision,
         * the transmission cannot be successful.
         */
        if (this.collisionDetected) {

            this.transmittingNodes.splice(
                index,
                1
            );


            node.registerFailure(
                currentTime
            );


            this.totalFailedTransmissions += 1;


            /*
             * If all colliding nodes have stopped,
             * return the channel to idle.
             */
            if (
                this.transmittingNodes.length === 0
            ) {

                this.collisionDetected = false;

                this.setState(
                    "IDLE",
                    currentTime
                );
            }


            return {
                success: false,
                collision: true
            };
        }


        /*
         * Normal successful transmission.
         */
        this.transmittingNodes.splice(
            index,
            1
        );


        const delay =
            node.completeTransmission(
                currentTime
            );


        this.successCount += 1;

        this.totalSuccessfulTransmissions += 1;

        this.lastSuccessTime = currentTime;


        /*
         * Temporarily show SUCCESS state.
         */
        this.setState(
            "SUCCESS",
            currentTime
        );


        if (
            typeof this.onSuccess === "function"
        ) {

            this.onSuccess(
                node,
                currentTime,
                delay
            );
        }


        if (
            typeof this.onTransmissionEnd ===
            "function"
        ) {

            this.onTransmissionEnd(
                node,
                currentTime,
                true
            );
        }


        /*
         * No more nodes are transmitting.
         */
        if (
            this.transmittingNodes.length === 0
        ) {

            this.setState(
                "IDLE",
                currentTime
            );
        }


        return {
            success: true,
            collision: false,
            delay
        };
    }


    /* =========================================================
       COLLISION DETECTION
       ========================================================= */

    /**
     * Detect a collision.
     *
     * @param {number} currentTime
     * @returns {boolean}
     */
    detectCollision(currentTime = 0) {

        if (
            this.transmittingNodes.length < 2
        ) {

            return false;
        }


        /*
         * Prevent repeated collision counting
         * while the same collision is active.
         */
        if (this.collisionDetected) {

            return true;
        }


        this.collisionDetected = true;

        this.collisionCount += 1;

        this.lastCollisionTime = currentTime;

        this.collisionStartTime = currentTime;


        /*
         * Store the nodes involved in the collision.
         */
        this.lastTransmittingNodes = [
            ...this.transmittingNodes
        ];


        /*
         * Change channel state.
         */
        this.setState(
            "COLLISION",
            currentTime
        );


        /*
         * Inform every transmitting node.
         */
        for (
            const node of this.transmittingNodes
        ) {

            node.registerFailure(
                currentTime
            );
        }


        /*
         * Notify simulation.
         */
        if (
            typeof this.onCollision === "function"
        ) {

            this.onCollision(
                [
                    ...this.transmittingNodes
                ],
                currentTime
            );
        }


        return true;
    }


    /**
     * Return nodes currently involved in a collision.
     *
     * @returns {Array}
     */
    getCollisionNodes() {

        if (this.collisionDetected) {

            return [
                ...this.transmittingNodes
            ];
        }

        return [];
    }


    /**
     * Clear the current collision.
     *
     * @param {number} currentTime
     */
    clearCollision(currentTime = 0) {

        this.collisionDetected = false;

        this.lastTransmittingNodes = [];

        this.setState(
            "IDLE",
            currentTime
        );
    }


    /* =========================================================
       CHANNEL INFORMATION
       ========================================================= */

    /**
     * Get currently transmitting nodes.
     *
     * @returns {Array}
     */
    getTransmittingNodes() {

        return [
            ...this.transmittingNodes
        ];
    }


    /**
     * Get number of transmitting nodes.
     *
     * @returns {number}
     */
    getTransmittingNodeCount() {

        return this.transmittingNodes.length;
    }


    /**
     * Check whether a specific node is transmitting.
     *
     * @param {NetworkNode} node
     * @returns {boolean}
     */
    isNodeTransmitting(node) {

        return this.transmittingNodes.includes(
            node
        );
    }


    /* =========================================================
       STATISTICS
       ========================================================= */

    /**
     * Get total collision count.
     *
     * @returns {number}
     */
    getCollisionCount() {

        return this.collisionCount;
    }


    /**
     * Get successful transmission count.
     *
     * @returns {number}
     */
    getSuccessCount() {

        return this.successCount;
    }


    /**
     * Get failed transmission count.
     *
     * @returns {number}
     */
    getFailureCount() {

        return this.totalFailedTransmissions;
    }


    /**
     * Get total transmission attempts.
     *
     * @returns {number}
     */
    getTransmissionAttempts() {

        return this.totalTransmissionAttempts;
    }


    /**
     * Calculate channel utilization.
     *
     * @param {number} totalSimulationTime
     * @returns {number}
     */
    getChannelUtilization(
        totalSimulationTime = 0
    ) {

        if (
            totalSimulationTime <= 0
        ) {

            return 0;
        }


        let busyTime =
            this.totalBusyTime;


        /*
         * Include currently active busy time.
         */
        if (
            this.state === "BUSY" ||
            this.state === "COLLISION"
        ) {

            const currentBusyTime =
                Math.max(
                    0,
                    totalSimulationTime -
                    this.busyStartTime
                );

            busyTime += currentBusyTime;
        }


        const utilization =
            (
                busyTime /
                totalSimulationTime
            ) * 100;


        return Math.min(
            100,
            Math.max(
                0,
                utilization
            )
        );
    }


    /**
     * Get a statistics object.
     *
     * @param {number} totalSimulationTime
     * @returns {Object}
     */
    getStatistics(
        totalSimulationTime = 0
    ) {

        return {

            state: this.state,

            transmittingNodes:
                this.transmittingNodes.length,

            collisionCount:
                this.collisionCount,

            successCount:
                this.successCount,

            failedTransmissions:
                this.totalFailedTransmissions,

            transmissionAttempts:
                this.totalTransmissionAttempts,

            channelUtilization:
                this.getChannelUtilization(
                    totalSimulationTime
                )
        };
    }


    /* =========================================================
       CONFIGURATION
       ========================================================= */

    /**
     * Set transmission duration.
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
    }


    /**
     * Set propagation delay.
     *
     * @param {number} delay
     */
    setPropagationDelay(delay) {

        if (
            Number.isFinite(delay) &&
            delay >= 0
        ) {

            this.propagationDelay =
                delay;
        }
    }


    /* =========================================================
       RESET
       ========================================================= */

    /**
     * Reset the entire channel.
     */
    reset() {

        this.state = "IDLE";

        this.transmittingNodes = [];

        this.lastTransmittingNodes = [];

        this.collisionDetected = false;

        this.collisionCount = 0;

        this.lastCollisionTime = 0;

        this.collisionStartTime = 0;

        this.successCount = 0;

        this.lastSuccessTime = 0;

        this.busyStartTime = 0;

        this.totalBusyTime = 0;

        this.lastStateChangeTime = 0;

        this.totalTransmissionAttempts = 0;

        this.totalSuccessfulTransmissions = 0;

        this.totalFailedTransmissions = 0;
    }


    /* =========================================================
       DEBUG / SERIALIZATION
       ========================================================= */

    /**
     * Return a simple representation of the channel.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            state: this.state,

            transmittingNodes:
                this.transmittingNodes.map(
                    node => node.id
                ),

            collisionDetected:
                this.collisionDetected,

            collisionCount:
                this.collisionCount,

            successCount:
                this.successCount,

            totalTransmissionAttempts:
                this.totalTransmissionAttempts,

            totalSuccessfulTransmissions:
                this.totalSuccessfulTransmissions,

            totalFailedTransmissions:
                this.totalFailedTransmissions,

            transmissionDuration:
                this.transmissionDuration,

            slotDuration:
                this.slotDuration,

            propagationDelay:
                this.propagationDelay
        };
    }
}