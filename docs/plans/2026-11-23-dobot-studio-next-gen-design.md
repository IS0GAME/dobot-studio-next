# Dobot Studio Next-Gen — Full Design Document

**Date:** 2026-11-23
**Status:** Pending Approval
**Target:** Production-Ready Teaching & Playback Application for Dobot Magician
**Predecessor:** Dobot Studio 1.9.4 (PyInstaller + Python 3.5 + PyQt5 + DobotDll.dll)

---

## 1. Executive Summary

สร้างแอปพลิเคชัน Desktop ใหม่ทั้งหมดเพื่อแทนที่ Dobot Studio 1.9.4 โดยเน้น Teaching & Playback Mode ให้ได้มาตรฐาน UX/UI ระดับ Foxglove Studio / ABB RobotStudio / Microsoft PowerToys พร้อมระบบ 3D Digital Twin, Mobile Wireless Pendant, และ Pure-Rust Hardware Driver ที่ไม่ขึ้นกับ DobotDll.dll 32-bit โบราณ

### ปัญหาของ Dobot Studio 1.9.4 ที่แก้ไข:

| ปัญหา | สาเหตุ | วิธีแก้ในเวอร์ชันใหม่ |
|---|---|---|
| Crash ตอนเปิด (`FileExistsError`) | `os.makedirs` ไม่มี `exist_ok` | ไม่มีปัญหา — สร้างใหม่ทั้งหมด |
| UI เบลอบน High-DPI | ไม่มี DPI Manifest | Tauri v2 รองรับ PerMonitorV2 โดย Default |
| เปิดช้า 5-10 วิ (Splash Screen) | BootProgram WebEngine เช็ค Update เซิร์ฟเวอร์จีน | ไม่มี Splash — เปิดทันที < 1 วินาที |
| Working Directory Sensitivity | python35.dll หาไม่เจอ | Self-contained Rust binary — ไม่มี DLL dependency |
| 32-bit x86 บน Windows 11 64-bit | PyInstaller 3.x + Python 3.5 32-bit | Rust 64-bit Native |
| UI ล้าสมัย (PyQt5 2017) | Qt 5.10.1 | React + Fluent UI v9 (Windows 11 Mica/Acrylic) |
| ไม่มี 3D Visualization | — | Three.js 3D Digital Twin + IK Gizmo |
| ไม่มี Undo/Redo | — | Unlimited Undo Stack |
| ไม่มี Mobile Control | — | QR-Connect Wireless Teach Pendant (PWA) |
| ไม่มี Micro Movement | — | 0.01mm Step + Virtual MPG Wheel |
| Update Checker ทำให้ค้าง | เช็ค URL เซิร์ฟเวอร์ Dobot จีนที่ล่ม | ไม่มี Auto-update checker ภายนอก |

---

## 2. Architecture

### 2.1 Tech Stack

| Layer | Technology | เหตุผล |
|---|---|---|
| **Desktop Shell** | Tauri v2 | ขนาดเล็ก < 20MB, RAM < 60MB, Windows 11 Mica/Acrylic Native |
| **Frontend** | React 19 + Fluent UI v9 + Tailwind CSS | PowerToys-style UX/UI |
| **3D Engine** | Three.js (WebGL) | 60fps Digital Twin, IK Gizmo, Compressed GLTF |
| **Backend** | Rust (Tokio async runtime) | Sub-ms Serial I/O, Zero GC, Memory Safe |
| **Hardware Driver** | Pure-Rust Serial (Protocol 0xAA 0xAA) | 64-bit Native, ไม่ต้องพึ่ง DobotDll.dll 32-bit |
| **Mobile Pendant** | Embedded WebSocket Server (warp/axum) + PWA | QR Code connect, ไม่ต้องติดตั้งแอป |
| **File Format** | `.dobot.json` (Primary) + `.playback` XML (Import/Export) | Modern + Legacy compatible |

