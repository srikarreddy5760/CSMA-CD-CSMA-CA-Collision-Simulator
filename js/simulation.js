/* =========================================================
   CSMA/CD & CSMA/CA COLLISION SIMULATOR
   Main Simulation Engine
   ========================================================= */

import { NetworkNode } from "./node.js";
import { NetworkChannel } from "./channel.js";
import { CSMACD } from "./csma-cd.js";
import { CSMACA } from "./csma-ca.js";
import { StatisticsManager } from "./statistics.js";


/* =========================================================
   NETWORK SIMULATION
   ========================================================= */

export class NetworkSimulation {

    constructor() {

        /* =====================================================
           NETWORK
        ====================================================== */

        this.nodes = [];

        this.channel =
            new NetworkChannel();


        /* =====================================================
           PROTOCOLS
        ====================================================== */

        this.csmaCD =
            new CSMACD(
                this.channel
            );

        this.csmaCA =
            new CSMACA(
                this.channel
            );


        this.activeProtocol =
            "CSMA/CD";


        /* =====================================================
           STATISTICS
        ====================================================== */

        this.statistics =
            new StatisticsManager();


        /* =====================================================
           SIMULATION STATE
        ====================================================== */

        this.isRunning =
            false;

        this.isPaused =
            false;

        this.simulationTime =
            0;

        this.lastUpdateTime =
            0;

        this.animationFrame =
            null;


        /* =====================================================
           SPEED
        ====================================================== */

        this.speed =
            1;

        this.timeAccumulator =
            0;

        this.timeStep =
            50;


        /* =====================================================
           NODE CONFIGURATION
        ====================================================== */

        this.defaultNodeCount =
            6;

        this.packetGenerationProbability =
            0.03;


        /* =====================================================
           PACKET CONFIGURATION
        ====================================================== */

        this.nextPacketId =
            1;


        /* =====================================================
           CALLBACKS
        ====================================================== */

        this.onUpdate =
            null;

        this.onEvent =
            null;

        this.onSimulationStart =
            null;

        this.onSimulationPause =
            null;

        this.onSimulationResume =
            null;

        this.onSimulationStop =
            null;

        this.onSimulationReset =
            null;

        this.onCollision =
            null;

        this.onSuccess =
            null;

        this.onTransmissionStart =
            null;

        this.onTransmissionEnd =
            null;


        /* =====================================================
           INITIALIZE
        ====================================================== */

        this.initialize();
    }


    /* =========================================================
       INITIALIZATION
       ========================================================= */

    initialize(
        nodeCount = this.defaultNodeCount
    ) {

        this.stop();


        this.nodes =
            [];


        this.channel.reset();


        if (
            typeof this.csmaCD.initialize ===
            "function"
        ) {

            this.csmaCD.initialize(
                this.channel
            );
        }


        if (
            typeof this.csmaCA.initialize ===
            "function"
        ) {

            this.csmaCA.initialize(
                this.channel
            );
        }


        /*
         * StatisticsManager uses reset(),
         * not initialize().
         */
        this.statistics.reset(
            this.activeProtocol,
            0
        );


        this.createNodes(
            nodeCount
        );


        this.connectProtocolEvents();

        this.connectChannelEvents();


        this.simulationTime =
            0;

        this.nextPacketId =
            1;

        this.isRunning =
            false;

        this.isPaused =
            false;

        this.timeAccumulator =
            0;


        this.notifyUpdate();
    }


    /* =========================================================
       CREATE NODES
       ========================================================= */

    createNodes(
        count = 6
    ) {

        const validCount =
            Math.max(
                2,
                Math.min(
                    20,
                    Math.floor(
                        Number(count) || 6
                    )
                )
            );


        this.nodes =
            [];


        for (
            let i = 0;
            i < validCount;
            i++
        ) {

            const node =
                new NetworkNode(
                    i + 1,
                    0,
                    0
                );


            if (
                typeof node.setState ===
                "function"
            ) {

                node.setState(
                    "IDLE",
                    0
                );
            }


            this.nodes.push(
                node
            );
        }


        this.statistics.updateFromNodes(
            this.nodes
        );
    }


    /* =========================================================
       PROTOCOL EVENT CONNECTION
       ========================================================= */

