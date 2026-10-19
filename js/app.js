/* =========================================================
   CSMA/CD & CSMA/CA COLLISION SIMULATOR
   Application Controller
   ========================================================= */

import { NetworkSimulation } from "./simulation.js";
import { NetworkVisualization } from "./visualization.js";


/* =========================================================
   SIMULATOR APPLICATION
   ========================================================= */

class SimulatorApp {

    constructor() {

        /* =====================================================
           CORE MODULES
        ====================================================== */

        this.simulation =
            new NetworkSimulation();

        this.visualization =
            new NetworkVisualization();


        /* =====================================================
           CONTROL ELEMENTS
        ====================================================== */

        this.protocolSelect =
            document.getElementById(
                "protocol"
            );

        this.nodeCountInput =
            document.getElementById(
                "nodeCount"
            );

        this.trafficLevelSelect =
            document.getElementById(
                "trafficLevel"
            );

        this.speedSelect =
            document.getElementById(
                "simulationSpeed"
            );


        this.startButton =
            document.getElementById(
                "startButton"
            );

        this.pauseButton =
            document.getElementById(
                "pauseButton"
            );

        this.resetButton =
            document.getElementById(
                "resetButton"
            );


        /* =====================================================
           STATUS ELEMENT
        ====================================================== */

        this.systemStatus =
            document.getElementById(
                "systemStatus"
            );


        /* =====================================================
           PROTOCOL DESCRIPTION
        ====================================================== */

        this.protocolDescription =
            document.getElementById(
                "protocolDescription"
            );


        /* =====================================================
           CHANNEL STATUS
        ====================================================== */

        this.channelStatus =
            document.getElementById(
                "channelStatus"
            );


        /* =====================================================
           STATISTICS
        ====================================================== */

        this.collisionCount =
            document.getElementById(
                "collisionCount"
            );

        this.successCount =
            document.getElementById(
                "successCount"
            );

        this.failureCount =
            document.getElementById(
                "failureCount"
            );

        this.retryCount =
            document.getElementById(
                "retryCount"
            );

        this.throughput =
            document.getElementById(
                "throughput"
            );

        this.averageDelay =
            document.getElementById(
                "averageDelay"
            );

        this.channelUtilization =
            document.getElementById(
                "channelUtilization"
            );

        this.successRate =
            document.getElementById(
                "successRate"
            );


        /* =====================================================
           EVENT LOG
        ====================================================== */

        this.eventLog =
            document.getElementById(
                "eventLog"
            );

        this.clearLogButton =
            document.getElementById(
                "clearLogButton"
            );


        /* =====================================================
           COMPARISON TABLE
        ====================================================== */

        this.comparisonCdCollisions =
            document.getElementById(
                "comparisonCdCollisions"
            );

        this.comparisonCaCollisions =
            document.getElementById(
                "comparisonCaCollisions"
            );

        this.comparisonCdSuccess =
            document.getElementById(
                "comparisonCdSuccess"
            );

        this.comparisonCaSuccess =
            document.getElementById(
                "comparisonCaSuccess"
            );

        this.comparisonCdRetries =
            document.getElementById(
                "comparisonCdRetries"
            );

        this.comparisonCaRetries =
            document.getElementById(
                "comparisonCaRetries"
            );

        this.comparisonCdThroughput =
            document.getElementById(
                "comparisonCdThroughput"
            );

        this.comparisonCaThroughput =
            document.getElementById(
                "comparisonCaThroughput"
            );

        this.comparisonCdDelay =
            document.getElementById(
                "comparisonCdDelay"
            );

        this.comparisonCaDelay =
            document.getElementById(
                "comparisonCaDelay"
            );

        this.comparisonCdRate =
            document.getElementById(
                "comparisonCdRate"
            );

        this.comparisonCaRate =
            document.getElementById(
                "comparisonCaRate"
            );


        /* =====================================================
           APPLICATION STATE
        ====================================================== */

        this.comparisonStatistics = {

            "CSMA/CD": null,

            "CSMA/CA": null
        };


        /* =====================================================
           INITIALIZE
        ====================================================== */

        this.initialize();
    }


