# Dobot Studio Next-Gen Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a production-ready, next-generation Desktop Teaching & Playback studio for Dobot Magician featuring a Microsoft PowerToys Fluent UI, 3D Digital Twin with real-time IK gizmo, QR-connected Mobile Teach Pendant with CNC-grade micro-movement (0.01mm), and a 64-bit Pure-Rust serial driver with virtual simulation.

**Architecture:** A lightweight desktop application using Tauri v2 with a high-performance 64-bit Rust core handling sub-millisecond serial protocol packets (`0xAA 0xAA`), analytical kinematics, and WebSocket telemetry. The frontend is built with React 19, Tailwind CSS, Fluent UI v9 design tokens, and Three.js WebGL for 60fps 3D robot visualization with full lifecycle management (suspend, offload, on-demand render). Supports dual-mode workflow (QuickTeach vs Studio) and dual-format storage (modern `.dobot.json` and legacy `.playback` XML).

**Tech Stack:** 
- Desktop Shell: Tauri v2
- Backend Core: Rust (tokio, tokio-serial, warp/axum, serde, nalgebra)
- Frontend: React 19, TypeScript, Tailwind CSS, Fluent UI v9 (@fluentui/react-components), Lucide-react
- 3D Engine: Three.js, @react-three/fiber, Three TransformControls, Draco/GLTF Loader
- Mobile Pendant: Progressive Web App (PWA) with HTML5 Touch, Web Vibration API, WebSocket client
- Hardware Protocol: Native Dobot 0xAA 0xAA binary packet parser / generator

---

### Task 1: Environment & Toolchain Bootstrapping

**Files:**
- Create: `C:\Users\Administrator\.gemini\antigravity\scratch\dobot-studio-qol\package.json`
- Create: `C:\Users\Administrator\.gemini\antigravity\scratch\dobot-studio-qol\src-tauri\Cargo.toml`
- Create: `C:\Users\Administrator\.gemini\antigravity\scratch\dobot-studio-qol\src-tauri\tauri.conf.json`

**Step 1: Install prerequisite tools via winget / standalone runners**
- Verify or install Node.js (LTS v20+) and Rust toolchain (`rustup-init.exe`)
- Verify `cargo --version` and `node --version`

