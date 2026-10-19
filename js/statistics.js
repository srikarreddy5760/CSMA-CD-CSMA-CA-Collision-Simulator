/* =========================================================
   CSMA/CD & CSMA/CA COLLISION SIMULATOR
   Statistics Manager
   ========================================================= */

export class StatisticsManager {

    constructor() {

        this.protocol = "CSMA/CD";

        this.reset(
            this.protocol,
            0
        );
    }


    /* =========================================================
       RESET
       ========================================================= */

    reset(
        protocol = "CSMA/CD",
        simulationTime = 0
    ) {

        this.protocol =
            protocol;


        /* =====================================================
           GENERAL COUNTERS
        ====================================================== */

        this.packetsCreated = 0;

        this.transmissionAttempts = 0;

        this.successfulTransmissions = 0;

        this.failedTransmissions = 0;

        this.collisions = 0;

        this.retransmissions = 0;


        /* =====================================================
           TIMING
        ====================================================== */

        this.totalDelay = 0;

        this.averageDelay = 0;


        /* =====================================================
           CHANNEL
        ====================================================== */

        this.busyTime = 0;

        this.idleTime = 0;

        this.collisionTime = 0;

        this.lastChannelState = "IDLE";

        this.lastChannelUpdateTime =
            simulationTime;


        /* =====================================================
           PERFORMANCE
        ====================================================== */

        this.throughput = 0;

        this.channelUtilization = 0;

        this.successRate = 0;


        /* =====================================================
           SIMULATION
        ====================================================== */

        this.totalSimulationTime =
            simulationTime;


        /* =====================================================
           EVENT HISTORY
        ====================================================== */

        this.events = [];


        /* =====================================================
           NODE STATISTICS
        ====================================================== */

        this.nodeStatistics = {};
    }


    /* =========================================================
       PROTOCOL
       ========================================================= */

    setProtocol(
        protocol
    ) {

        this.protocol =
            protocol;
    }


    getProtocol() {

        return this.protocol;
    }


    /* =========================================================
       PACKET CREATED
       ========================================================= */

    recordPacketCreated() {

        this.packetsCreated++;
    }


    /* =========================================================
       TRANSMISSION ATTEMPT
       ========================================================= */

    recordTransmissionAttempt() {

        this.transmissionAttempts++;
    }


    /* =========================================================
       SUCCESS
       ========================================================= */

    recordSuccess(
        delay = 0
    ) {

        this.successfulTransmissions++;


        const numericDelay =
            Number(delay);


        if (
            Number.isFinite(
                numericDelay
            ) &&
            numericDelay >= 0
        ) {

            this.totalDelay +=
                numericDelay;
        }


        this.calculateDerivedStatistics();
    }


    /* =========================================================
       FAILURE
       ========================================================= */

    recordFailure() {

        this.failedTransmissions++;

        this.calculateDerivedStatistics();
    }


    /* =========================================================
       COLLISION
       ========================================================= */

    recordCollision() {

        this.collisions++;

        this.calculateDerivedStatistics();
    }


    /* =========================================================
       RETRANSMISSION
       ========================================================= */

    recordRetransmission() {

        this.retransmissions++;

        this.calculateDerivedStatistics();
    }


    /* =========================================================
       SIMULATION TIME
       ========================================================= */

    updateSimulationTime(
        simulationTime
    ) {

        const time =
            Number(simulationTime);


        if (
            !Number.isFinite(time)
        ) {

            return;
        }


        this.totalSimulationTime =
            Math.max(
                0,
                time
            );


        this.calculateDerivedStatistics();
    }


    /* =========================================================
       CHANNEL STATISTICS
       ========================================================= */

    updateFromChannel(
        channel,
        currentTime
    ) {

        if (
            !channel
        ) {

            return;
        }


        const time =
            Number(currentTime);


        if (
            !Number.isFinite(time)
        ) {

            return;
        }


        /*
         * Get the current channel state.
         */
        let currentState =
            "IDLE";


        if (
            typeof channel.getState ===
            "function"
        ) {

            currentState =
                channel.getState();
        }


        currentState =
            String(
                currentState ||
                "IDLE"
            ).toUpperCase();


        /*
         * Calculate elapsed time since
         * the previous channel update.
         */
        const elapsed =
            Math.max(
                0,
                time -
                this.lastChannelUpdateTime
            );


        if (
            elapsed > 0
        ) {

            switch (
                this.lastChannelState
            ) {

                case "BUSY":

                case "TRANSMITTING":

                    this.busyTime +=
                        elapsed;

                    break;


                case "COLLISION":

                    this.collisionTime +=
                        elapsed;

                    break;


                case "IDLE":

                default:

                    this.idleTime +=
                        elapsed;

                    break;
            }
        }


        this.lastChannelState =
            currentState;


        this.lastChannelUpdateTime =
            time;


        this.calculateDerivedStatistics();
    }