    connectProtocolEvents() {

        /* =====================================================
           CSMA/CD
        ====================================================== */

        this.csmaCD.onEvent =
            event => {

                this.emitEvent(
                    event
                );
            };


        this.csmaCD.onCollision =
            (
                node,
                backoff,
                time
            ) => {

                if (
                    node
                ) {

                    this.statistics.recordCollision();

                    this.statistics.recordNodeCollision(
                        node.id
                    );

                    this.statistics.recordRetransmission();

                    this.statistics.recordNodeRetransmission(
                        node.id
                    );
                }


                if (
                    typeof this.onCollision ===
                    "function"
                ) {

                    this.onCollision(
                        {
                            node,
                            backoff,
                            time,
                            protocol:
                                "CSMA/CD"
                        }
                    );
                }


                this.emitEvent({

                    message:
                        node
                            ? `${node.name} collision. Backoff = ${backoff} slots.`
                            : `Collision detected. Backoff = ${backoff} slots.`,

                    type:
                        "collision",

                    time:
                        time
                });
            };


        this.csmaCD.onSuccess =
            (
                node,
                delay,
                time
            ) => {

                this.statistics.recordSuccess(
                    delay
                );


                if (
                    node
                ) {

                    this.statistics.recordNodeSuccess(
                        node.id,
                        delay
                    );
                }


                if (
                    typeof this.onSuccess ===
                    "function"
                ) {

                    this.onSuccess(
                        {
                            node,
                            delay,
                            time,
                            protocol:
                                "CSMA/CD"
                        }
                    );
                }


                this.emitEvent({

                    message:
                        node
                            ? `${node.name} transmission successful.`
                            : "Transmission successful.",

                    type:
                        "success",

                    time:
                        time
                });
            };


        this.csmaCD.onTransmissionStart =
            (
                node,
                time
            ) => {

                this.statistics.recordTransmissionAttempt();


                if (
                    node
                ) {

                    this.statistics.recordNodeAttempt(
                        node.id
                    );
                }


                if (
                    typeof this.onTransmissionStart ===
                    "function"
                ) {

                    this.onTransmissionStart(
                        {
                            node,
                            time,
                            protocol:
                                "CSMA/CD"
                        }
                    );
                }
            };


        this.csmaCD.onTransmissionEnd =
            (
                node,
                time
            ) => {

                if (
                    typeof this.onTransmissionEnd ===
                    "function"
                ) {

                    this.onTransmissionEnd(
                        {
                            node,
                            time,
                            protocol:
                                "CSMA/CD"
                        }
                    );
                }
            };


        /* =====================================================
           CSMA/CA
        ====================================================== */

        this.csmaCA.onEvent =
            event => {

                this.emitEvent(
                    event
                );
            };


        this.csmaCA.onCollision =
            (
                node,
                backoff,
                time
            ) => {

                if (
                    node
                ) {

                    this.statistics.recordCollision();

                    this.statistics.recordNodeCollision(
                        node.id
                    );

                    this.statistics.recordRetransmission();

                    this.statistics.recordNodeRetransmission(
                        node.id
                    );
                }


                if (
                    typeof this.onCollision ===
                    "function"
                ) {

                    this.onCollision(
                        {
                            node,
                            backoff,
                            time,
                            protocol:
                                "CSMA/CA"
                        }
                    );
                }


                this.emitEvent({

                    message:
                        node
                            ? `${node.name} collision. Backoff = ${backoff} slots.`
                            : `Collision detected. Backoff = ${backoff} slots.`,

                    type:
                        "collision",

                    time:
                        time
                });
            };


        this.csmaCA.onSuccess =
            (
                node,
                delay,
                time
            ) => {

                this.statistics.recordSuccess(
                    delay
                );


                if (
                    node
                ) {

                    this.statistics.recordNodeSuccess(
                        node.id,
                        delay
                    );
                }


                if (
                    typeof this.onSuccess ===
                    "function"
                ) {

                    this.onSuccess(
                        {
                            node,
                            delay,
                            time,
                            protocol:
                                "CSMA/CA"
                        }
                    );
                }


                this.emitEvent({

                    message:
                        node
                            ? `${node.name} transmission successful.`
                            : "Transmission successful.",

                    type:
                        "success",

                    time:
                        time
                });
            };


        this.csmaCA.onTransmissionStart =
            (
                node,
                time
            ) => {

                this.statistics.recordTransmissionAttempt();


                if (
                    node
                ) {

                    this.statistics.recordNodeAttempt(
                        node.id
                    );
                }


                if (
                    typeof this.onTransmissionStart ===
                    "function"
                ) {

                    this.onTransmissionStart(
                        {
                            node,
                            time,
                            protocol:
                                "CSMA/CA"
                        }
                    );
                }
            };


        this.csmaCA.onTransmissionEnd =
            (
                node,
                time
            ) => {

                if (
                    typeof this.onTransmissionEnd ===
                    "function"
                ) {

                    this.onTransmissionEnd(
                        {
                            node,
                            time,
                            protocol:
                                "CSMA/CA"
                        }
                    );
                }
            };


        this.csmaCA.onAck =
            (
                node,
                time
            ) => {

                this.emitEvent({

                    message:
                        node
                            ? `${node.name} received ACK.`
                            : "ACK received.",

                    type:
                        "success",

                    time:
                        time
                });
            };


        this.csmaCA.onAckTimeout =
            (
                node,
                backoff,
                time
            ) => {

                this.statistics.recordFailure();

                this.statistics.recordRetransmission();


                if (
                    node
                ) {

                    this.statistics.recordNodeFailure(
                        node.id
                    );

                    this.statistics.recordNodeRetransmission(
                        node.id
                    );
                }


                this.emitEvent({

                    message:
                        node
                            ? `${node.name} ACK timeout. New backoff = ${backoff} slots.`
                            : `ACK timeout. New backoff = ${backoff} slots.`,

                    type:
                        "warning",

                    time:
                        time
                });
            };
    }