    /* =========================================================
       INITIALIZATION
       ========================================================= */

    initialize() {

        this.setupEventListeners();

        this.setupSimulationCallbacks();

        this.initializeSimulationSettings();

        this.initializeVisualization();

        this.updateProtocolDescription();

        this.updateUI();

        this.addLog(
            "Simulator ready. Configure the network and press Start.",
            "system"
        );
    }


    /* =========================================================
       EVENT LISTENERS
       ========================================================= */

    setupEventListeners() {

        /* =====================================================
           START
        ====================================================== */

        if (this.startButton) {

            this.startButton.addEventListener(
                "click",
                () => {

                    this.startSimulation();
                }
            );
        }


        /* =====================================================
           PAUSE / RESUME
        ====================================================== */

        if (this.pauseButton) {

            this.pauseButton.addEventListener(
                "click",
                () => {

                    this.togglePause();
                }
            );
        }


        /* =====================================================
           RESET
        ====================================================== */

        if (this.resetButton) {

            this.resetButton.addEventListener(
                "click",
                () => {

                    this.resetSimulation();
                }
            );
        }


        /* =====================================================
           PROTOCOL
        ====================================================== */

        if (this.protocolSelect) {

            this.protocolSelect.addEventListener(
                "change",
                event => {

                    this.changeProtocol(
                        event.target.value
                    );
                }
            );
        }


        /* =====================================================
           NODE COUNT
        ====================================================== */

        if (this.nodeCountInput) {

            this.nodeCountInput.addEventListener(
                "change",
                event => {

                    this.changeNodeCount(
                        event.target.value
                    );
                }
            );
        }


        /* =====================================================
           TRAFFIC LEVEL
        ====================================================== */

        if (this.trafficLevelSelect) {

            this.trafficLevelSelect.addEventListener(
                "change",
                event => {

                    this.changeTrafficLevel(
                        event.target.value
                    );
                }
            );
        }


        /* =====================================================
           SIMULATION SPEED
        ====================================================== */

        if (this.speedSelect) {

            this.speedSelect.addEventListener(
                "change",
                event => {

                    this.changeSpeed(
                        event.target.value
                    );
                }
            );
        }


        /* =====================================================
           CLEAR LOG
        ====================================================== */

        if (this.clearLogButton) {

            this.clearLogButton.addEventListener(
                "click",
                () => {

                    this.clearLog();
                }
            );
        }
    }


    /* =========================================================
       SIMULATION SETTINGS
       ========================================================= */

    initializeSimulationSettings() {

        this.changeProtocol(
            this.protocolSelect
                ? this.protocolSelect.value
                : "csma-cd"
        );


        this.changeTrafficLevel(
            this.trafficLevelSelect
                ? this.trafficLevelSelect.value
                : "medium"
        );


        this.changeSpeed(
            this.speedSelect
                ? this.speedSelect.value
                : "normal"
        );
    }


    /* =========================================================
       VISUALIZATION
       ========================================================= */

    initializeVisualization() {

        this.visualization.initialize(
            this.simulation.nodes
        );
    }


    /* =========================================================
       SIMULATION CALLBACKS
       ========================================================= */