    /* =========================================================
       UPDATE FROM NODES
       ========================================================= */

    updateFromNodes(
        nodes = []
    ) {

        if (
            !Array.isArray(nodes)
        ) {

            return;
        }


        for (
            const node
            of nodes
        ) {

            if (
                !node
            ) {

                continue;
            }


            this.ensureNodeStatistics(
                node.id,
                node.name
            );
        }


        this.calculateDerivedStatistics();
    }


    /* =========================================================
       NODE ATTEMPT
       ========================================================= */

    recordNodeAttempt(
        nodeId
    ) {

        const statistics =
            this.ensureNodeStatistics(
                nodeId
            );


        statistics.attempts++;
    }


    /* =========================================================
       NODE SUCCESS
       ========================================================= */

    recordNodeSuccess(
        nodeId,
        delay = 0
    ) {

        const statistics =
            this.ensureNodeStatistics(
                nodeId
            );


        statistics.successes++;


        const numericDelay =
            Number(delay);


        if (
            Number.isFinite(
                numericDelay
            ) &&
            numericDelay >= 0
        ) {

            statistics.totalDelay +=
                numericDelay;
        }
    }


    /* =========================================================
       NODE COLLISION
       ========================================================= */

    recordNodeCollision(
        nodeId
    ) {

        const statistics =
            this.ensureNodeStatistics(
                nodeId
            );


        statistics.collisions++;
    }


    /* =========================================================
       NODE FAILURE
       ========================================================= */

    recordNodeFailure(
        nodeId
    ) {

        const statistics =
            this.ensureNodeStatistics(
                nodeId
            );


        statistics.failures++;
    }


    /* =========================================================
       NODE RETRANSMISSION
       ========================================================= */

    recordNodeRetransmission(
        nodeId
    ) {

        const statistics =
            this.ensureNodeStatistics(
                nodeId
            );


        statistics.retransmissions++;
    }


    /* =========================================================
       CREATE NODE STATISTICS
       ========================================================= */

    ensureNodeStatistics(
        nodeId,
        nodeName = null
    ) {

        const id =
            String(
                nodeId
            );


        if (
            !this.nodeStatistics[id]
        ) {

            this.nodeStatistics[id] = {

                id:
                    nodeId,

                name:
                    nodeName ||
                    `Node ${nodeId}`,

                attempts:
                    0,

                successes:
                    0,

                failures:
                    0,

                collisions:
                    0,

                retransmissions:
                    0,

                totalDelay:
                    0
            };

        } else if (
            nodeName
        ) {

            this.nodeStatistics[id].name =
                nodeName;
        }


        return this.nodeStatistics[id];
    }


    /* =========================================================
       DERIVED STATISTICS
       ========================================================= */

    calculateDerivedStatistics() {

        /*
         * -----------------------------------------------
         * SUCCESS RATE
         * -----------------------------------------------
         *
         * Success Rate =
         *
         * Successful transmissions /
         * Total completed attempts
         *
         * Completed attempts =
         * Successful + Failed
         */
        const completedAttempts =
            this.successfulTransmissions +
            this.failedTransmissions;


        if (
            completedAttempts > 0
        ) {

            this.successRate =
                (
                    this.successfulTransmissions /
                    completedAttempts
                ) *
                100;

        } else {

            this.successRate =
                0;
        }


        /*
         * -----------------------------------------------
         * AVERAGE DELAY
         * -----------------------------------------------
         */
        if (
            this.successfulTransmissions > 0
        ) {

            this.averageDelay =
                this.totalDelay /
                this.successfulTransmissions;

        } else {

            this.averageDelay =
                0;
        }


        /*
         * -----------------------------------------------
         * CHANNEL UTILIZATION
         * -----------------------------------------------
         *
         * Utilization =
         * Busy channel time /
         * Total simulation time
         */
        if (
            this.totalSimulationTime > 0
        ) {

            this.channelUtilization =
                (
                    this.busyTime /
                    this.totalSimulationTime
                ) *
                100;

        } else {

            this.channelUtilization =
                0;
        }


        /*
         * -----------------------------------------------
         * THROUGHPUT
         * -----------------------------------------------
         *
         * For this simulator we represent throughput
         * as the percentage of completed transmissions
         * that were successful.
         *
         * This makes the displayed percentage easy
         * to understand during the demonstration.
         */
        if (
            completedAttempts > 0
        ) {

            this.throughput =
                (
                    this.successfulTransmissions /
                    completedAttempts
                ) *
                100;

        } else {

            this.throughput =
                0;
        }


        /*
         * Keep values within 0-100%.
         */
        this.successRate =
            Math.max(
                0,
                Math.min(
                    100,
                    this.successRate
                )
            );


        this.throughput =
            Math.max(
                0,
                Math.min(
                    100,
                    this.throughput
                )
            );


        this.channelUtilization =
            Math.max(
                0,
                Math.min(
                    100,
                    this.channelUtilization
                )
            );
    }