**Step 2: Initialize Tauri v2 + React project structure**
- Initialize Vite + React + TypeScript in `C:\Users\Administrator\.gemini\antigravity\scratch\dobot-studio-qol\`
- Scaffold `src-tauri` with Tauri v2 dependencies (`tauri`, `tokio`, `tokio-serial`, `serde`, `serde_json`, `warp`)

**Step 3: Verification**
- Run: `cargo check` inside `src-tauri`
- Expected: PASS with clean build

---

### Task 2: Pure-Rust Dobot Serial Protocol Driver

**Files:**
- Create: `src-tauri\src\protocol\packet.rs`
- Create: `src-tauri\src\protocol\codec.rs`
- Create: `src-tauri\src\driver\serial.rs`
- Test: `src-tauri\tests\protocol_test.rs`

**Step 1: Write test for packet serialization and checksum**
```rust
#[test]
fn test_dobot_packet_ptp_checksum() {
    let packet = DobotPacket::new_ptp_cmd(PtpMode::MOVJ, 230.0, 0.0, -10.0, 0.0, true);
    let bytes = packet.to_bytes();
    assert_eq!(bytes[0], 0xAA);
    assert_eq!(bytes[1], 0xAA);
    assert!(DobotPacket::verify_checksum(&bytes));
}
```

**Step 2: Implement packet encoder/decoder and checksum algorithm**
- Header `0xAA 0xAA`, payload length, command ID (PTP: 84, JOG: 73, EndEffector: 60/61/62, I/O: 130-138)
- Checksum: `(256 - sum(bytes[3..]) % 256) & 0xFF`
- Implement async serial stream reader/writer with auto-reconnect on port disconnect

**Step 3: Test and verify**
- Run: `cargo test --test protocol_test`
- Expected: All packet codec tests PASS

---

### Task 3: Analytical 4-DoF Kinematics & Trajectory Engine

**Files:**
- Create: `src-tauri\src\kinematics\inverse.rs`
- Create: `src-tauri\src\kinematics\forward.rs`
- Create: `src-tauri\src\kinematics\workspace.rs`
- Test: `src-tauri\tests\kinematics_test.rs`

**Step 1: Write kinematics verification tests**
```rust
#[test]
fn test_dobot_ik_fk_roundtrip() {
    let target_cartesian = CartesianPose { x: 230.0, y: 50.0, z: -10.0, r: 15.0 };
    let joints = DobotKinematics::inverse(&target_cartesian).expect("Must be reachable");
    let calculated_pose = DobotKinematics::forward(&joints);
    assert!((calculated_pose.x - target_cartesian.x).abs() < 0.01);
    assert!((calculated_pose.y - target_cartesian.y).abs() < 0.01);
    assert!((calculated_pose.z - target_cartesian.z).abs() < 0.01);
}
```

**Step 2: Implement analytical Dobot Magician kinematics**
- Base rotation $J_1 = \text{atan2}(y, x)$
- Planar 2-link trigonometry for $J_2$ (rear arm) and $J_3$ (forearm with mechanical parallelogram linkage)
- End-effector rotation $J_4 = r - J_1$
- Workspace bounding box and spherical envelope validation ($R_{\min} = 150\,\text{mm}$, $R_{\max} = 320\,\text{mm}$, $Z_{\min} = -50\,\text{mm}$, $Z_{\max} = 150\,\text{mm}$)

**Step 3: Test and verify**
- Run: `cargo test --test kinematics_test`
- Expected: All roundtrip and boundary checks PASS

---

### Task 4: Virtual Dobot Simulator & Real-Time Telemetry

**Files:**
- Create: `src-tauri\src\simulator\virtual_robot.rs`
- Create: `src-tauri\src\simulator\telemetry_stream.rs`

**Step 1: Implement Virtual Robot state machine**
- Tracks current $X, Y, Z, R$ and $J_1, J_2, J_3, J_4$
- Simulates execution queue with velocity profiles (MOVJ, MOVL, JUMP, CP, ARC)
- Simulates Suction Cup, Gripper, and Digital I/O states

**Step 2: Telemetry event bus**
- Streams robot pose at 50Hz via Tauri events (`emit("robot:telemetry", ...)` and WebSocket)
- Seamless auto-switch: When hardware COM port is detected, stream live telemetry; when disconnected, fallback to Virtual Simulator immediately

---

### Task 5: Mobile Wireless Teach Pendant & WebSocket Server

**Files:**
- Create: `src-tauri\src\server\pendant_server.rs`
- Create: `src\mobile\pendant.html`
- Create: `src\mobile\pendant.ts`

**Step 1: Implement embedded HTTP/WebSocket server in Rust**
- Serves standalone single-page PWA on port 9876
- WebSocket endpoint `/ws` with heartbeat ping/pong (200ms timeout watchdog)
- Generates QR code PNG for desktop display (`http://<local-ip>:9876/`)

**Step 2: Implement Mobile PWA Interface**
- Touch Jog Pad with axis selection (Cartesian X/Y/Z/R and Joint J1-J4)
- Virtual CNC MPG Handwheel with touch-wheel rotation and Web Vibration Haptic API (0.01mm, 0.1mm, 1.0mm)
- Gyroscope Tilt jog with deadman safety button
- Giant red Emergency Stop button and `+ Save Point` button

---

### Task 6: Windows 11 Fluent UI Desktop Shell (QuickTeach vs Studio)

**Files:**
- Create: `src\components\TitleBar.tsx`
- Create: `src\components\Sidebar.tsx`
- Create: `src\components\StatusBar.tsx`
- Create: `src\views\QuickTeachView.tsx`
- Create: `src\views\StudioView.tsx`
- Create: `src\context\RobotContext.tsx`

**Step 1: Setup Fluent UI layout with Windows 11 theme**
- Native-like TitleBar with Mica backdrop and mode switch (`QuickTeach ⟷ Studio`)
- QuickTeach: Single unified view with 3D viewport, full Jog control panel, and Waypoint cards
- Studio: Multi-panel resizable layout with 3D viewport, Sequence Timeline block editor, Data Grid table, and Script drawer

---

### Task 7: 3D Digital Twin Viewport & Lifecycle Management

**Files:**
- Create: `src\components\viewport3d\DigitalTwin.tsx`
- Create: `src\components\viewport3d\RobotModel.tsx`
- Create: `src\components\viewport3d\TransformGizmo.tsx`
- Create: `src\components\viewport3d\WorkspaceEnvelope.tsx`