    setupSimulationCallbacks() {

        /* =====================================================
           GENERAL UPDATE
        ====================================================== */

        this.simulation.onUpdate =
            state => {

                this.updateVisualization(
                    state
                );

                this.updateStatistics(
                    state
                );

                this.updateUI();
            };


        /* =====================================================
           GENERAL EVENT
        ====================================================== */

        this.simulation.onEvent =
            event => {

                this.handleSimulationEvent(
                    event
                );
            };


        /* =====================================================
           TRANSMISSION START
        ====================================================== */

        this.simulation.onTransmissionStart =
            data => {

                if (
                    !data ||
                    !data.node
                ) {

                    return;
                }


                this.visualization.animatePacketToChannel(
                    data.node,
                    data.protocol,
                    500
                );


                this.addLog(
                    `${data.node.name} started transmitting using ${data.protocol}.`,
                    "transmission"
                );
            };


        /* =====================================================
           COLLISION
        ====================================================== */

        this.simulation.onCollision =
            data => {

                if (
                    !data
                ) {

                    return;
                }


                this.visualization.showCollision();


                const nodeName =
                    data.node
                        ? data.node.name
                        : "Node";


                this.addLog(
                    `Collision detected involving ${nodeName}. Backoff: ${data.backoff || 0} slots.`,
                    "collision"
                );
            };


        /* =====================================================
           SUCCESS
        ====================================================== */

        this.simulation.onSuccess =
            data => {

                if (
                    !data
                ) {

                    return;
                }


                this.visualization.showSuccess();


                const nodeName =
                    data.node
                        ? data.node.name
                        : "Node";


                this.addLog(
                    `${nodeName} successfully transmitted. Delay: ${this.formatNumber(data.delay || 0)} ms.`,
                    "success"
                );
            };


        /* =====================================================
           SIMULATION START
        ====================================================== */

        this.simulation.onSimulationStart =
            () => {

                this.setSystemStatus(
                    "Running"
                );


                this.addLog(
                    `${this.simulation.activeProtocol} simulation started.`,
                    "system"
                );


                this.updateUI();
            };


        /* =====================================================
           PAUSE
        ====================================================== */

        this.simulation.onSimulationPause =
            () => {

                this.setSystemStatus(
                    "Paused"
                );


                this.addLog(
                    "Simulation paused.",
                    "system"
                );


                this.updateUI();
            };


        /* =====================================================
           RESUME
        ====================================================== */

        this.simulation.onSimulationResume =
            () => {

                this.setSystemStatus(
                    "Running"
                );


                this.addLog(
                    "Simulation resumed.",
                    "system"
                );


                this.updateUI();
            };


        /* =====================================================
           STOP
        ====================================================== */

        this.simulation.onSimulationStop =
            () => {

                if (
                    !this.simulation.isPaused
                ) {

                    this.setSystemStatus(
                        "Ready"
                    );
                }


                this.updateUI();
            };


        /* =====================================================
           RESET
        ====================================================== */

        this.simulation.onSimulationReset =
            () => {

                this.setSystemStatus(
                    "Ready"
                );


                this.visualization.reset(
                    this.simulation.nodes
                );


                this.updateStatistics(
                    this.simulation.getState()
                );


                this.updateUI();
            };
    }


    /* =========================================================
       START SIMULATION
       ========================================================= */

    startSimulation() {

        /*
         * Make sure the latest control values are applied.
         */
        this.changeProtocol(
            this.protocolSelect
                ? this.protocolSelect.value
                : "csma-cd",
            false
        );


        this.changeTrafficLevel(
            this.trafficLevelSelect
                ? this.trafficLevelSelect.value
                : "medium",
            false
        );


        this.changeSpeed(
            this.speedSelect
                ? this.speedSelect.value
                : "normal",
            false
        );


        /*
         * Start or resume the simulation.
         */
        this.simulation.start();


        this.updateUI();
    }


    /* =========================================================
       PAUSE / RESUME
       ========================================================= */

    togglePause() {

        if (
            !this.simulation.isRunning
        ) {

            return;
        }


        if (
            this.simulation.isPaused
        ) {

            this.simulation.resume();

        } else {

            this.simulation.pause();
        }


        this.updateUI();
    }


    /* =========================================================
       RESET
       ========================================================= */

    resetSimulation() {

        this.simulation.reset();


        this.visualization.reset(
            this.simulation.nodes
        );


        this.setSystemStatus(
            "Ready"
        );


        this.updateUI();


        this.addLog(
            "Simulator reset.",
            "system"
        );
    }


    /* =========================================================
       PROTOCOL CHANGE
       ========================================================= */

