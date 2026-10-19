# CSMA/CD & CSMA/CA Collision Simulator

A web-based Computer Networks project that provides an interactive simulation of two important Medium Access Control (MAC) protocols: **CSMA/CD (Carrier Sense Multiple Access with Collision Detection)** and **CSMA/CA (Carrier Sense Multiple Access with Collision Avoidance)**.

The simulator demonstrates how multiple network nodes compete for access to a shared communication channel and how the two protocols handle channel sensing, transmission, collisions, backoff, retransmission, and successful packet delivery.

---

## 📌 Project Overview

In a shared communication network, multiple devices may attempt to transmit data through the same communication channel. When multiple devices transmit at the same time, channel contention and packet collisions may occur.

This project provides a visual and interactive environment for understanding the behavior of CSMA/CD and CSMA/CA protocols.

The simulator allows users to:

- Configure the number of network nodes.
- Select CSMA/CD or CSMA/CA.
- Control the traffic level.
- Control simulation speed.
- Observe node states in real time.
- Visualize packet transmission.
- Observe channel activity.
- Observe collisions and retransmissions.
- Monitor network performance statistics.
- Compare CSMA/CD and CSMA/CA.

---

## 🎯 Objectives

The main objectives of this project are:

1. To understand the working principle of CSMA/CD.
2. To understand the working principle of CSMA/CA.
3. To simulate multiple nodes sharing a common communication channel.
4. To visualize packet transmission and channel activity.
5. To demonstrate collision detection and collision avoidance.
6. To demonstrate backoff and retransmission mechanisms.
7. To simulate acknowledgement handling in CSMA/CA.
8. To calculate and display network performance statistics.
9. To compare the behavior of CSMA/CD and CSMA/CA.
10. To provide an interactive educational tool for Computer Networks.

---

## 🚀 Features

### Protocol Simulation

- CSMA/CD simulation
- CSMA/CA simulation
- Shared communication channel
- Multiple network nodes
- Random packet generation
- Carrier sensing
- Packet transmission
- Collision detection
- Collision avoidance
- Backoff mechanism
- Retransmission handling
- ACK handling for CSMA/CA

### Network Visualization

The simulator provides a graphical network visualization using SVG.

It displays:

- Network nodes
- Shared communication channel
- Node-to-channel connections
- Packet movement
- Node states
- Channel status
- Collision indicator
- Successful transmission indicator

### Node States

During the simulation, nodes can enter different states:

- `IDLE`
- `SENSING`
- `WAITING`
- `TRANSMITTING`
- `COLLISION`
- `BACKOFF`
- `SUCCESS`

### Real-Time Statistics

The simulator displays:

- Collisions
- Successful transmissions
- Failed transmissions
- Retransmissions
- Throughput
- Average delay
- Channel utilization
- Success rate

### Simulation Controls

Users can configure:

- Protocol
- Number of nodes
- Traffic level
- Simulation speed

The simulator also provides:

- Start
- Pause
- Resume
- Reset

controls.

### Event Log

The event log displays important simulation events in real time, including:

- Packet generation
- Channel state changes
- Transmission events
- Successful transmissions
- Collisions
- Backoff operations
- Retransmissions
- ACK events

---

## 🧠 CSMA/CD

**CSMA/CD** stands for:

**Carrier Sense Multiple Access with Collision Detection**

CSMA/CD is a medium access control protocol in which a node first senses the communication channel before transmitting.

The general process is:

```text
        Sense Channel
             ↓
      Is Channel Free?
        ↙          ↘
      No            Yes
      ↓              ↓
     Wait         Transmit
                     ↓
             Detect Collision
                ↙        ↘
              Yes         No
               ↓           ↓
            Backoff      Success
               ↓
          Retransmit
```

If a collision occurs, the transmitting nodes detect the collision and apply a backoff mechanism before attempting retransmission.

---

## 📡 CSMA/CA

**CSMA/CA** stands for:

**Carrier Sense Multiple Access with Collision Avoidance**

CSMA/CA attempts to reduce the probability of collisions by using a random backoff mechanism before transmission.

The general process is:

```text
        Sense Channel
             ↓
      Is Channel Free?
        ↙          ↘
      No            Yes
      ↓              ↓
     Wait         Backoff
                     ↓
                 Transmit
                     ↓
                    ACK
                 ↙       ↘
              Received   Timeout
                 ↓          ↓
              Success    Backoff
                            ↓
                        Retransmit
```

In the simulator, CSMA/CA also demonstrates acknowledgement handling. If an acknowledgement is not received within the expected time, the node performs another backoff and may retransmit.

---

## ⚙️ Technologies Used

### Frontend Technologies

- HTML5
- CSS3
- JavaScript
- SVG

### Programming Concepts

- Object-Oriented Programming
- ES6 Modules
- Event-driven programming
- State management
- Simulation loops
- Randomized packet generation
- Protocol simulation
- Statistical calculations
- DOM manipulation
- SVG-based visualization

### Development Environment

The project can be executed using:

- Python HTTP Server
- Visual Studio Code
- Live Server
- Any modern web browser