### 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (WebView2 / Tauri)                                    │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ 3D Twin  │ │ Jog Control  │ │ Waypoint │ │ Sequence      │  │
│  │ (Three)  │ │ Panel        │ │ Cards/   │ │ Timeline      │  │
│  │          │ │ Axis/Speed/  │ │ Grid     │ │ (Studio only) │  │
│  │          │ │ Acc/Motion   │ │          │ │               │  │
│  └──────────┘ └──────────────┘ └──────────┘ └───────────────┘  │
│                        │  Tauri IPC Commands/Events             │
├────────────────────────┼────────────────────────────────────────┤
│  Backend (Rust)        │                                        │
│  ┌─────────────────────┴──────────────────────────────────────┐ │
│  │  Command Router                                            │ │
│  │  ┌────────────┐ ┌──────────────┐ ┌───────────────────────┐│ │
│  │  │ Kinematics │ │ Trajectory   │ │ Project Manager       ││ │
│  │  │ IK / FK    │ │ Planner      │ │ .dobot.json / .play   ││ │
│  │  │ Singularity│ │ Vel Blending │ │ Undo/Redo Stack       ││ │
│  │  └────────────┘ └──────────────┘ └───────────────────────┘│ │
│  │  ┌────────────────────┐ ┌────────────────────────────────┐│ │
│  │  │ Serial Driver      │ │ Virtual Dobot Simulator        ││ │
│  │  │ 0xAA Protocol      │ │ (Full IK simulation)           ││ │
│  │  │ Auto-detect COM    │ │ Active when no hardware        ││ │
│  │  └─────────┬──────────┘ └────────────────────────────────┘│ │
│  │            │                                               │ │
│  │  ┌─────────┴──────────┐                                   │ │
│  │  │ WebSocket Server   │◄── Mobile Pendant (PWA)           │ │
│  │  │ Port 9876          │    QR Code connect                │ │
│  │  └────────────────────┘                                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
    ┌──────────────────┐
    │ Dobot Magician   │
    │ (USB COM Port)   │
    └──────────────────┘