    changeProtocol(
        value,
        writeLog = true
    ) {

        let protocol =
            "CSMA/CD";


        if (
            String(value).toLowerCase() ===
            "csma-ca"
        ) {

            protocol =
                "CSMA/CA";
        }


        this.simulation.setProtocol(
            protocol
        );


        this.updateProtocolDescription();


        if (writeLog) {

            this.addLog(
                `Protocol changed to ${protocol}.`,
                "system"
            );
        }


        this.updateUI();
    }


    /* =========================================================
       NODE COUNT CHANGE
       ========================================================= */

    changeNodeCount(
        value
    ) {

        let count =
            Number(value);


        if (
            !Number.isFinite(count)
        ) {

            count = 5;
        }


        count =
            Math.max(
                2,
                Math.min(
                    20,
                    Math.floor(
                        count
                    )
                )
            );


        if (this.nodeCountInput) {

            this.nodeCountInput.value =
                count;
        }


        this.simulation.setNodeCount(
            count
        );


        this.visualization.initialize(
            this.simulation.nodes
        );


        this.setSystemStatus(
            "Ready"
        );


        this.addLog(
            `Network configured with ${count} nodes.`,
            "system"
        );


        this.updateUI();
    }


    /* =========================================================
       TRAFFIC LEVEL
       ========================================================= */

    changeTrafficLevel(
        level,
        writeLog = true
    ) {

        let probability;


        switch (
            String(level).toLowerCase()
        ) {

            case "low":

                probability =
                    0.01;

                break;


            case "high":

                probability =
                    0.08;

                break;


            case "medium":

            default:

                probability =
                    0.03;

                break;
        }


        this.simulation.setPacketGenerationProbability(
            probability
        );


        if (writeLog) {

            this.addLog(
                `Traffic level set to ${String(level).toUpperCase()}.`,
                "system"
            );
        }
    }


    /* =========================================================
       SPEED
       ========================================================= */

    changeSpeed(
        speed,
        writeLog = true
    ) {

        let value;


        switch (
            String(speed).toLowerCase()
        ) {

            case "slow":

                value =
                    0.5;

                break;


            case "fast":

                value =
                    2;

                break;


            case "normal":

            default:

                value =
                    1;

                break;
        }


        this.simulation.setSpeed(
            value
        );


        if (writeLog) {

            this.addLog(
                `Simulation speed set to ${String(speed).toUpperCase()}.`,
                "system"
            );
        }
    }


    /* =========================================================
       PROTOCOL DESCRIPTION
       ========================================================= */

    updateProtocolDescription() {

        if (
            !this.protocolDescription
        ) {

            return;
        }


        if (
            this.simulation.activeProtocol ===
            "CSMA/CA"
        ) {

            this.protocolDescription.textContent =
                "Carrier Sense Multiple Access with Collision Avoidance. Nodes sense the channel and use random backoff before transmission.";

        } else {

            this.protocolDescription.textContent =
                "Carrier Sense Multiple Access with Collision Detection. Nodes detect collisions during transmission and use binary exponential backoff.";
        }
    }


    /* =========================================================
       VISUALIZATION UPDATE
       ========================================================= */

    updateVisualization(
        state
    ) {

        if (
            !state
        ) {

            return;
        }


        let channelState =
            "IDLE";


        if (
            this.simulation.channel &&
            typeof this.simulation.channel.getState ===
            "function"
        ) {

            channelState =
                this.simulation.channel.getState();
        }


        this.visualization.update(
            this.simulation.nodes,
            channelState
        );


        this.updateChannelStatus(
            channelState
        );
    }


    /* =========================================================
       CHANNEL STATUS
       ========================================================= */