**Step 1: Build 3D Robot visualization in Three.js**
- Kinematic bone hierarchy for Dobot Magician (Base, J1, J2, J3, End-effector)
- 3D Interactive Transform Gizmo (XYZ arrows + R ring) at end effector with real-time IK update
- Reachable Workspace translucent dome with collision limit feedback

**Step 2: Implement Viewport Lifecycle & Extreme Optimization**
- Hover-reveal collapse arrow (`◀`) next to tab to close and offload 3D viewport
- State machine: Active (60fps) $\to$ Suspended (stop loop, keep mesh) $\to$ Offloaded (destroy WebGLRenderer & textures, 100% VRAM release) $\to$ Disabled (code-split)
- Render-on-demand: Freeze animation loop during idle periods (reduces GPU load to < 1%)

---

### Task 8: Comprehensive Jog Control Panel

**Files:**
- Create: `src\components\jog\JogPanel.tsx`
- Create: `src\components\jog\AxisSelector.tsx`
- Create: `src\components\jog\StepSelector.tsx`

**Step 1: Build the complete Jog Control panel**
- Coordinate Mode: Cartesian (X, Y, Z, R) ⟷ Joint (J1, J2, J3, J4)
- Large `◄ −` and `+ ►` action buttons
- 5 Step Sizes: `0.01 mm` (Micro), `0.1 mm`, `1.0 mm`, `10 mm`, `Continuous`
- Dual Speed (1-100%) and Acceleration (1-100%) sliders with live numeric readout
- Motion Types: MOVJ, MOVL, JUMP, CP, ARC
- "โหมดการใช้งาน" (Tool Action per Waypoint) dropdown: None, Suction Cup (On/Off), Gripper (Open/Close), Laser, EIO
- Pause Time input (seconds)

---

### Task 9: Waypoint Management, History & Sequence Timeline

**Files:**
- Create: `src\components\waypoints\WaypointCard.tsx`
- Create: `src\components\waypoints\WaypointGrid.tsx`
- Create: `src\components\sequence\SequenceTimeline.tsx`
- Create: `src\state\undoStack.ts`

**Step 1: Waypoint Data Model & Undo/Redo**
- Unlimited undo stack with `Ctrl+Z` / `Ctrl+Y`
- Waypoint attributes: ID, Label, X, Y, Z, R, J1-J4, MotionStyle, PauseTime, **โหมดการใช้งาน (Tool Action)**, Trigger/Condition
- QuickTeach mode: Drag-and-drop card stack with inline editing
- Studio mode: Visual block timeline + spreadsheet-style Data Grid with batch editing

---

### Task 10: File Management & Dobot Studio 1.9.4 Legacy Interop

**Files:**
- Create: `src-tauri\src\storage\project_json.rs`
- Create: `src-tauri\src\storage\legacy_xml.rs`
- Create: `src-tauri\src\storage\python_exporter.rs`
- Test: `src-tauri\tests\storage_test.rs`

**Step 1: Test 2-way conversion with Dobot Studio 1.9.4 files**
- Test reading `Example_UsingPlaybackPointsInScript.playback` XML structure
- Test writing identical XML format
- Test export to standalone executable Python script (`dobot_script.py`)

**Step 2: Implement storage parsers**
- Modern format: `.dobot.json` with metadata, settings, waypoints, subroutines
- Legacy converter: 1-Click Import/Export `.playback` XML
- Auto-save to `.autosave/` directory every 30 seconds

---

### Task 11: Production Verification & Release Packaging

**Files:**
- Create: `src-tauri\build.rs`
- Create: `scripts\build-release.ps1`

**Step 1: End-to-end workflow verification**
- Test QuickTeach workflow: Connect $\to$ Jog (XYZ and Joint) $\to$ 0.01mm micro-move $\to$ Set "โหมดการใช้งาน" $\to$ Add 5 waypoints $\to$ Undo/Redo $\to$ Playback in Virtual Simulator $\to$ Export `.playback` $\to$ Re-import in Dobot Studio 1.9.4
- Test Mobile Teach Pendant: Open QR $\to$ Connect WebSocket $\to$ Jog arm from phone $\to$ E-Stop verification

**Step 2: Windows Production Binary Build**
- Run `npm run tauri build` to produce clean standalone `.exe` (under 20MB)
- Create Desktop Shortcut "Dobot Studio Next-Gen"
