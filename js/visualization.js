/* =========================================================
   CSMA/CD & CSMA/CA COLLISION SIMULATOR
   SVG Visualization Module
   ========================================================= */


/**
 * Handles the visual representation of the simulator.
 *
 * Responsibilities:
 *
 * - Create network nodes
 * - Draw the shared channel
 * - Draw packets
 * - Animate packets
 * - Display node states
 * - Display collisions
 * - Display successful transmissions
 * - Update channel status
 * - Update node status cards
 */
export class NetworkVisualization {

    constructor() {

        /* =====================================================
           SVG ELEMENTS
        ====================================================== */

        this.svg =
            document.getElementById(
                "networkSvg"
            );

        this.nodeLayer =
            document.getElementById(
                "nodeLayer"
            );

        this.packetLayer =
            document.getElementById(
                "packetLayer"
            );

        this.collisionIndicator =
            document.getElementById(
                "collisionIndicator"
            );

        this.successIndicator =
            document.getElementById(
                "successIndicator"
            );

        this.channelLine =
            document.getElementById(
                "channelLine"
            );


        /* =====================================================
           UI ELEMENTS
        ====================================================== */

        this.channelStatus =
            document.getElementById(
                "channelStatus"
            );

        this.nodeStatusContainer =
            document.getElementById(
                "nodeStatusContainer"
            );


        /* =====================================================
           VISUALIZATION STATE
        ====================================================== */

        this.nodes = [];

        this.nodeElements = new Map();

        this.packetElements = new Map();

        this.animations = new Map();

        this.nextPacketId = 1;


        /* =====================================================
           SVG DIMENSIONS
        ====================================================== */

        this.svgWidth = 1000;

        this.svgHeight = 500;

        this.channelY = 250;

        this.channelStartX = 180;

        this.channelEndX = 820;


        /* =====================================================
           NODE POSITIONING
        ====================================================== */

        this.nodeLeftX = 120;

        this.nodeRightX = 880;


        /* =====================================================
           COLORS
        ====================================================== */

        this.stateColors = {

            IDLE: "#64748b",

            SENSING: "#2563eb",

            WAITING: "#7c3aed",

            TRANSMITTING: "#16a34a",

            COLLISION: "#dc2626",

            BACKOFF: "#d97706",

            SUCCESS: "#16a34a"
        };
    }


    /* =========================================================
       INITIALIZATION
       ========================================================= */

    /**
     * Initialize the visualization.
     *
     * @param {Array} nodes
     */
    initialize(nodes = []) {

        this.nodes = Array.isArray(nodes)
            ? nodes
            : [];


        this.clearNetwork();

        this.renderNodes(
            this.nodes
        );

        this.updateNodeStatusCards(
            this.nodes
        );

        this.setChannelStatus(
            "IDLE"
        );
    }


    /* =========================================================
       NETWORK CLEARING
       ========================================================= */

    /**
     * Clear all visual network objects.
     */
    clearNetwork() {

        if (this.nodeLayer) {

            this.nodeLayer.innerHTML = "";
        }


        if (this.packetLayer) {

            this.packetLayer.innerHTML = "";
        }


        this.nodeElements.clear();

        this.packetElements.clear();


        for (
            const animation
            of this.animations.values()
        ) {

            if (
                animation &&
                typeof animation.cancel ===
                "function"
            ) {

                animation.cancel();
            }
        }


        this.animations.clear();


        this.hideCollision();

        this.hideSuccess();
    }


    /* =========================================================
       NODE CREATION
       ========================================================= */

    /**
     * Render all nodes.
     *
     * @param {Array} nodes
     */
    renderNodes(nodes = []) {

        if (!this.nodeLayer) {

            return;
        }


        this.nodeLayer.innerHTML = "";

        this.nodeElements.clear();


        const count =
            nodes.length;


        if (count <= 0) {

            return;
        }


        /*
         * Arrange nodes vertically around the
         * shared channel.
         */
        const topY = 80;

        const bottomY = 420;

        const usableHeight =
            bottomY - topY;


        nodes.forEach(
            (node, index) => {

                const y =
                    count === 1
                        ? this.channelY
                        : topY +
                          (
                              usableHeight /
                              (count - 1)
                          ) *
                          index;


                /*
                 * Alternate nodes between
                 * left and right sides.
                 */
                const isLeft =
                    index % 2 === 0;


                const x =
                    isLeft
                        ? this.nodeLeftX
                        : this.nodeRightX;


                node.x = x;

                node.y = y;


                const element =
                    this.createNodeElement(
                        node
                    );


                this.nodeLayer.appendChild(
                    element
                );


                this.nodeElements.set(
                    node.id,
                    element
                );
            }
        );
    }