    updateChannelStatus(
        state
    ) {

        if (
            !this.channelStatus
        ) {

            return;
        }


        const normalized =
            String(
                state || "IDLE"
            ).toUpperCase();


        this.channelStatus.classList.remove(
            "idle",
            "busy",
            "collision",
            "success"
        );


        if (
            normalized ===
            "COLLISION"
        ) {

            this.channelStatus.classList.add(
                "collision"
            );

            this.channelStatus.textContent =
                "COLLISION";


        } else if (
            normalized ===
            "BUSY" ||
            normalized ===
            "TRANSMITTING"
        ) {

            this.channelStatus.classList.add(
                "busy"
            );

            this.channelStatus.textContent =
                "BUSY";


        } else if (
            normalized ===
            "SUCCESS"
        ) {

            this.channelStatus.classList.add(
                "success"
            );

            this.channelStatus.textContent =
                "SUCCESS";


        } else {

            this.channelStatus.classList.add(
                "idle"
            );

            this.channelStatus.textContent =
                "IDLE";
        }
    }


    /* =========================================================
       STATISTICS UPDATE
       ========================================================= */

    updateStatistics(
        state
    ) {

        if (
            !state
        ) {

            return;
        }


        const statistics =
            state.statistics || {};


        this.setText(
            this.collisionCount,
            statistics.collisions || 0
        );


        this.setText(
            this.successCount,
            statistics.successfulTransmissions || 0
        );


        this.setText(
            this.failureCount,
            statistics.failedTransmissions || 0
        );


        this.setText(
            this.retryCount,
            statistics.retransmissions || 0
        );


        this.setText(
            this.throughput,
            `${this.formatNumber(
                statistics.throughput || 0
            )}%`
        );


        this.setText(
            this.averageDelay,
            `${this.formatNumber(
                statistics.averageDelay || 0
            )} ms`
        );


        this.setText(
            this.channelUtilization,
            `${this.formatNumber(
                statistics.channelUtilization || 0
            )}%`
        );


        this.setText(
            this.successRate,
            `${this.formatNumber(
                statistics.successRate || 0
            )}%`
        );


        this.updateComparisonTable();
    }


    /* =========================================================
       COMPARISON TABLE
       ========================================================= */

    updateComparisonTable() {

        const currentProtocol =
            this.simulation.activeProtocol;


        const currentStatistics =
            this.simulation.getStatistics();


        if (
            currentStatistics
        ) {

            this.comparisonStatistics[
                currentProtocol
            ] = {
                ...currentStatistics
            };
        }


        const cd =
            this.comparisonStatistics[
                "CSMA/CD"
            ];


        const ca =
            this.comparisonStatistics[
                "CSMA/CA"
            ];


        if (cd) {

            this.setText(
                this.comparisonCdCollisions,
                cd.collisions || 0
            );


            this.setText(
                this.comparisonCdSuccess,
                cd.successfulTransmissions || 0
            );


            this.setText(
                this.comparisonCdRetries,
                cd.retransmissions || 0
            );


            this.setText(
                this.comparisonCdThroughput,
                `${this.formatNumber(
                    cd.throughput || 0
                )}%`
            );


            this.setText(
                this.comparisonCdDelay,
                `${this.formatNumber(
                    cd.averageDelay || 0
                )} ms`
            );


            this.setText(
                this.comparisonCdRate,
                `${this.formatNumber(
                    cd.successRate || 0
                )}%`
            );
        }


        if (ca) {

            this.setText(
                this.comparisonCaCollisions,
                ca.collisions || 0
            );


            this.setText(
                this.comparisonCaSuccess,
                ca.successfulTransmissions || 0
            );


            this.setText(
                this.comparisonCaRetries,
                ca.retransmissions || 0
            );


            this.setText(
                this.comparisonCaThroughput,
                `${this.formatNumber(
                    ca.throughput || 0
                )}%`
            );


            this.setText(
                this.comparisonCaDelay,
                `${this.formatNumber(
                    ca.averageDelay || 0
                )} ms`
            );


            this.setText(
                this.comparisonCaRate,
                `${this.formatNumber(
                    ca.successRate || 0
                )}%`
            );
        }
    }


    /* =========================================================
       UI UPDATE
       ========================================================= */

    updateUI() {

        this.updateButtons();

        this.updateProtocolDescription();

        this.updateStatistics(
            this.simulation.getState()
        );
    }


    /* =========================================================
       BUTTON STATES
       ========================================================= */