    /* =========================================================
       CHANNEL EVENT CONNECTION
       ========================================================= */

    connectChannelEvents() {

        this.channel.onStateChange =
            (
                newState,
                previousState,
                time
            ) => {

                this.emitEvent({

                    message:
                        `Channel changed from ${previousState} to ${newState}.`,

                    type:
                        "channel",

                    time:
                        time
                });
            };


        this.channel.onCollision =
            (
                nodes,
                time
            ) => {

                const names =
                    Array.isArray(nodes)
                        ? nodes
                            .map(
                                node =>
                                    node.name
                            )
                            .join(", ")
                        : "multiple nodes";


                this.emitEvent({

                    message:
                        `Collision detected involving ${names}.`,

                    type:
                        "collision",

                    time:
                        time
                });
            };


        this.channel.onSuccess =
            (
                node,
                time,
                delay
            ) => {

                this.emitEvent({

                    message:
                        node
                            ? `${node.name} transmission successful.`
                            : "Transmission successful.",

                    type:
                        "success",

                    time:
                        time,

                    delay:
                        delay
                });
            };
    }


    /* =========================================================
       PROTOCOL MANAGEMENT
       ========================================================= */

    setProtocol(
        protocol
    ) {

        const normalized =
            String(
                protocol
            )
                .trim()
                .toUpperCase();


        if (
            normalized ===
            "CSMA/CA"
        ) {

            this.activeProtocol =
                "CSMA/CA";

        } else {

            this.activeProtocol =
                "CSMA/CD";
        }


        this.statistics.setProtocol(
            this.activeProtocol
        );


        this.emitEvent({

            message:
                `Protocol changed to ${this.activeProtocol}.`,

            type:
                "info",

            time:
                this.simulationTime
        });
    }


    getActiveProtocol() {

        if (
            this.activeProtocol ===
            "CSMA/CA"
        ) {

            return this.csmaCA;
        }


        return this.csmaCD;
    }


    /* =========================================================
       START
       ========================================================= */

    start() {

        if (
            this.isRunning &&
            !this.isPaused
        ) {

            return;
        }


        if (
            this.isRunning &&
            this.isPaused
        ) {

            this.resume();

            return;
        }


        this.isRunning =
            true;

        this.isPaused =
            false;

        this.lastUpdateTime =
            performance.now();


        this.emitEvent({

            message:
                `${this.activeProtocol} simulation started.`,

            type:
                "info",

            time:
                this.simulationTime
        });


        if (
            typeof this.onSimulationStart ===
            "function"
        ) {

            this.onSimulationStart();
        }


        this.notifyUpdate();


        this.animationFrame =
            requestAnimationFrame(
                this.animationLoop.bind(
                    this
                )
            );
    }


    /* =========================================================
       PAUSE
       ========================================================= */

