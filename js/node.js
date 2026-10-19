/* =========================================================
   CSMA/CD & CSMA/CA COLLISION SIMULATOR
   Network Node Module
   ========================================================= */


/**
 * Represents a single network node in the simulator.
 *
 * Each node can:
 * - Sense the channel
 * - Wait
 * - Transmit
 * - Experience a collision
 * - Perform backoff
 * - Successfully complete a transmission
 */
export class NetworkNode {

    /**
     * Create a network node.
     *
     * @param {number} id - Unique node number
     * @param {number} x - X position in the SVG network
     * @param {number} y - Y position in the SVG network
     */
    constructor(id, x, y) {

        /* =====================================================
           BASIC NODE INFORMATION
        ====================================================== */

        this.id = id;

        this.name = `Node ${id}`;

        this.x = x;

        this.y = y;


        /* =====================================================
           NODE STATE
        ====================================================== */

        /*
         * Possible states:
         *
         * IDLE
         * SENSING
         * WAITING
         * TRANSMITTING
         * COLLISION
         * BACKOFF
         * SUCCESS
         */

        this.state = "IDLE";


        /* =====================================================
           TRANSMISSION INFORMATION
        ====================================================== */

        this.hasPacket = false;

        this.packetSize = 1;

        this.transmissionAttempts = 0;

        this.successfulTransmissions = 0;

        this.failedTransmissions = 0;

        this.retransmissions = 0;


        /* =====================================================
           TIMING INFORMATION
        ====================================================== */

        this.stateStartTime = 0;

        this.transmissionStartTime = 0;

        this.transmissionEndTime = 0;

        this.totalDelay = 0;


        /* =====================================================
           BACKOFF INFORMATION
        ====================================================== */

        this.backoffCounter = 0;

        this.backoffWindow = 2;

        this.collisionCount = 0;

        this.maximumBackoffStage = 10;

        this.backoffStage = 0;


        /* =====================================================
           CSMA/CA INFORMATION
        ====================================================== */

        this.cwMin = 4;

        this.cwMax = 1024;

        this.currentCW = this.cwMin;

        this.ackReceived = false;

        this.rtsEnabled = false;

        this.ctsReceived = false;


        /* =====================================================
           PACKET INFORMATION
        ====================================================== */

        this.packetId = null;

        this.packetCreatedTime = 0;


        /* =====================================================
           VISUALIZATION INFORMATION
        ====================================================== */

        this.svgGroup = null;

        this.svgCircle = null;

        this.svgLabel = null;

        this.svgStatus = null;


        /* =====================================================
           ACTIVITY INFORMATION
        ====================================================== */

        this.isActive = true;

        this.lastActivityTime = 0;
    }


    /* =========================================================
       STATE MANAGEMENT
       ========================================================= */

    /**
     * Change the state of the node.
     *
     * @param {string} newState
     * @param {number} currentTime
     */
    setState(newState, currentTime = 0) {

        this.state = newState;

        this.stateStartTime = currentTime;

        this.lastActivityTime = currentTime;
    }


    /**
     * Return the current state.
     *
     * @returns {string}
     */
    getState() {

        return this.state;
    }


    /**
     * Check whether the node is idle.
     *
     * @returns {boolean}
     */
    isIdle() {

        return this.state === "IDLE";
    }


    /**
     * Check whether the node is currently transmitting.
     *
     * @returns {boolean}
     */
    isTransmitting() {

        return this.state === "TRANSMITTING";
    }


    /**
     * Check whether the node is backing off.
     *
     * @returns {boolean}
     */
    isBackingOff() {

        return this.state === "BACKOFF";
    }


    /**
     * Check whether the node has experienced a collision.
     *
     * @returns {boolean}
     */
    isInCollision() {

        return this.state === "COLLISION";
    }


    /* =========================================================
       PACKET MANAGEMENT
       ========================================================= */

    /**
     * Create a new packet for the node.
     *
     * @param {number} currentTime
     * @param {number|string} packetId
     */
    createPacket(currentTime = 0, packetId = null) {

        this.hasPacket = true;

        this.packetCreatedTime = currentTime;

        this.packetId = packetId;

        this.transmissionAttempts = 0;

        this.ackReceived = false;

        this.ctsReceived = false;
    }


    /**
     * Remove the current packet after successful transmission.
     */
    removePacket() {

        this.hasPacket = false;

        this.packetId = null;

        this.packetCreatedTime = 0;

        this.ackReceived = false;

        this.ctsReceived = false;
    }


    /**
     * Check whether the node currently has a packet.
     *
     * @returns {boolean}
     */
    hasDataToSend() {

        return this.hasPacket;
    }


    /* =========================================================
       TRANSMISSION MANAGEMENT
       ========================================================= */

    /**
     * Start a transmission attempt.
     *
     * @param {number} currentTime
     */
    startTransmission(currentTime = 0) {

        this.setState("TRANSMITTING", currentTime);

        this.transmissionStartTime = currentTime;

        this.transmissionAttempts += 1;
    }


    /**
     * Complete a successful transmission.
     *
     * @param {number} currentTime
     * @returns {number} Delay for this packet
     */
    completeTransmission(currentTime = 0) {

        this.transmissionEndTime = currentTime;

        const delay =
            Math.max(
                0,
                currentTime - this.packetCreatedTime
            );

        this.totalDelay += delay;

        this.successfulTransmissions += 1;

        this.setState("SUCCESS", currentTime);

        this.removePacket();

        this.resetBackoff();

        return delay;
    }