    /* =========================================================
       EVENT RECORDING
       ========================================================= */

    recordEvent(
        event
    ) {

        if (
            !event
        ) {

            return;
        }


        this.events.push({

            message:
                event.message ||
                "",

            type:
                event.type ||
                "info",

            time:
                Number(event.time) || 0
        });


        /*
         * Keep only the most recent 500 events.
         */
        if (
            this.events.length >
            500
        ) {

            this.events.shift();
        }
    }


    /* =========================================================
       GET STATISTICS
       ========================================================= */

    getStatistics() {

        this.calculateDerivedStatistics();


        return {

            protocol:
                this.protocol,

            packetsCreated:
                this.packetsCreated,

            transmissionAttempts:
                this.transmissionAttempts,

            successfulTransmissions:
                this.successfulTransmissions,

            failedTransmissions:
                this.failedTransmissions,

            collisions:
                this.collisions,

            retransmissions:
                this.retransmissions,

            totalDelay:
                this.totalDelay,

            averageDelay:
                this.averageDelay,

            throughput:
                this.throughput,

            channelUtilization:
                this.channelUtilization,

            successRate:
                this.successRate,

            busyTime:
                this.busyTime,

            idleTime:
                this.idleTime,

            collisionTime:
                this.collisionTime,

            totalSimulationTime:
                this.totalSimulationTime
        };
    }


    /* =========================================================
       DISPLAY STATISTICS
       ========================================================= */

    getDisplayStatistics() {

        const statistics =
            this.getStatistics();


        return {

            protocol:
                statistics.protocol,

            collisions:
                statistics.collisions,

            successfulTransmissions:
                statistics.successfulTransmissions,

            failedTransmissions:
                statistics.failedTransmissions,

            retransmissions:
                statistics.retransmissions,

            throughput:
                `${statistics.throughput.toFixed(1)}%`,

            averageDelay:
                `${statistics.averageDelay.toFixed(1)} ms`,

            channelUtilization:
                `${statistics.channelUtilization.toFixed(1)}%`,

            successRate:
                `${statistics.successRate.toFixed(1)}%`
        };
    }


    /* =========================================================
       NODE STATISTICS
       ========================================================= */

    getNodeStatistics(
        nodeId
    ) {

        const id =
            String(
                nodeId
            );


        return (
            this.nodeStatistics[id] ||
            null
        );
    }


    getAllNodeStatistics() {

        return {
            ...this.nodeStatistics
        };
    }


    /* =========================================================
       EVENTS
       ========================================================= */

    getEvents() {

        return [
            ...this.events
        ];
    }


    clearEvents() {

        this.events = [];
    }


    /* =========================================================
       JSON SERIALIZATION
       ========================================================= */

    toJSON() {

        return {

            protocol:
                this.protocol,

            packetsCreated:
                this.packetsCreated,

            transmissionAttempts:
                this.transmissionAttempts,

            successfulTransmissions:
                this.successfulTransmissions,

            failedTransmissions:
                this.failedTransmissions,

            collisions:
                this.collisions,

            retransmissions:
                this.retransmissions,

            totalDelay:
                this.totalDelay,

            averageDelay:
                this.averageDelay,

            throughput:
                this.throughput,

            channelUtilization:
                this.channelUtilization,

            successRate:
                this.successRate,

            busyTime:
                this.busyTime,

            idleTime:
                this.idleTime,

            collisionTime:
                this.collisionTime,

            totalSimulationTime:
                this.totalSimulationTime,

            nodeStatistics:
                {
                    ...this.nodeStatistics
                },

            events:
                [
                    ...this.events
                ]
        };
    }
}