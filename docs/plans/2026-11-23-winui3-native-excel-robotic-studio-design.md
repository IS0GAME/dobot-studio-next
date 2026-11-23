# Architecture Design: Dobot Studio WinUI 3 Native Excel Robotic Studio

- **Date:** 2026-11-23
- **Author:** Antigravity Team & User Collaboration
- **Status:** Approved (via `/grill-me` Interactive Design Interview)
- **Target Platform:** Windows 11 (Windows App SDK 1.6+ / WinUI 3 / C# .NET 8 / Unpackaged)

---

## 1. Executive Summary & Vision

A high-performance, 100% native Windows 11 desktop application for **Dobot Magician** robotic arm programming, replacing legacy Python/Qt Dobot Studio 1.9.4 and removing all web runtime overhead (Three.js WebGL and mobile pendants removed).

The core philosophy is **"Excel-Grade Robotic Motion Sheet with Formula & Variable Intelligence"**:
- **Spreadsheet DataGrid:** Direct cell editing, keyboard navigation (`Arrow keys`, `Tab`, `Enter`), and two-way copy/paste with real Microsoft Excel.
- **Formula & Variable Engine:** Dedicated Variables page for global parametric constants; coordinate cells support formulas (e.g. `base_x + pitch * 2`), automatically evaluating and converting to **Plain Int**.
- **Formula Inspector:** Cells display clean Plain Int values; hovering/inspecting reveals formula bindings, with a toggle to keep linked or bake to static integer.
- **Visual Debugger Step Runner:** Step-by-step execution (`F10`), continuous execution (`F5`), loop iterations, active row glow cursor, and instant `E-STOP` (`Esc`).
- **Hardware Integration:** Native C# serial driver (`System.IO.Ports`) with auto-detect COM port (115200 baud) and virtual simulator fallback.

---

## 2. Technical Stack

| Component | Technology | Rationale |
|---|---|---|
| **Runtime & SDK** | .NET 8 SDK (`net8.0-windows10.0.19041.0`) | Modern LTS, blazing fast startup, native JIT execution |
| **App Framework** | Windows App SDK 1.6+ (WinUI 3) | Official Windows 11 Fluent 2 design system |
| **Packaging** | Unpackaged (`<WindowsPackageType>None</WindowsPackageType>`) | Runs as direct standalone `.exe` without MSIX installation barriers |
| **Window Backing** | WinUI 3 `MicaController` (Mica Alt) | Native OS wallpaper tinting and dark mode integration |
| **DataGrid & Controls** | Windows Community Toolkit WinUI + Custom Cell Templates | High performance table virtualisation, custom formula editors |
| **Serial Hardware Driver** | `System.IO.Ports.SerialPort` | Native Win32 COM port driver for Dobot 0xAA 0xAA protocol |
| **Expression Parser** | Self-contained Recursive Descent Parser | Evaluates math and variables with zero heavy external dependencies |
| **Interoperability** | Windows Clipboard API (TSV format) + XML serializer | True two-way Excel compatibility + Dobot Studio 1.9.4 `.playback` |

---

## 3. UI/UX Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ [≡] Dobot Studio Next-Gen (WinUI 3)  | COM3 (Connected) | [▶ Run] [🛑]│
├────┬───────────────────────────────────────────────────────────────────┤
│    │ Mode: [ Cartesian ] [ Joint ]  Step Size: [1mm]  Speed: [80%]     │
│ 📋 │ ┌───────────────────────────────────────────────────────────────┐ │
│Seq │ │ # │ Name     │Motion│ X   │ Y   │ Z   │ R   │Pause│ Tool │Act │ │ │
│    │ ├───┼──────────┼──────┼─────┼─────┼─────┼─────┼─────┼──────┼────┼─┤ │
│    │ │ 1 │Pick_Appr │ MOVJ │ 220 │ 0   │ 50  │ 0   │ 0.0 │ None │OFF │ │ │
│ 🧮 │ │►2 │Pick_Grab │ MOVL │ 220 │ 0   │ 20  │ 0   │ 0.5 │Suct. │ON  │ │ │
│Var │ │ 3 │Pick_Retr │ MOVL │ 220 │ 0   │ 50  │ 0   │ 0.0 │Suct. │ON  │ │ │
│    │ │ 4 │Drop_Appr │ MOVJ │ 310 │ 100 │ 50  │ 45  │ 0.2 │Suct. │ON  │ │ │
│ ⚙️ │ └───────────────────────────────────────────────────────────────┘ │
│Set │ [Ctrl+T: Teach Point] [F10: Step Next] [F5: Run] [Shift+Offset]   │
└────┴───────────────────────────────────────────────────────────────────┘
```

### 3.1 48px NavigationRail (Left Pane)
- **Sequence Editor (📋):** Main Excel DataGrid spreadsheet view.
- **Variables Manager (🧮):** Dedicated page to define and manage parametric variables.
- **Settings & Calibration (⚙️):** Hardware COM port selection, Teach mode preference (Append vs Overwrite), and home calibration.

### 3.2 Excel DataGrid Specification
1. **Row Header (#):**
   - Displays row index (1, 2, 3...)
   - Visual Debugger Indicator: Glowing blue/green pill `▶` on currently executing row.
2. **Point Name:** Editable text with auto-generated names (`P1`, `P2`, `Pick_Pose`).
3. **Motion Style:** WinUI `ComboBox` with options: `MOVJ`, `MOVL`, `JUMP`, `ARC`.
4. **Coordinate Cells (X, Y, Z, R):**
   - Idle State: Clean Cascadia Code monospace **Plain Int** (e.g. `220`, `50`).
   - Editing State: Text input supporting plain numbers (`220`) or variable expressions (`base_x + 10`, `safe_z - 30`).
   - Formula Inspector: Tooltip / flyout displaying `Formula: base_x + 10 = 210` with a toggle to `Keep Linked` or `Bake to Static Int`.
5. **Pause Time:** Floating-point seconds input (`NumberBox`, e.g. `0.5 s`).
6. **Tool Action & State:** Dropdowns for Suction Cup (ON/OFF), Gripper (OPEN/CLOSE), Laser (PWM %), None.
7. **Row Action:** `[▶ Move To]` button to jog robot directly to that row's coordinates.

---

## 4. Formula & Variable Engine

### 4.1 Dedicated Variables Page
A clean WinUI table where users manage project-level parametric variables:
- **Variable Name:** Identifier string (regex: `^[a-zA-Z_][a-zA-Z0-9_]*$`).
- **Value:** Double / Int value (e.g. `200.0`, `15.0`).
- **Description:** Human note (e.g. "Safe approach height", "Box spacing").

### 4.2 Expression Evaluation Pipeline
1. Tokenization of expression string (`+`, `-`, `*`, `/`, `^`, parentheses, variable tokens, numbers).
2. Substitution of known variable tokens from the Variables Dictionary.
3. Arithmetic evaluation using standard operator precedence (BODMAS).
4. Casting / Rounding result to **Plain Int**: `(int)Math.Round(evaluatedValue)`.
5. Validation: Checking Dobot reachability envelope (Radial reach $R \in [150, 320]\text{ mm}$, $Z \in [-135, 150]\text{ mm}$).

---

## 5. Teach & Step Run Engine

### 5.1 Teach Point
- Reads live Cartesian coordinates (`X, Y, Z, R`) from Dobot via serial packet 0xAA (or simulator).
- Converts coordinates to Plain Ints.
- **Default Mode:** Appends as a new row at the end of the table (`Ctrl+T`).
- **Configurable Mode:** Settings option to switch default action to overwrite currently selected row (`Ctrl+U`).

### 5.2 Step Runner & Execution States
- **State Machine:** `Idle`, `Running`, `Stepping`, `Paused`, `EmergencyStop`.
- **Step Next (`F10`):** Sends coordinate packet for current row, triggers pause timer, advances cursor to next row, updates row highlight.
- **Run Sequence (`F5`):** Async loop through rows 1 to $N$. Supports loop repeat count (1 to 999 or infinite loop).
- **Emergency Stop (`Esc`):** Immediately sends Dobot emergency stop packet, halts execution loop, resets state machine.

---

## 6. Hardware Driver (Dobot Protocol 0xAA)

- **Port:** Win32 `System.IO.Ports.SerialPort`.
- **Baud Rate:** `115200`, DataBits: `8`, StopBits: `1`, Parity: `None`.
- **Packet Structure:**
  - Header: `0xAA 0xAA`
  - Payload Length: `len`
  - Message ID: `cmd_id`
  - Control byte: `0x03` (Queued execution)
  - Data payload: 4-DoF coordinates / end-effector params
  - Checksum: `256 - (sum(payload) % 256)`
- **Auto-Detect:** Queries Windows `Win32_SerialPort` / registry for Silicon Labs CP210x or Dobot VID/PID.
- **Simulator Fallback:** If no COM port is connected, automatically switches to in-memory kinematics simulator.

---

## 7. Universal File Interoperability

1. **Native Project (`.dobot.json`):**
   Stores sequence rows, formulas, variables dictionary, and hardware settings in human-readable JSON.
2. **Legacy Dobot Studio (`.playback` XML):**
   Full two-way compatibility with Dobot Studio 1.9.4 table XML format.
3. **Microsoft Excel Interop (TSV Clipboard):**
   - `Ctrl+C`: Serializes selected rows to TSV format for pasting into Microsoft Excel / Google Sheets.
   - `Ctrl+V`: Parses TSV text from clipboard into sequence rows with validation.
4. **Python Exporter (`.py`):**
   Generates standalone Python playback script using official DobotDllType API.

---

## 8. Verification & Acceptance Criteria

1. **Build & Launch:** .NET 8 SDK installed; WinUI 3 project compiles unpackaged into a single `DobotStudioNext.WinUI3.exe`.
2. **Visual Evidence:** Windows MCP captures native WinUI 3 window with Mica Alt backdrop, PowerToys NavigationRail, and Excel DataGrid.
3. **DataGrid & Excel Interop:** Cell editing navigates with Tab/Enter; copy-pasting to/from Excel works seamlessly.
4. **Formula Calculation:** Typing `base_x + 10` evaluates into clean Plain Int `210`; Formula Inspector tooltip confirms binding.
5. **Teach & Step Run:** `Ctrl+T` appends row; `F10` steps through rows with active glowing row indicator; `Esc` stops immediately.