    /**
     * Create SVG elements for one node.
     *
     * @param {Object} node
     * @returns {SVGGElement}
     */
    createNodeElement(node) {

        const group =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "g"
            );


        group.classList.add(
            "network-node"
        );


        group.setAttribute(
            "data-node-id",
            node.id
        );


        /*
         * Connection line from node to channel.
         */
        const connection =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "line"
            );


        connection.setAttribute(
            "x1",
            node.x
        );


        connection.setAttribute(
            "y1",
            node.y
        );


        connection.setAttribute(
            "x2",
            this.getChannelX(node)
        );


        connection.setAttribute(
            "y2",
            this.channelY
        );


        connection.setAttribute(
            "class",
            "node-connection"
        );


        connection.style.stroke =
            "#cbd5e1";


        connection.style.strokeWidth =
            "3";


        group.appendChild(
            connection
        );


        /*
         * Node circle.
         */
        const circle =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            );


        circle.setAttribute(
            "cx",
            node.x
        );


        circle.setAttribute(
            "cy",
            node.y
        );


        circle.setAttribute(
            "r",
            "27"
        );


        circle.setAttribute(
            "class",
            "node-circle node-idle"
        );


        group.appendChild(
            circle
        );


        /*
         * Node name.
         */
        const label =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );


        label.setAttribute(
            "x",
            node.x
        );


        label.setAttribute(
            "y",
            node.y + 48
        );


        label.setAttribute(
            "text-anchor",
            "middle"
        );


        label.setAttribute(
            "class",
            "node-label"
        );


        label.textContent =
            node.name ||
            `Node ${node.id}`;


        group.appendChild(
            label
        );


        /*
         * Node state.
         */
        const status =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "text"
            );


        status.setAttribute(
            "x",
            node.x
        );


        status.setAttribute(
            "y",
            node.y + 64
        );


        status.setAttribute(
            "text-anchor",
            "middle"
        );


        status.setAttribute(
            "class",
            "node-status-text"
        );


        status.textContent =
            "IDLE";


        group.appendChild(
            status
        );


        /*
         * Store references directly on SVG group.
         */
        group.circleElement =
            circle;

        group.statusElement =
            status;

        group.connectionElement =
            connection;


        return group;
    }


    /**
     * Get the X coordinate where a node
     * connects to the shared channel.
     *
     * @param {Object} node
     * @returns {number}
     */
    getChannelX(node) {

        if (
            node.x <
            this.svgWidth / 2
        ) {

            return this.channelStartX;
        }


        return this.channelEndX;
    }


    /* =========================================================
       NODE STATE UPDATES
       ========================================================= */

    /**
     * Update the visual state of one node.
     *
     * @param {Object} node
     */
    updateNode(node) {

        if (!node) {

            return;
        }


        const element =
            this.nodeElements.get(
                node.id
            );


        if (!element) {

            return;
        }


        const circle =
            element.circleElement;


        const status =
            element.statusElement;


        if (!circle || !status) {

            return;
        }


        /*
         * Remove previous state classes.
         */
        circle.classList.remove(
            "node-idle",
            "node-sensing",
            "node-transmitting",
            "node-collision",
            "node-backoff",
            "node-success"
        );


        /*
         * Add state-specific class.
         */
        switch (node.state) {

            case "SENSING":

                circle.classList.add(
                    "node-sensing"
                );

                break;


            case "WAITING":

                circle.classList.add(
                    "node-backoff"
                );

                break;


            case "TRANSMITTING":

                circle.classList.add(
                    "node-transmitting"
                );

                break;


            case "COLLISION":

                circle.classList.add(
                    "node-collision"
                );

                break;


            case "BACKOFF":

                circle.classList.add(
                    "node-backoff"
                );

                break;


            case "SUCCESS":

                circle.classList.add(
                    "node-success"
                );

                break;


            case "IDLE":

            default:

                circle.classList.add(
                    "node-idle"
                );

                break;
        }


        /*
         * Display the state.
         */
        let stateText =
            node.state || "IDLE";


        if (
            node.state ===
            "BACKOFF"
        ) {

            stateText =
                `BACKOFF (${Math.max(
                    0,
                    node.backoffCounter || 0
                )})`;
        }


        status.textContent =
            stateText;


        /*
         * Slightly enlarge active nodes.
         */
        if (
            node.state ===
            "TRANSMITTING"
        ) {

            circle.setAttribute(
                "r",
                "31"
            );

        } else {

            circle.setAttribute(
                "r",
                "27"
            );
        }
    }


    /**
     * Update all nodes.
     *
     * @param {Array} nodes
     */
    updateNodes(nodes = []) {

        if (!Array.isArray(nodes)) {

            return;
        }


        this.nodes = nodes;


        for (
            const node
            of nodes
        ) {

            this.updateNode(
                node
            );
        }


        this.updateNodeStatusCards(
            nodes
        );
    }


    /* =========================================================
       NODE STATUS CARDS
       ========================================================= */

    /**
     * Create/update the node status cards below
     * the network visualization.
     *
     * @param {Array} nodes
     */
    updateNodeStatusCards(
        nodes = []
    ) {

        if (!this.nodeStatusContainer) {

            return;
        }


        this.nodeStatusContainer.innerHTML = "";


        if (!Array.isArray(nodes)) {

            return;
        }


        for (
            const node
            of nodes
        ) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "node-status-card";


            /*
             * Add state-specific class.
             */
            switch (node.state) {

                case "TRANSMITTING":

                    card.classList.add(
                        "transmitting"
                    );

                    break;


                case "COLLISION":

                    card.classList.add(
                        "collision"
                    );

                    break;


                case "BACKOFF":

                    card.classList.add(
                        "backoff"
                    );

                    break;


                case "SENSING":

                case "WAITING":

                    card.classList.add(
                        "active"
                    );

                    break;


                default:

                    break;
            }


            const name =
                document.createElement(
                    "span"
                );


            name.className =
                "node-name";


            name.textContent =
                node.name ||
                `Node ${node.id}`;


            const state =
                document.createElement(
                    "span"
                );


            state.className =
                "node-state";


            let stateText =
                node.state ||
                "IDLE";


            if (
                node.state ===
                "BACKOFF"
            ) {

                stateText =
                    `Backoff: ${
                        Math.max(
                            0,
                            node.backoffCounter || 0
                        )
                    } slots`;
            }


            state.textContent =
                stateText;


            card.appendChild(
                name
            );


            card.appendChild(
                state
            );


            this.nodeStatusContainer.appendChild(
                card
            );
        }
    }


    /* =========================================================
       PACKET CREATION
       ========================================================= */

    /**
     * Create a packet visual for a node.
     *
     * @param {Object} node
     * @param {string} protocol
     * @returns {Object|null}
     */
    createPacket(
        node,
        protocol = "CSMA/CD"
    ) {

        if (
            !node ||
            !this.packetLayer
        ) {

            return null;
        }


        const packetId =
            this.nextPacketId++;


        const packet =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "rect"
            );


        packet.setAttribute(
            "width",
            "38"
        );


        packet.setAttribute(
            "height",
            "20"
        );


        packet.setAttribute(
            "rx",
            "5"
        );


        packet.setAttribute(
            "ry",
            "5"
        );


        packet.classList.add(
            "packet"
        );


        if (
            String(protocol)
                .toUpperCase()
                .includes("CA")
        ) {

            packet.classList.add(
                "packet-ca"
            );

        } else {

            packet.classList.add(
                "packet-cd"
            );
        }


        const startX =
            node.x;


        const startY =
            node.y;


        packet.setAttribute(
            "x",
            startX - 19
        );


        packet.setAttribute(
            "y",
            startY - 10
        );


        packet.dataset.packetId =
            packetId;


        packet.dataset.nodeId =
            node.id;


        this.packetLayer.appendChild(
            packet
        );


        this.packetElements.set(
            packetId,
            packet
        );


        return {
            id: packetId,
            element: packet,
            nodeId: node.id
        };
    }


    /* =========================================================
       PACKET ANIMATION
       ========================================================= */

    /**
     * Animate a packet from a node to the
     * shared channel.
     *
     * @param {Object} node
     * @param {string} protocol
     * @param {number} duration
     * @returns {Promise}
     */
    animatePacketToChannel(
        node,
        protocol = "CSMA/CD",
        duration = 700
    ) {

        const packet =
            this.createPacket(
                node,
                protocol
            );


        if (!packet) {

            return Promise.resolve();
        }


        const element =
            packet.element;


        const startX =
            node.x;


        const startY =
            node.y;


        const targetX =
            this.getChannelX(
                node
            );


        const targetY =
            this.channelY;


        const startTime =
            performance.now();


        return new Promise(
            resolve => {

                const animate =
                    currentTime => {

                        const elapsed =
                            currentTime -
                            startTime;


                        const progress =
                            Math.min(
                                1,
                                elapsed /
                                Math.max(
                                    1,
                                    duration
                                )
                            );


                        /*
                         * Smooth easing.
                         */
                        const eased =
                            1 -
                            Math.pow(
                                1 - progress,
                                3
                            );


                        const x =
                            startX +
                            (
                                targetX -
                                startX
                            ) *
                            eased;


                        const y =
                            startY +
                            (
                                targetY -
                                startY
                            ) *
                            eased;


                        element.setAttribute(
                            "x",
                            x - 19
                        );


                        element.setAttribute(
                            "y",
                            y - 10
                        );


                        if (
                            progress < 1
                        ) {

                            const frame =
                                requestAnimationFrame(
                                    animate
                                );


                            this.animations.set(
                                packet.id,
                                {
                                    frame
                                }
                            );

                        } else {

                            this.animations.delete(
                                packet.id
                            );


                            resolve();
                        }
                    };


                requestAnimationFrame(
                    animate
                );
            }
        );
    }


    /**
     * Animate a packet from the channel
     * to the receiving node.
     *
     * @param {Object} node
     * @param {number} duration
     * @returns {Promise}
     */
    animatePacketFromChannel(
        node,
        duration = 700
    ) {

        if (!node) {

            return Promise.resolve();
        }


        const packet =
            this.createPacket(
                node,
                "CSMA/CD"
            );


        if (!packet) {

            return Promise.resolve();
        }


        const element =
            packet.element;


        const startX =
            this.getChannelX(
                node
            );


        const startY =
            this.channelY;


        const targetX =
            node.x;


        const targetY =
            node.y;


        const startTime =
            performance.now();


        return new Promise(
            resolve => {

                const animate =
                    currentTime => {

                        const elapsed =
                            currentTime -
                            startTime;


                        const progress =
                            Math.min(
                                1,
                                elapsed /
                                Math.max(
                                    1,
                                    duration
                                )
                            );


                        const eased =
                            1 -
                            Math.pow(
                                1 - progress,
                                3
                            );


                        const x =
                            startX +
                            (
                                targetX -
                                startX
                            ) *
                            eased;


                        const y =
                            startY +
                            (
                                targetY -
                                startY
                            ) *
                            eased;


                        element.setAttribute(
                            "x",
                            x - 19
                        );


                        element.setAttribute(
                            "y",
                            y - 10
                        );


                        if (
                            progress < 1
                        ) {

                            requestAnimationFrame(
                                animate
                            );

                        } else {

                            this.removePacket(
                                packet.id
                            );


                            resolve();
                        }
                    };


                requestAnimationFrame(
                    animate
                );
            }
        );
    }


    /**
     * Remove a packet visual.
     *
     * @param {number} packetId
     */
    removePacket(packetId) {

        const packet =
            this.packetElements.get(
                packetId
            );


        if (!packet) {

            return;
        }


        packet.remove();


        this.packetElements.delete(
            packetId
        );


        this.animations.delete(
            packetId
        );
    }


    /**
     * Remove all packet visuals.
     */
    clearPackets() {

        if (this.packetLayer) {

            this.packetLayer.innerHTML = "";
        }


        this.packetElements.clear();


        this.animations.clear();
    }


    /* =========================================================
       CHANNEL STATUS
       ========================================================= */

    /**
     * Update the channel status indicator.
     *
     * @param {string} state
     */
    setChannelStatus(
        state = "IDLE"
    ) {

        if (!this.channelStatus) {

            return;
        }


        const normalized =
            String(
                state
            ).toUpperCase();


        this.channelStatus.classList.remove(
            "idle",
            "busy",
            "collision",
            "success"
        );


        switch (normalized) {

            case "BUSY":

            case "TRANSMITTING":

                this.channelStatus.classList.add(
                    "busy"
                );

                this.channelStatus.textContent =
                    "BUSY";

                this.setChannelLineState(
                    "busy"
                );

                break;


            case "COLLISION":

                this.channelStatus.classList.add(
                    "collision"
                );

                this.channelStatus.textContent =
                    "COLLISION";

                this.setChannelLineState(
                    "collision"
                );

                break;


            case "SUCCESS":

                this.channelStatus.classList.add(
                    "success"
                );

                this.channelStatus.textContent =
                    "SUCCESS";

                this.setChannelLineState(
                    "success"
                );

                break;


            case "IDLE":

            default:

                this.channelStatus.classList.add(
                    "idle"
                );

                this.channelStatus.textContent =
                    "IDLE";

                this.setChannelLineState(
                    "idle"
                );

                break;
        }
    }


    /**
     * Change the visual state of the channel line.
     *
     * @param {string} state
     */
    setChannelLineState(state) {

        if (!this.channelLine) {

            return;
        }


        this.channelLine.classList.remove(
            "busy"
        );


        switch (
            String(
                state
            ).toLowerCase()
        ) {

            case "busy":

                this.channelLine.classList.add(
                    "busy"
                );

                this.channelLine.style.stroke =
                    "#d97706";

                break;


            case "collision":

                this.channelLine.classList.add(
                    "busy"
                );

                this.channelLine.style.stroke =
                    "#dc2626";

                break;


            case "success":

                this.channelLine.style.stroke =
                    "#16a34a";

                break;


            case "idle":

            default:

                this.channelLine.style.stroke =
                    "#64748b";

                break;
        }
    }


    /* =========================================================
       COLLISION DISPLAY
       ========================================================= */

    /**
     * Show the collision indicator.
     */
    showCollision() {

        if (!this.collisionIndicator) {

            return;
        }


        this.collisionIndicator.setAttribute(
            "visibility",
            "visible"
        );


        this.collisionIndicator.classList.add(
            "visible"
        );


        this.setChannelStatus(
            "COLLISION"
        );
    }


    /**
     * Hide the collision indicator.
     */
    hideCollision() {

        if (!this.collisionIndicator) {

            return;
        }


        this.collisionIndicator.setAttribute(
            "visibility",
            "hidden"
        );


        this.collisionIndicator.classList.remove(
            "visible"
        );
    }


    /* =========================================================
       SUCCESS DISPLAY
       ========================================================= */

    /**
     * Show the successful transmission indicator.
     */
    showSuccess() {

        if (!this.successIndicator) {

            return;
        }


        this.successIndicator.setAttribute(
            "visibility",
            "visible"
        );


        this.successIndicator.classList.add(
            "visible"
        );


        this.setChannelStatus(
            "SUCCESS"
        );


        /*
         * Automatically hide after a short time.
         */
        window.setTimeout(
            () => {

                this.hideSuccess();

            },
            700
        );
    }


    /**
     * Hide the successful transmission indicator.
     */
    hideSuccess() {

        if (!this.successIndicator) {

            return;
        }


        this.successIndicator.setAttribute(
            "visibility",
            "hidden"
        );


        this.successIndicator.classList.remove(
            "visible"
        );
    }


    /* =========================================================
       VISUAL EVENT HANDLERS
       ========================================================= */

    /**
     * Handle a channel collision.
     *
     * @param {Array} nodes
     */
    handleCollision(nodes = []) {

        this.showCollision();


        if (Array.isArray(nodes)) {

            for (
                const node
                of nodes
            ) {

                this.updateNode(
                    node
                );
            }


            this.updateNodeStatusCards(
                this.nodes
            );
        }


        /*
         * Hide collision after a short period.
         */
        window.setTimeout(
            () => {

                this.hideCollision();

            },
            1000
        );
    }


    /**
     * Handle successful transmission.
     *
     * @param {Object} node
     */
    handleSuccess(node) {

        this.hideCollision();

        this.showSuccess();


        if (node) {

            this.updateNode(
                node
            );
        }


        this.updateNodeStatusCards(
            this.nodes
        );
    }


    /* =========================================================
       COMPLETE VISUALIZATION UPDATE
       ========================================================= */

    /**
     * Update the complete visualization.
     *
     * @param {Array} nodes
     * @param {string} channelState
     */
    update(
        nodes = [],
        channelState = "IDLE"
    ) {

        this.nodes =
            Array.isArray(nodes)
                ? nodes
                : [];


        this.updateNodes(
            this.nodes
        );


        this.setChannelStatus(
            channelState
        );
    }


    /* =========================================================
       RESET
       ========================================================= */

    /**
     * Reset the visualization.
     *
     * @param {Array} nodes
     */
    reset(nodes = []) {

        this.clearPackets();

        this.clearNetwork();


        this.nodes =
            Array.isArray(nodes)
                ? nodes
                : [];


        this.renderNodes(
            this.nodes
        );


        this.updateNodeStatusCards(
            this.nodes
        );


        this.setChannelStatus(
            "IDLE"
        );


        this.hideCollision();

        this.hideSuccess();
    }
}