```

---

## 3. UI/UX Design

### 3.1 Mode System: QuickTeach vs Studio

**หลักการสำคัญ: QuickTeach คือ "Studio ที่จัดหน้าจอให้กระชับ" — ไม่ตัดฟีเจอร์หรือข้อมูลใดๆ ออก**

| ด้าน | QuickTeach | Studio |
|---|---|---|
| ฟีเจอร์ / ข้อมูล | **ครบ 100%** | **ครบ 100%** |
| Layout | Single-view: 3D + Jog + Cards ในจอเดียว | Multi-panel: แยก 3D / Timeline / Grid / Script ที่ resize ได้ |
| Waypoint Display | Card stack (อ่านง่าย) | Data Grid ตาราง (batch edit) + Card view |
| Subroutine/Group | Flat list | Grouping + Loop/Repeat blocks |
| Script Editor | — | Python editor ในตัว |
| History Panel | — (Undo/Redo ยังทำงาน) | Visual History sidebar |
| Command Palette | — | `Ctrl+Shift+P` |
| Velocity Curve | Slider | Bezier curve editor |

### 3.2 Jog Control Panel (ครบทุกโหมด)

องค์ประกอบที่ต้องมีครบทั้ง QuickTeach และ Studio:

- **Coordinate Mode Toggle**: Cartesian (X/Y/Z/R) ⟷ Joint (J1/J2/J3/J4)
- **Axis Selector**: เลือกแกนเดี่ยว → กดปุ่ม ◄− / +► เพื่อเคลื่อน
- **Step Size**: 0.01mm / 0.1mm / 1.0mm / 10mm / Continuous (5 ระดับ)
- **Speed Slider**: 1-100% พร้อมค่าตัวเลข
- **Acceleration Slider**: 1-100% พร้อมค่าตัวเลข
- **Motion Type**: MOVJ / MOVL / JUMP / CP / ARC
- **โหมดการใช้งาน (Operation Mode / Tool Action ต่อ Waypoint)**: มีในแต่ละ Waypoint โดยตรงตามแบบโปรแกรมเดิม (None / Suction Cup [On/Off] / Gripper [Open/Close/Release] / Laser / EIO Custom)
- **Pause After Move**: ตั้งเวลา (วินาที) ต่อ Waypoint

### 3.3 Waypoint Card (ข้อมูลครบ)

แต่ละ Waypoint Card แสดง:
- ลำดับ + ชื่อ (แก้ไข inline ได้)
- พิกัด X, Y, Z, R (หรือ J1-J4)
- Pause Time
- **โหมดการใช้งาน** (Action ประจำจุด: Suction Cup [ดูด/ปล่อย], Gripper [หนีบ/กาง], Laser, หรือ EIO)
- Motion Type (MOVJ/MOVL/...)
- Menu (⋮): Copy, Delete, Insert Before/After, Set Trigger, Set Condition

### 3.4 Windows 11 Fluent Design

- **Mica / Acrylic**: Background effects แบบ PowerToys
- **Rounded Corners**: 8-10px radius
- **Typography**: Segoe UI Variable
- **Dark / Light / System**: Auto-detect + Manual override
- **Navigation**: Sidebar icon bar (เหมือน VS Code compact)

---

## 4. 3D Digital Twin

### 4.1 Features

- **Dobot Magician 3D Model**: GLTF compressed (Draco/Meshopt) < 500KB
- **IK Gizmo**: ลากลูกศร X/Y/Z เพื่อเลื่อนตำแหน่ง Tool → คำนวณ IK ทันที
- **Rotation Ring**: หมุน End Effector (R)
- **Snap to Grid**: กด Shift → Snap ทุก 5mm / 1°
- **Reachable Envelope**: วงกลมโปร่งแสงแสดงขอบเขต
- **Ghost Preview**: Hover ที่ Waypoint → แสดงเงาจางของท่าแขนกลที่จุดนั้น
- **Trajectory Path**: เส้นประแสดงเส้นทางเคลื่อนที่ทั้งหมด

### 4.2 Performance & Lifecycle Management

| ระดับ | สถานะ | พฤติกรรม |
|---|---|---|
| Active | Tab 3D เปิดอยู่ | WebGL 60fps, IK ทำงานเต็ม |
| Suspended | Tab อื่น active | หยุด render loop, ปลด GPU, คง scene ใน RAM |
| Offloaded | ปุ่มลูกศร hover-reveal ◀ กดปิด | ทำลาย renderer + textures ทั้งหมด, คืน VRAM 100% |
| Disabled | Settings → Off | ไม่โหลด Three.js bundle เลย (code-split) |

Optimization:
- Instanced Mesh สำหรับชิ้นส่วนซ้ำ
- LOD (Level of Detail) ตามระยะกล้อง
- Frustum + Occlusion Culling
- Render-on-demand: หยุด render loop เมื่อ idle (ประหยัด GPU ~95%)
- ปุ่มปิด ◀ แบบ hover-reveal ข้าง tab 3D Viewport

---

## 5. Mobile Wireless Teach Pendant

### 5.1 Connection

- Desktop: กด `📱 Connect Pendant` → แสดง QR Code (local URL)
- Mobile: สแกน QR → เปิด PWA ในเบราว์เซอร์ → ไม่ต้องติดตั้งแอป
- Protocol: WebSocket (< 5ms latency บน Local WiFi)

### 5.2 Three Jog Modes on Mobile

**Mode 1 — Touch Jog Pad**
- ปุ่มลูกศร XY + Z+/Z- + R+/R-
- กดค้าง = Continuous Jog
- กดปล่อย = เคลื่อนที่ตาม Step Size
- Axis Selector: X/Y/Z/R หรือ J1-J4

**Mode 2 — Virtual MPG Wheel (CNC Handwheel)**
- เลือกแกน → หมุนนิ้วบนวงล้อ = เคลื่อนแกนนั้น
- Haptic Feedback (สั่น) ทุก detent
- Scale: ×1 (0.01mm) / ×10 (0.1mm) / ×100 (1.0mm)

**Mode 3 — Gyroscope Tilt**
- เอียงมือถือ = แขนกลขยับตาม 1:1
- Deadman Switch: ต้องกดค้างตลอด
- ปรับ Sensitivity / Deadzone ได้

### 5.3 Mobile UI Features
- แสดงพิกัดปัจจุบัน Real-time
- ปุ่ม `+ Save Point` บันทึก Waypoint จากมือถือ
- ปุ่ม `▶ Run` สั่ง Playback จากมือถือ
- ปุ่ม E-Stop แดงใหญ่ที่มุมจอ

---

## 6. Safety (ขอบเขตเหมาะสมกับ Dobot Magician)

ไม่เพิ่ม Safety ระดับ Industrial — ยึดตามขอบเขตเดิมของ Dobot Studio แต่ทำให้มองเห็นง่ายขึ้น:

| Feature | ของเดิม (1.9.4) | ของใหม่ |
|---|---|---|
| E-Stop | ปุ่ม `btnEmerStop` | ปุ่มเดิม + Shortcut `Esc` |
| Workspace Limit | DLL reject ไม่มี visual | 3D Reachable Envelope + Gizmo clamp |
| Speed Limit | Slider 0-100% | เหมือนเดิม + Default 50% ตอน Remote Jog |
| Lost Step Check | Checkbox | คงเดิม |
| Connection Watchdog | ไม่มี | สำหรับ Mobile Pendant: ขาด > 500ms → หยุด Jog |
| PIN Lock | ไม่มี | Optional PIN 4 หลักก่อนเชื่อมต่อ Pendant |

---

## 7. File Format & Interoperability

### 7.1 Primary: `.dobot.json`

```json
{
  "version": "2.0",
  "name": "Pick and Place Demo",
  "created": "2026-11-23T19:30:00+07:00",
  "settings": {
    "motionType": "MOVJ",
    "speedRatio": 80,
    "acceleration": 60,
    "loopCount": 1
  },
  "waypoints": [
    {
      "id": "wp-1",
      "label": "Pick Position",
      "type": "PTP",
      "motionStyle": "MOVJ",
      "coords": { "x": 230.0, "y": 0.0, "z": -10.0, "r": 0.0 },
      "joints": { "j1": 0.0, "j2": 45.2, "j3": 33.1, "j4": 0.0 },
      "pauseTime": 0.5,
      "io": { "suctionCup": true },
      "group": "pick-cycle"
    }
  ],
  "groups": [
    { "id": "pick-cycle", "label": "Pick Cycle", "repeat": 3 }
  ]
}
```

### 7.2 Legacy Interop

- **Import**: `.playback` XML → แปลงเป็น Waypoints อัตโนมัติ
- **Export**: Waypoints → `.playback` XML / Python Script `.py`
- **Auto-save**: ทุก 30 วินาที ลง `.autosave/`

---

## 8. Undo/Redo System

- Unlimited Undo Stack
- `Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z`
- Granularity: 1 action ต่อ 1 drag (ไม่ใช่ทุก frame)
- History Panel (Studio mode): Visual action list
- Persist จนกว่าจะปิดโปรแกรม

---

## 9. Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Play / Pause |
| `Esc` | Emergency Stop |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo |
| `Ctrl+S` / `Ctrl+Shift+S` | Save / Save As |
| `Enter` | Save Current Position as Waypoint |
| `Delete` | Delete Selected Waypoint(s) |
| `Ctrl+D` | Duplicate Waypoint |
| `↑ ↓ ← →` | Jog (เมื่อ Jog Panel มี focus) |
| `Page Up/Down` | Jog Z+/Z- |
| `Home/End` | Jog R+/R- |
| `1 2 3 4 5` | Step Size (0.01/0.1/1/10/Cont) |
| `Ctrl+Shift+P` | Command Palette (Studio) |
| `Ctrl+M` | สลับ QuickTeach ⟷ Studio |
| `Tab` | สลับ Focus |

---

## 10. Sequence Timeline (Studio Mode)

- Block-based visual editor
- Drag & Drop เรียงลำดับ Waypoints
- Multi-select (Shift/Ctrl + Click) → ย้าย/ลบ/คัดลอกหลายจุด
- Right-click: Copy, Paste, Group into Subroutine, Loop Start/End
- คลิกจุด → 3D Ghost Preview
- ดับเบิลคลิก → แก้ไข inline

---

## 11. Settings Panel

### Categories:
- **General**: Theme, Language, Startup Mode, Auto-save Interval
- **3D Viewport**: Enable/Disable, Render Quality (Low/Med/High), Reachable Envelope, Grid, Render-on-demand
- **Robot Connection**: Auto-detect COM, Preferred Port, Baud Rate, Virtual Simulator
- **Jog & Safety**: Default Step, Max Jog Speed, Remote Pendant Speed, E-Stop Shortcut
- **Mobile Pendant**: Enable Server, PIN Lock, Server Port
- **File & Export**: Default Format, Legacy Format, Project Folder

---

## 12. Virtual Dobot Simulator

- จำลองแขนกล Dobot Magician 100% ด้วย Analytical IK
- ทำงานอัตโนมัติเมื่อไม่มีฮาร์ดแวร์เชื่อมต่อ
- สามารถทดสอบ: เขียนคำสั่ง, จำลอง Playback, Plot Trajectory
- เมื่อเสียบหุ่นจริง → สลับเป็น Hardware Mode แบบ Real-time Telemetry (50Hz)

---

## 13. REA Evidence from Original Dobot Studio 1.9.4

### Binary Analysis:
- PyInstaller 3.x (Onedir), Python 3.5 32-bit x86
- CArchive Header Offset: 220,160 / PYZ Archive Offset: 238,346
- 982 Python modules extracted from PYZ
- UI Framework: PyQt5 (Qt 5.10.1) + QtWebEngine

### Key Modules Reverse Engineered:
- `Playback.pyc` — 54 methods including `run`, `addDataRow`, `sendDobotPTPCmdByRow`, `SetHandHeldTeachEnabled`
- `Ui_Playback.pyc` — Full widget tree: `cmdList` (QTableWidget), jog buttons, speed/acc controls, EIO1-24
- `Main.pyc` — 60 methods, `initAppMoudleWin` loads: Playback, Draw, Script, Blockly, Mouse, LeapMotion, LaserEngraving
- `DobotStudio.pyc` — Entrypoint: imports `Application`, `Main`, calls `main.show()` + `app.exec_()`

### Hardware Protocol (from DobotDll.dll analysis):
- Serial: 0xAA 0xAA header + Command ID + Payload + Checksum
- Commands: PTP, JOG, CP, ARC, Home, Get/Set EndEffector, Get/Set IO
- Baud: 115200, 8N1

### Playback File Format (`.playback`):
- XML: `<root><row_StudioVersion>Ver-170</...><row0><item_0>MotionStyle</item_0><item_1>Name</item_1><item_2>X</item_2><item_3>Y</item_3><item_4>Z</item_4><item_5>R</item_5>...`
- Columns: MotionStyle, Name, X, Y, Z, R, PauseTime, Gripper, SuctionCup, EIO1-24, TriggerIO, Condition, Value

---

## Appendix: Mockup

Interactive HTML mockup ของ QuickTeach Mode:
`quickteach-mockup.html` (ในโฟลเดอร์ artifacts)