---

## 📂 Project Structure

```text
CSMA-CD-CA-Collision-Simulator/
│
├── index.html
├── style.css
├── README.md
│
└── js/
    ├── app.js
    ├── channel.js
    ├── csma-ca.js
    ├── csma-cd.js
    ├── node.js
    ├── simulation.js
    ├── statistics.js
    └── visualization.js
```

---

## 📄 File Description

### `index.html`

Contains the main user interface of the simulator.

It includes:

- Simulation controls
- Network visualization area
- Node status section
- Statistics section
- Event log
- Protocol information
- Protocol comparison table

### `style.css`

Contains the visual styling and layout of the application.

It controls:

- Page layout
- Colors
- Buttons
- Panels
- Statistics cards
- Network nodes
- Channel appearance
- Animations
- Responsive design

### `js/app.js`

Acts as the main application controller.

It connects:

- User interface
- Simulation engine
- Visualization
- Statistics
- Event log
- User controls

### `js/node.js`

Defines the behavior and state of individual network nodes.

It manages:

- Node ID
- Node state
- Packet generation
- Transmission state
- Backoff counter
- Transmission timing
- Packet information

### `js/channel.js`

Implements the shared communication channel.

It manages:

- Channel state
- Active transmissions
- Channel sensing
- Collision detection
- Successful transmission events
- Channel status

### `js/csma-cd.js`

Contains the CSMA/CD protocol implementation.

It handles:

- Carrier sensing
- Transmission
- Collision detection
- Binary exponential backoff
- Retransmission
- Successful transmission

### `js/csma-ca.js`

Contains the CSMA/CA protocol implementation.

It handles:

- Carrier sensing
- Random backoff
- Transmission
- ACK processing
- ACK timeout
- Retransmission
- Collision avoidance

### `js/simulation.js`

Acts as the main simulation engine.

It connects:

- Network nodes
- Shared channel
- CSMA/CD
- CSMA/CA
- Statistics manager
- Simulation timing

It controls the simulation loop and coordinates the different components of the system.

### `js/statistics.js`

Calculates and maintains simulation statistics.

It tracks:

- Successful transmissions
- Failed transmissions
- Collisions
- Retransmissions
- Average delay
- Throughput
- Channel utilization
- Success rate

### `js/visualization.js`

Handles the graphical representation of the simulation.

It creates and updates:

- Network nodes
- Channel connections
- Packets
- Packet animations
- Node states
- Collision indicators
- Success indicators
- Node status cards
- Channel status

---

## ▶️ Installation and Setup

### Prerequisites

Make sure you have:

- Python installed on your computer
- Visual Studio Code or another code editor
- A modern web browser

No external JavaScript framework or database is required.

---

## ▶️ Running the Project

### Method 1: Python HTTP Server

Open a terminal inside the project directory.

Run:

```bash
python -m http.server 8000
```

The terminal should display a message indicating that the server is running.

Open the following address in your browser:

```text
http://localhost:8000
```

The simulator should now be displayed.

---

### Method 2: VS Code Live Server

1. Open the project folder in Visual Studio Code.
2. Install the **Live Server** extension.
3. Open `index.html`.
4. Right-click the file.
5. Select **Open with Live Server**.
6. The simulator will open in your default browser.

---

## 🖥️ How to Use the Simulator

### Step 1: Select the Protocol

Select either:

```text
CSMA/CD
```

or:

```text
CSMA/CA
```

from the Protocol dropdown.

### Step 2: Select the Number of Nodes

Choose the required number of network nodes.

The simulator supports:

```text
2 – 20 nodes
```

### Step 3: Select Traffic Level

Choose one of the available traffic levels:

- Low
- Medium
- High

Higher traffic results in more packet generation and increased channel contention.

### Step 4: Select Simulation Speed

Choose:

- Slow
- Normal
- Fast

This controls the speed at which the simulation progresses.

### Step 5: Start the Simulation

Click:

```text
▶ Start Simulation
```

The network nodes will begin generating packets and attempting transmission.

### Step 6: Observe Network Activity

During the simulation, observe:

- Node states
- Packet movement
- Channel state
- Transmission activity
- Successful transmissions
- Collisions
- Backoff operations
- Retransmissions

### Step 7: Pause or Reset

Use:

```text
⏸ Pause
```

to temporarily stop the simulation.

Use:

```text
↻ Reset
```

to reset the simulation and statistics.

---

## 📊 Performance Metrics

The simulator provides several performance metrics.

### Collisions

Number of collision events detected during the simulation.

### Successful Transmissions

Number of packets that were successfully transmitted.

### Failed Transmissions

Number of transmissions that failed.

### Retransmissions

Number of times packets were retransmitted after collision or failure.

### Throughput

Represents the amount of successful transmission achieved during the simulation over time.

### Average Delay

Represents the average time required for successful packet transmission.

### Channel Utilization

Represents the percentage of simulation time during which the communication channel was actively used.

### Success Rate

Represents the percentage of completed transmission attempts that were successful.

---