    updateButtons() {

        const running =
            this.simulation.isRunning;


        const paused =
            this.simulation.isPaused;


        if (this.startButton) {

            this.startButton.disabled =
                running &&
                !paused;
        }


        if (this.pauseButton) {

            this.pauseButton.disabled =
                !running;


            this.pauseButton.textContent =
                paused
                    ? "▶ Resume"
                    : "⏸ Pause";
        }


        if (this.resetButton) {

            this.resetButton.disabled =
                false;
        }
    }


    /* =========================================================
       SYSTEM STATUS
       ========================================================= */

    setSystemStatus(
        status
    ) {

        if (
            this.systemStatus
        ) {

            this.systemStatus.textContent =
                status;
        }
    }


    /* =========================================================
       EVENT LOG
       ========================================================= */

    addLog(
        message,
        type = "system"
    ) {

        if (
            !this.eventLog
        ) {

            return;
        }


        const entry =
            document.createElement(
                "div"
            );


        entry.className =
            "log-entry";


        entry.classList.add(
            String(type)
                .toLowerCase()
        );


        const time =
            this.simulation
                ? this.simulation.simulationTime
                : 0;


        const timeElement =
            document.createElement(
                "span"
            );


        timeElement.className =
            "log-time";


        timeElement.textContent =
            `[${this.formatTime(
                time
            )}]`;


        const messageElement =
            document.createElement(
                "span"
            );


        messageElement.className =
            "log-message";


        messageElement.textContent =
            message;


        entry.appendChild(
            timeElement
        );


        entry.appendChild(
            messageElement
        );


        this.eventLog.appendChild(
            entry
        );


        /*
         * Keep the newest event visible.
         */
        this.eventLog.scrollTop =
            this.eventLog.scrollHeight;


        /*
         * Keep the log from becoming
         * unnecessarily large.
         */
        while (
            this.eventLog.children.length >
            200
        ) {

            this.eventLog.removeChild(
                this.eventLog.firstChild
            );
        }
    }


    /* =========================================================
       CLEAR LOG
       ========================================================= */

    clearLog() {

        if (
            !this.eventLog
        ) {

            return;
        }


        this.eventLog.innerHTML = "";


        this.addLog(
            "Event log cleared.",
            "system"
        );
    }


    /* =========================================================
       SIMULATION EVENT HANDLER
       ========================================================= */

    handleSimulationEvent(
        event
    ) {

        if (
            !event
        ) {

            return;
        }


        if (
            event.message
        ) {

            this.addLog(
                event.message,
                event.type || "system"
            );
        }


        if (
            event.type ===
            "collision"
        ) {

            this.visualization.showCollision();
        }


        if (
            event.type ===
            "success"
        ) {

            this.visualization.showSuccess();
        }


        if (
            event.type ===
            "channel"
        ) {

            this.updateChannelStatus(
                this.simulation.channel.getState()
            );
        }
    }


    /* =========================================================
       HELPER: SET TEXT
       ========================================================= */

    setText(
        element,
        value
    ) {

        if (
            element
        ) {

            element.textContent =
                value;
        }
    }


    /* =========================================================
       HELPER: NUMBER FORMAT
       ========================================================= */

    formatNumber(
        value,
        decimals = 1
    ) {

        const number =
            Number(value);


        if (
            !Number.isFinite(
                number
            )
        ) {

            return "0";
        }


        return number.toFixed(
            decimals
        );
    }


    /* =========================================================
       HELPER: TIME FORMAT
       ========================================================= */

    formatTime(
        milliseconds
    ) {

        const totalSeconds =
            Math.floor(
                Number(milliseconds || 0) /
                1000
            );


        const minutes =
            Math.floor(
                totalSeconds / 60
            );


        const seconds =
            totalSeconds % 60;


        return (
            String(minutes).padStart(
                2,
                "0"
            ) +
            ":" +
            String(seconds).padStart(
                2,
                "0"
            )
        );
    }
}


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        window.simulatorApp =
            new SimulatorApp();

    }
);