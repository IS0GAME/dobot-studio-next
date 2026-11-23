# Dobot Studio Next (Next-Gen Teaching & Playback Suite)

> A modern, high-performance, and production-ready rebuild of **Dobot Studio 1.9.4's Teaching & Playback Mode** for the **Dobot Magician** robotic arm. Built with Windows 11 Fluent UI design principles, pure Rust/TypeScript drivers, 3D Digital Twin simulation, and a wireless mobile CNC MPG teach pendant.

---

## ✨ Key Highlights

- **🎨 Modern Windows 11 Fluent Design:** Designed to match Microsoft PowerToys and Windows 11 standards (Mica/Acrylic glassmorphism, Segoe UI Variable, rounded controls, responsive dark/light theme).
- **⚡ Pure Native Rust & TypeScript Driver:** Completely eliminates legacy Python 3.5 / PyInstaller bottlenecks with a high-throughput binary serial driver (`0xAA 0xAA` packet protocol) running with sub-millisecond latency.
- **🦾 4-DoF Analytical Kinematics Engine:** Full analytical Forward and Inverse Kinematics (FK/IK) engineered specifically for the Dobot Magician's SCARA-like parallel linkage parallelogram structure.
- **🌐 3D Digital Twin Viewport (WebGL):** 60 FPS real-time Three.js simulation. Includes a **hover-reveal collapse arrow (`◀`)** that automatically suspends render loops and returns 100% GPU VRAM to the host system when closed.
- **📱 Wireless Mobile Teach Pendant (CNC MPG Handwheel):** Built-in zero-install PWA (`http://<host-ip>:9876`). Features continuous touch jogging, a virtual CNC MPG rotary handwheel with micro-stepping down to **0.01 mm**, haptic feedback, and a hardware deadman emergency switch.
- **🔄 Two-Way Dobot Studio 1.9.4 Compatibility:** Seamlessly import and export legacy Dobot Studio XML playback files (`.playback`) with full parameter retention, plus export directly to standalone Python scripts.
- **🛡️ Industrial Safety Guards:** Hard-coded physical workspace envelopes ($R \in [140, 330]\,\text{mm}$, $Z \in [-60, 160]\,\text{mm}$), velocity/acceleration ramping, and a 500 ms heartbeat safety watchdog.

---

## 🏗️ Architecture

```
dobot-studio-next/
├── src/                        # Modern Frontend & Simulator (React 19 + TypeScript)
│   ├── components/             # Fluent UI Components (TitleBar, JogPanel, WaypointList, DigitalTwinView)
│   ├── kinematics/             # TypeScript 4-DoF Analytical Kinematics & Envelope Checks
│   ├── protocol/               # TypeScript Dobot Serial Packet Codec (0xAA 0xAA)
│   ├── server/                 # Mobile Pendant HTTP & WebSocket PWA Server (Port 9876)
│   ├── simulator/              # 50Hz Virtual Dobot Simulator with S-Curve Easing
│   ├── storage/                # Legacy .playback XML Converter & Python Exporter
│   └── types/                  # Robot State & Protocol Type Definitions
├── src-tauri/                  # High-Performance Native Backend (Rust)
│   ├── src/kinematics/         # Parallel-Linkage Inverse & Forward Kinematics (Pure Rust)
│   ├── src/protocol/           # High-Throughput Packet Encoder/Decoder & Checksum
│   └── tests/                  # Rust Integration Test Suite
├── tests/                      # Frontend Unit & Integration Tests (Bun Test)
├── docs/plans/                 # Reverse-Engineering Reports, Specs & Implementation Plans
└── scripts/                    # Quick Launch & Service Automation Scripts
```

---

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) (v1.2+)
- [Rust](https://rustup.rs/) (v1.85+)
- GCC / MinGW toolchain (e.g. WinLibs UCRT on Windows)

### 1. Run Development Server
```bash
bun install
bun run dev
```

### 2. Run Test Suite
```bash
# TypeScript / App Unit Tests (12 tests)
bun test

# Rust Core & Kinematics Integration Tests (5 tests)
cd src-tauri
cargo test
```

### 3. Connect Mobile Teach Pendant
1. Ensure your mobile phone is on the same local Wi-Fi network as your PC.
2. Open your mobile browser and navigate to `http://<your-pc-ip>:9876`.
3. Use the **Virtual CNC MPG Dial** to jog individual axes with 0.01mm / 0.1mm / 1.0mm micro-steps or use the touch jog pads.

---

## 📄 License
MIT License. Developed for modern robotics and industrial automation workflows.