    pause() {

        if (
            !this.isRunning ||
            this.isPaused
        ) {

            return;
        }


        this.isPaused =
            true;


        if (
            this.animationFrame !==
            null
        ) {

            cancelAnimationFrame(
                this.animationFrame
            );

            this.animationFrame =
                null;
        }


        this.emitEvent({

            message:
                "Simulation paused.",

            type:
                "warning",

            time:
                this.simulationTime
        });


        if (
            typeof this.onSimulationPause ===
            "function"
        ) {

            this.onSimulationPause();
        }
    }


    /* =========================================================
       RESUME
       ========================================================= */

    resume() {

        if (
            !this.isRunning ||
            !this.isPaused
        ) {

            return;
        }


        this.isPaused =
            false;


        this.lastUpdateTime =
            performance.now();


        this.emitEvent({

            message:
                "Simulation resumed.",

            type:
                "info",

            time:
                this.simulationTime
        });


        if (
            typeof this.onSimulationResume ===
            "function"
        ) {

            this.onSimulationResume();
        }


        this.animationFrame =
            requestAnimationFrame(
                this.animationLoop.bind(
                    this
                )
            );
    }


    /* =========================================================
       STOP
       ========================================================= */

    stop() {

        const wasRunning =
            this.isRunning;


        this.isRunning =
            false;

        this.isPaused =
            false;


        if (
            this.animationFrame !==
            null
        ) {

            cancelAnimationFrame(
                this.animationFrame
            );

            this.animationFrame =
                null;
        }


        if (
            wasRunning
        ) {

            this.emitEvent({

                message:
                    "Simulation stopped.",

                type:
                    "info",

                time:
                    this.simulationTime
            });
        }


        if (
            typeof this.onSimulationStop ===
            "function"
        ) {

            this.onSimulationStop();
        }
    }


    /* =========================================================
       RESET
       ========================================================= */

    reset() {

        this.stop();


        this.simulationTime =
            0;

        this.lastUpdateTime =
            0;

        this.timeAccumulator =
            0;

        this.nextPacketId =
            1;


        this.channel.reset();


        if (
            typeof this.csmaCD.reset ===
            "function"
        ) {

            this.csmaCD.reset();
        }


        if (
            typeof this.csmaCA.reset ===
            "function"
        ) {

            this.csmaCA.reset();
        }


        this.statistics.reset(
            this.activeProtocol,
            0
        );


        for (
            const node
            of this.nodes
        ) {

            if (
                typeof node.reset ===
                "function"
            ) {

                node.reset();
            }


            if (
                typeof node.setState ===
                "function"
            ) {

                node.setState(
                    "IDLE",
                    0
                );
            }
        }


        this.emitEvent({

            message:
                "Simulation reset.",

            type:
                "info",

            time:
                0
        });


        if (
            typeof this.onSimulationReset ===
            "function"
        ) {

            this.onSimulationReset();
        }


        this.notifyUpdate();
    }


    /* =========================================================
       ANIMATION LOOP
       ========================================================= */

    animationLoop(
        currentTime
    ) {

        if (
            !this.isRunning ||
            this.isPaused
        ) {

            return;
        }


        const realDelta =
            currentTime -
            this.lastUpdateTime;


        this.lastUpdateTime =
            currentTime;


        const delta =
            Math.min(
                realDelta,
                250
            );


        this.timeAccumulator +=
            delta *
            this.speed;


        while (
            this.timeAccumulator >=
            this.timeStep
        ) {

            this.update(
                this.timeStep
            );


            this.timeAccumulator -=
                this.timeStep;
        }


        this.notifyUpdate();


        this.animationFrame =
            requestAnimationFrame(
                this.animationLoop.bind(
                    this
                )
            );
    }


    /* =========================================================
       UPDATE
       ========================================================= */

    update(
        deltaTime = 50
    ) {

        if (
            !this.isRunning ||
            this.isPaused
        ) {

            return;
        }


        this.simulationTime +=
            deltaTime;


        this.generatePackets();


        for (
            const node
            of this.nodes
        ) {

            this.processNode(
                node,
                deltaTime
            );
        }


        this.statistics.updateFromChannel(
            this.channel,
            this.simulationTime
        );


        this.statistics.updateFromNodes(
            this.nodes
        );


        this.statistics.updateSimulationTime(
            this.simulationTime
        );
    }


    /* =========================================================
       NODE PROCESSING
       ========================================================= */