    /**
     * Register a failed transmission.
     *
     * @param {number} currentTime
     */
    registerFailure(currentTime = 0) {

        this.failedTransmissions += 1;

        this.collisionCount += 1;

        this.retransmissions += 1;

        this.setState("COLLISION", currentTime);
    }


    /* =========================================================
       CSMA/CD BACKOFF
       ========================================================= */

    /**
     * Increase the binary exponential backoff stage.
     */
    increaseBackoffStage() {

        this.backoffStage =
            Math.min(
                this.backoffStage + 1,
                this.maximumBackoffStage
            );

        this.backoffWindow =
            Math.pow(
                2,
                this.backoffStage
            );
    }


    /**
     * Generate a random CSMA/CD backoff value.
     *
     * @returns {number}
     */
    generateCdBackoff() {

        this.increaseBackoffStage();

        const maximum =
            Math.max(
                1,
                this.backoffWindow
            );

        const backoff =
            Math.floor(
                Math.random() * maximum
            );

        this.backoffCounter = backoff;

        this.setState("BACKOFF");

        return backoff;
    }


    /**
     * Decrease the backoff counter by one slot.
     *
     * @returns {number}
     */
    decreaseBackoff() {

        if (this.backoffCounter > 0) {

            this.backoffCounter -= 1;
        }

        return this.backoffCounter;
    }


    /**
     * Check whether the backoff timer has expired.
     *
     * @returns {boolean}
     */
    isBackoffComplete() {

        return this.backoffCounter <= 0;
    }


    /**
     * Reset CSMA/CD backoff information.
     */
    resetBackoff() {

        this.backoffCounter = 0;

        this.backoffStage = 0;

        this.backoffWindow = 2;
    }


    /* =========================================================
       CSMA/CA BACKOFF
       ========================================================= */

    /**
     * Generate a random CSMA/CA backoff value.
     *
     * @returns {number}
     */
    generateCaBackoff() {

        const maximum =
            Math.max(
                1,
                this.currentCW
            );

        const backoff =
            Math.floor(
                Math.random() * maximum
            );

        this.backoffCounter = backoff;

        this.setState("BACKOFF");

        return backoff;
    }


    /**
     * Increase the CSMA/CA contention window.
     */
    increaseContentionWindow() {

        this.currentCW =
            Math.min(
                this.currentCW * 2,
                this.cwMax
            );
    }


    /**
     * Reset the CSMA/CA contention window.
     */
    resetContentionWindow() {

        this.currentCW = this.cwMin;
    }


    /**
     * Register a successful CSMA/CA transmission.
     */
    receiveAck() {

        this.ackReceived = true;

        this.resetContentionWindow();
    }


    /**
     * Register a CTS response.
     */
    receiveCts() {

        this.ctsReceived = true;
    }


    /* =========================================================
       STATISTICS
       ========================================================= */

    /**
     * Get the number of successful transmissions.
     *
     * @returns {number}
     */
    getSuccessfulTransmissions() {

        return this.successfulTransmissions;
    }


    /**
     * Get the number of collisions.
     *
     * @returns {number}
     */
    getCollisionCount() {

        return this.collisionCount;
    }


    /**
     * Get the number of retransmissions.
     *
     * @returns {number}
     */
    getRetransmissions() {

        return this.retransmissions;
    }


    /**
     * Get total delay accumulated by the node.
     *
     * @returns {number}
     */
    getTotalDelay() {

        return this.totalDelay;
    }


    /**
     * Get average delay.
     *
     * @returns {number}
     */
    getAverageDelay() {

        if (this.successfulTransmissions === 0) {

            return 0;
        }

        return (
            this.totalDelay /
            this.successfulTransmissions
        );
    }


    /**
     * Get total number of transmission attempts.
     *
     * @returns {number}
     */
    getTotalAttempts() {

        return this.transmissionAttempts;
    }


    /* =========================================================
       NODE RESET
       ========================================================= */

    /**
     * Reset the node to its initial state.
     */
    reset() {

        this.state = "IDLE";

        this.hasPacket = false;

        this.packetSize = 1;

        this.transmissionAttempts = 0;

        this.successfulTransmissions = 0;

        this.failedTransmissions = 0;

        this.retransmissions = 0;

        this.stateStartTime = 0;

        this.transmissionStartTime = 0;

        this.transmissionEndTime = 0;

        this.totalDelay = 0;

        this.backoffCounter = 0;

        this.backoffWindow = 2;

        this.collisionCount = 0;

        this.backoffStage = 0;

        this.currentCW = this.cwMin;

        this.ackReceived = false;

        this.rtsEnabled = false;

        this.ctsReceived = false;

        this.packetId = null;

        this.packetCreatedTime = 0;

        this.lastActivityTime = 0;
    }


    /* =========================================================
       SERIALIZATION
       ========================================================= */

    /**
     * Return a simple object representation of the node.
     *
     * This is useful for debugging and statistics.
     *
     * @returns {Object}
     */
    toJSON() {

        return {

            id: this.id,

            name: this.name,

            x: this.x,

            y: this.y,

            state: this.state,

            hasPacket: this.hasPacket,

            packetId: this.packetId,

            transmissionAttempts:
                this.transmissionAttempts,

            successfulTransmissions:
                this.successfulTransmissions,

            failedTransmissions:
                this.failedTransmissions,

            retransmissions:
                this.retransmissions,

            collisionCount:
                this.collisionCount,

            backoffCounter:
                this.backoffCounter,

            backoffStage:
                this.backoffStage,

            currentCW:
                this.currentCW,

            averageDelay:
                this.getAverageDelay()
        };
    }
}