## 📊 Protocol Comparison

The simulator can be used to compare CSMA/CD and CSMA/CA.

| Metric | CSMA/CD | CSMA/CA |
|---|---|---|
| Collision Handling | Collision Detection | Collision Avoidance |
| Carrier Sensing | Yes | Yes |
| Backoff | Yes | Yes |
| Retransmission | Yes | Yes |
| Acknowledgement | Not normally required | Used |
| Typical Environment | Wired Ethernet | Wireless Networks |
| Collision Detection | Yes | No |
| Collision Avoidance | No | Yes |
| Channel Utilization | Measured | Measured |
| Average Delay | Measured | Measured |
| Success Rate | Measured | Measured |
| Throughput | Measured | Measured |

The exact simulation results depend on:

- Number of nodes
- Traffic level
- Simulation speed
- Random packet generation
- Network contention
- Protocol behavior

---

## 📈 Expected Observations

### Low Traffic

Under low traffic conditions:

- Fewer packets are generated.
- Channel contention is relatively low.
- Collisions are less likely.
- Nodes generally experience less waiting.
- Successful transmissions are more likely.

### Medium Traffic

Under medium traffic conditions:

- More transmission attempts occur.
- Channel utilization increases.
- More nodes compete for channel access.
- Waiting and backoff operations become more visible.

### High Traffic

Under high traffic conditions:

- Channel contention increases.
- More simultaneous transmission attempts may occur.
- Collision probability can increase.
- Backoff operations become more frequent.
- Retransmissions may increase.
- Average delay may increase.

These observations demonstrate how network traffic affects MAC protocol performance.

---

## 🧪 Testing

The simulator can be tested using different combinations of:

```text
Protocol:
CSMA/CD
CSMA/CA

Number of Nodes:
2 – 20

Traffic Level:
Low
Medium
High

Simulation Speed:
Slow
Normal
Fast
```

For a meaningful comparison between CSMA/CD and CSMA/CA, use the same:

- Number of nodes
- Traffic level
- Simulation duration
- Simulation speed

for both protocols.

---

## 🔬 Educational Value

This project provides a visual and interactive way to understand important Computer Networks concepts, including:

- Medium Access Control
- Carrier sensing
- Shared-medium communication
- Collision detection
- Collision avoidance
- Random backoff
- Binary exponential backoff
- Retransmission
- Acknowledgements
- Channel utilization
- Transmission delay
- Throughput
- Success rate

The visualization helps connect theoretical networking concepts with practical simulation behavior.

---

## 🎓 Academic Relevance

This project is developed as an academic **Computer Networks project** focusing on Medium Access Control protocols.

It demonstrates the practical implementation of concepts related to the **Data Link Layer**, particularly the MAC sublayer.

The project combines:

- Computer Networks concepts
- JavaScript programming
- Object-oriented design
- Event-driven simulation
- SVG visualization
- Performance measurement

---

## 🔮 Future Enhancements

The following features can be added in future versions:

- Real-time performance graphs
- Historical simulation results
- Export of simulation statistics
- Configurable packet sizes
- Configurable propagation delay
- Configurable collision window
- Detailed throughput graphs
- Advanced protocol comparison
- Additional MAC protocols
- Simulation result reports
- More detailed network configuration
- Data visualization dashboards

These enhancements are optional and are not required for the current version of the simulator.

---

## 🎯 Project Scope

The current project focuses specifically on the simulation and visualization of:

- CSMA/CD
- CSMA/CA
- Shared channel access
- Packet transmission
- Collision handling
- Backoff
- Retransmission
- Network performance statistics

The project is designed primarily for educational and academic demonstration purposes.

---

## 👨‍💻 Project Information

**Project Title:**  
CSMA/CD & CSMA/CA Collision Simulator

**Subject:**  
Computer Networks

**Project Type:**  
Academic Mini Project

**Academic Level:**  
B.Tech – 3rd Year

**Domain:**  
Computer Networks / Data Communication

---

## 📜 Conclusion

The **CSMA/CD & CSMA/CA Collision Simulator** provides an interactive environment for understanding how multiple network nodes compete for access to a shared communication channel.

The project demonstrates important concepts such as carrier sensing, transmission, collision detection, collision avoidance, backoff, retransmission, acknowledgement handling, and network performance measurement.

By providing both graphical visualization and real-time statistics, the simulator makes it easier to understand the practical behavior and performance differences between CSMA/CD and CSMA/CA.

The project can therefore serve as an effective educational tool for studying Medium Access Control protocols in Computer Networks.

---

## ⭐ Keywords

```text
Computer Networks
CSMA/CD
CSMA/CA
Carrier Sense Multiple Access
Collision Detection
Collision Avoidance
MAC Protocol
Medium Access Control
Carrier Sensing
Backoff
Binary Exponential Backoff
Retransmission
Packet Transmission
Network Simulation
Network Visualization
Channel Utilization
Throughput
Transmission Delay
Success Rate
JavaScript
HTML5
CSS3
SVG
```

---

## 📄 License

This project is developed for academic and educational purposes.