    processNode(
        node,
        deltaTime
    ) {

        if (!node) {

            return;
        }


        const protocol =
            this.getActiveProtocol();


        const state =
            typeof node.getState ===
            "function"
                ? node.getState()
                : node.state;


        switch (state) {


            /* ===============================================
               IDLE
            =============================================== */

            case "IDLE": {

                if (
                    !node.hasDataToSend()
                ) {

                    return;
                }


                if (
                    typeof protocol.performCarrierSense ===
                    "function"
                ) {

                    protocol.performCarrierSense(
                        node,
                        this.simulationTime
                    );
                }


                break;
            }


            /* ===============================================
               SENSING
            =============================================== */

            case "SENSING": {

                if (
                    typeof protocol.processNode !==
                    "function"
                ) {

                    break;
                }


                const result =
                    protocol.processNode(
                        node,
                        this.simulationTime
                    );


                if (
                    !result
                ) {

                    break;
                }


                if (
                    result.action ===
                    "transmit"
                ) {

                    if (
                        typeof protocol.attemptTransmission ===
                        "function"
                    ) {

                        protocol.attemptTransmission(
                            node,
                            this.simulationTime
                        );
                    }

                } else if (
                    result.action ===
                    "backoff"
                ) {

                    if (
                        typeof protocol.generateBackoff ===
                        "function"
                    ) {

                        protocol.generateBackoff(
                            node
                        );
                    }
                }


                break;
            }


            /* ===============================================
               WAITING
            =============================================== */

            case "WAITING": {

                if (
                    typeof protocol.processNode !==
                    "function"
                ) {

                    break;
                }


                const waitingResult =
                    protocol.processNode(
                        node,
                        this.simulationTime
                    );


                if (
                    waitingResult &&
                    waitingResult.action ===
                    "sense"
                ) {

                    node.setState(
                        "SENSING",
                        this.simulationTime
                    );
                }


                break;
            }


            /* ===============================================
               BACKOFF
            =============================================== */

            case "BACKOFF": {

                const slotDuration =
                    Number(
                        protocol.slotDuration
                    ) ||
                    50;


                if (
                    this.simulationTime %
                    slotDuration <
                    deltaTime
                ) {

                    if (
                        typeof protocol.decreaseBackoff ===
                        "function"
                    ) {

                        protocol.decreaseBackoff(
                            node,
                            this.simulationTime
                        );
                    }
                }


                if (
                    Number(
                        node.backoffCounter
                    ) <= 0
                ) {

                    node.setState(
                        "SENSING",
                        this.simulationTime
                    );
                }


                break;
            }


            /* ===============================================
               TRANSMITTING
            =============================================== */

            case "TRANSMITTING": {

                const startTime =
                    Number(
                        node.transmissionStartTime
                    ) || 0;


                const elapsed =
                    this.simulationTime -
                    startTime;


                if (
                    this.channel.isCollision()
                ) {

                    if (
                        typeof protocol.handleCollision ===
                        "function"
                    ) {

                        protocol.handleCollision(
                            node,
                            this.simulationTime
                        );
                    }


                    return;
                }


                const transmissionDuration =
                    Number(
                        protocol.transmissionDuration
                    ) ||
                    500;


                if (
                    elapsed >=
                    transmissionDuration
                ) {

                    if (
                        typeof protocol.completeTransmission ===
                        "function"
                    ) {

                        protocol.completeTransmission(
                            node,
                            this.simulationTime
                        );
                    }
                }


                break;
            }


            /* ===============================================
               COLLISION
            =============================================== */

            case "COLLISION": {

                if (
                    Number(
                        node.backoffCounter
                    ) <= 0
                ) {

                    if (
                        typeof protocol.generateBackoff ===
                        "function"
                    ) {

                        protocol.generateBackoff(
                            node
                        );
                    }
                }


                break;
            }


            /* ===============================================
               SUCCESS
            =============================================== */

            case "SUCCESS": {

                node.setState(
                    "IDLE",
                    this.simulationTime
                );


                break;
            }


            default: {

                node.setState(
                    "IDLE",
                    this.simulationTime
                );

                break;
            }
        }
    }


    /* =========================================================
       PACKET GENERATION
       ========================================================= */

    generatePackets() {

        for (
            const node
            of this.nodes
        ) {

            if (
                node.hasDataToSend()
            ) {

                continue;
            }


            if (
                node.state !==
                "IDLE"
            ) {

                continue;
            }


            if (
                Math.random() <
                this.packetGenerationProbability
            ) {

                this.createPacketForNode(
                    node
                );
            }
        }
    }


    /* =========================================================
       CREATE PACKET
       ========================================================= */

    createPacketForNode(
        node
    ) {

        if (!node) {

            return;
        }


        const packetId =
            this.nextPacketId++;


        if (
            typeof node.createPacket ===
            "function"
        ) {

            node.createPacket(
                this.simulationTime,
                packetId
            );
        }


        this.statistics.recordPacketCreated();


        this.emitEvent({

            message:
                `${node.name} generated Packet ${packetId}.`,

            type:
                "packet",

            time:
                this.simulationTime,

            nodeId:
                node.id,

            packetId:
                packetId
        });
    }


    /* =========================================================
       MANUAL PACKET GENERATION
       ========================================================= */

    generatePacket(
        nodeId
    ) {

        const node =
            this.getNodeById(
                nodeId
            );


        if (!node) {

            return false;
        }


        if (
            node.hasDataToSend()
        ) {

            return false;
        }


        this.createPacketForNode(
            node
        );


        return true;
    }


    /* =========================================================
       FORCE COLLISION
       ========================================================= */

    forceCollision(
        nodeIds = []
    ) {

        if (
            !Array.isArray(nodeIds) ||
            nodeIds.length < 2
        ) {

            return false;
        }


        const selectedNodes =
            [];


        for (
            const nodeId
            of nodeIds
        ) {

            const node =
                this.getNodeById(
                    nodeId
                );


            if (
                node
            ) {

                if (
                    !node.hasDataToSend()
                ) {

                    this.createPacketForNode(
                        node
                    );
                }


                selectedNodes.push(
                    node
                );
            }
        }


        if (
            selectedNodes.length < 2
        ) {

            return false;
        }


        for (
            const node
            of selectedNodes
        ) {

            if (
                typeof node.startTransmission ===
                "function"
            ) {

                node.startTransmission(
                    this.simulationTime
                );
            }


            if (
                typeof this.channel.startTransmission ===
                "function"
            ) {

                this.channel.startTransmission(
                    node,
                    this.simulationTime
                );
            }
        }


        this.emitEvent({

            message:
                `Forced collision involving ${selectedNodes.length} nodes.`,

            type:
                "collision",

            time:
                this.simulationTime
        });


        return true;
    }


    /* =========================================================
       NODE MANAGEMENT
       ========================================================= */

    addNode() {

        const id =
            this.nodes.length + 1;


        const node =
            new NetworkNode(
                id,
                0,
                0
            );


        node.setState(
            "IDLE",
            this.simulationTime
        );


        this.nodes.push(
            node
        );


        this.statistics.updateFromNodes(
            this.nodes
        );


        this.notifyUpdate();


        return node;
    }


    removeNode(
        nodeId
    ) {

        const index =
            this.nodes.findIndex(
                node =>
                    node.id ===
                    Number(nodeId)
            );


        if (
            index === -1
        ) {

            return false;
        }


        const node =
            this.nodes[index];


        if (
            typeof this.channel.isNodeTransmitting ===
            "function" &&
            this.channel.isNodeTransmitting(
                node
            )
        ) {

            if (
                Array.isArray(
                    this.channel.transmittingNodes
                )
            ) {

                this.channel.transmittingNodes =
                    this.channel.transmittingNodes.filter(
                        activeNode =>
                            activeNode !==
                            node
                    );
            }
        }


        this.nodes.splice(
            index,
            1
        );


        this.statistics.updateFromNodes(
            this.nodes
        );


        this.notifyUpdate();


        return true;
    }


    getNodeById(
        nodeId
    ) {

        const id =
            Number(nodeId);


        return (
            this.nodes.find(
                node =>
                    node.id ===
                    id
            ) ||
            null
        );
    }


    /* =========================================================
       SPEED
       ========================================================= */

    setSpeed(
        speed
    ) {

        const value =
            Number(speed);


        if (
            !Number.isFinite(value)
        ) {

            return;
        }


        this.speed =
            Math.max(
                0.1,
                Math.min(
                    10,
                    value
                )
            );
    }


    getSpeed() {

        return this.speed;
    }


    /* =========================================================
       PACKET GENERATION PROBABILITY
       ========================================================= */

    setPacketGenerationProbability(
        probability
    ) {

        const value =
            Number(probability);


        if (
            !Number.isFinite(value)
        ) {

            return;
        }


        this.packetGenerationProbability =
            Math.max(
                0,
                Math.min(
                    1,
                    value
                )
            );
    }


    /* =========================================================
       EVENTS
       ========================================================= */

    emitEvent(
        event
    ) {

        if (
            !event
        ) {

            return;
        }


        this.statistics.recordEvent(
            event
        );


        if (
            typeof this.onEvent ===
            "function"
        ) {

            this.onEvent(
                event
            );
        }
    }


    /* =========================================================
       UPDATE CALLBACK
       ========================================================= */

    notifyUpdate() {

        if (
            typeof this.onUpdate ===
            "function"
        ) {

            this.onUpdate(
                this.getState()
            );
        }
    }


    /* =========================================================
       STATE
       ========================================================= */

    getState() {

        return {

            protocol:
                this.activeProtocol,

            running:
                this.isRunning,

            paused:
                this.isPaused,

            simulationTime:
                this.simulationTime,

            speed:
                this.speed,

            channel:
                typeof this.channel.toJSON ===
                "function"
                    ? this.channel.toJSON()
                    : {},

            nodes:
                this.nodes.map(
                    node =>
                        typeof node.toJSON ===
                        "function"
                            ? node.toJSON()
                            : node
                ),

            statistics:
                this.statistics.getStatistics()
        };
    }


    /* =========================================================
       NODE COUNT
       ========================================================= */

    setNodeCount(
        count
    ) {

        const wasRunning =
            this.isRunning;


        this.stop();


        this.createNodes(
            count
        );


        this.channel.reset();


        this.statistics.reset(
            this.activeProtocol,
            0
        );


        this.simulationTime =
            0;

        this.nextPacketId =
            1;


        this.timeAccumulator =
            0;


        if (
            wasRunning
        ) {

            this.start();
        }


        this.notifyUpdate();
    }


    /* =========================================================
       TRANSMISSION DURATION
       ========================================================= */

    setTransmissionDuration(
        duration
    ) {

        if (
            typeof this.csmaCD.setTransmissionDuration ===
            "function"
        ) {

            this.csmaCD.setTransmissionDuration(
                duration
            );
        }


        if (
            typeof this.csmaCA.setTransmissionDuration ===
            "function"
        ) {

            this.csmaCA.setTransmissionDuration(
                duration
            );
        }
    }


    /* =========================================================
       SLOT DURATION
       ========================================================= */

    setSlotDuration(
        duration
    ) {

        if (
            typeof this.csmaCD.setSlotDuration ===
            "function"
        ) {

            this.csmaCD.setSlotDuration(
                duration
            );
        }


        if (
            typeof this.csmaCA.setSlotDuration ===
            "function"
        ) {

            this.csmaCA.setSlotDuration(
                duration
            );
        }
    }


    /* =========================================================
       STATISTICS
       ========================================================= */

    getStatistics() {

        return this.statistics.getStatistics();
    }


    getDisplayStatistics() {

        return this.statistics.getDisplayStatistics();
    }


    /* =========================================================
       RESET NODES
       ========================================================= */

    resetNodes() {

        for (
            const node
            of this.nodes
        ) {

            if (
                typeof node.reset ===
                "function"
            ) {

                node.reset();
            }


            node.setState(
                "IDLE",
                0
            );
        }
    }


    /* =========================================================
       SERIALIZATION
       ========================================================= */

    toJSON() {

        return {

            protocol:
                this.activeProtocol,

            simulationTime:
                this.simulationTime,

            speed:
                this.speed,

            running:
                this.isRunning,

            paused:
                this.isPaused,

            nodes:
                this.nodes.map(
                    node =>
                        typeof node.toJSON ===
                        "function"
                            ? node.toJSON()
                            : node
                ),

            channel:
                typeof this.channel.toJSON ===
                "function"
                    ? this.channel.toJSON()
                    : {},

            csmaCD:
                typeof this.csmaCD.toJSON ===
                "function"
                    ? this.csmaCD.toJSON()
                    : {},

            csmaCA:
                typeof this.csmaCA.toJSON ===
                "function"
                    ? this.csmaCA.toJSON()
                    : {},

            statistics:
                this.statistics.toJSON()
        };
    }
}