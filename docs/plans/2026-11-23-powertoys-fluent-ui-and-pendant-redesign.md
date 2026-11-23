# PowerToys-Style WinUI 3 Fluent Redesign & Wireless Pendant Modal

**Document:** `docs/plans/2026-11-23-powertoys-fluent-ui-and-pendant-redesign.md`  
**Date:** 2026-11-23  
**Status:** Approved by User  
**Guiding Frameworks:** Anthropic `frontend-design` (Anti-Slop, Subject-Grounded, Restrained) & `ui-ux-pro-max` (141 UX Rules, Contrast 4.5:1, Vector Assets, WinUI 3 / Fluent 2 Design System).

---

## 1. Executive Summary & Design Philosophy

The user has explicitly guided the visual direction:
> *"use both skill to improve all ui focus on power toys like design and front end framework ที่ power toys ใช้"*

Microsoft PowerToys is widely considered the gold standard for modern Windows 11 utility and developer tooling. It uses **WinUI 3 / Windows App SDK (Fluent Design System 2)** characterized by:
- **Mica & Acrylic Materiality:** Soft ambient tinting, multi-layer depth, frosted glass scrims.
- **Strict Vector Iconography:** Zero emoji as structural icons (forbidden by `ui-ux-pro-max` Rule 1). All controls use clean, consistent 1.5px/2px vector icons from Lucide / Segoe Fluent Icons.
- **NavigationView Rail:** 48px vertical sidebar on the far left with a 3px rounded vertical accent pill indicating active state.
- **Card Hierarchy & SettingCards:** Grouped cards with 8px radius, `rgba(255, 255, 255, 0.04)` fill, and subtle `1px solid rgba(255, 255, 255, 0.08)` border.
- **ContentDialog Pattern:** Native Windows 11 modal popups with smoke acrylic blur, rounded 12px borders, high-contrast actions, and keyboard escape dismissals.

---

## 2. Design Token System (Anthropic Frontend-Design Plan)

### Core Color Palette (6 Named Hexes)
| Token Name | Hex Value | Semantic Purpose |
| :--- | :--- | :--- |
| `surface-canvas` | `#0f1017` | Deep Windows 11 Mica base canvas |
| `surface-card` | `rgba(26, 29, 45, 0.65)` | Acrylic glass card with `backdrop-filter: blur(20px)` |
| `surface-card-hover`| `rgba(35, 40, 62, 0.80)` | Hover state elevation with smooth 120ms transition |
| `border-subtle` | `rgba(255, 255, 255, 0.08)`| 1px hairline border providing crisp light catch |
| `accent-dobot-blue`| `#2563eb` | Precision PowerToys / Dobot Brand primary action color |
| `accent-cyan-aura` | `#38bdf8` | Real-time 3D telemetry status, active nav pill, and HUD glow |
| `status-danger` | `#ef4444` | High-visibility Emergency Stop (E-STOP) |
| `text-primary` | `#f8fafc` | High-contrast readable typography ($\ge 4.5:1$) |
| `text-secondary` | `#94a3b8` | Muted descriptions and secondary units |

### Typography Scale
- **Display & Section Headers:** `Segoe UI Variable Display`, `Segoe UI`, system-ui (Weight 600)
- **Body & Interactive Controls:** `Segoe UI Variable Text`, `Segoe UI`, system-ui (12px / 13px, Line-height 1.4)
- **Coordinates & Telemetry:** `Cascadia Code`, `Consolas`, monospace with `font-variant-numeric: tabular-nums` (prevents jitter during high-speed 50Hz robotic coordinate stream)

---

## 3. Component Architecture & Specifications

### A. NavigationRail (`src/components/NavigationRail.tsx`)
- **Width:** 48px fixed, border-right with `var(--border)`.
- **Top Brand:** 32x32px squircle with white "D" logo.
- **Nav Items:**
  1. `Teach` (Crosshair icon) — Active, highlighted with 3px vertical cyan/blue pill on the left.
  2. `Draw` (PenTool icon) — Tooltip: "Draw & Engrave Mode (Preview)"
  3. `Script` (Code icon) — Tooltip: "Python & Blockly Scripting (Preview)"
- **Bottom Nav Item:**
  - `Settings` (Settings icon) — Tooltip: "Connection & Robot Parameters"

### B. TitleBar (`src/components/TitleBar.tsx`)
- **Height:** 36px, Mica translucent bar.
- **Breadcrumb:** `Dobot Studio / Pick and Place Demo.dobot.json` + `Virtual Simulator` pill badge.
- **Mode Switcher:** WinUI 3 Segmented Pills (`QuickTeach` | `Studio`).
- **Pendant Trigger:** Replaced emoji with Lucide `Smartphone` vector icon + "Wireless Pendant" label with subtle hover state.

### C. PendantModal (`src/components/PendantModal.tsx`)
- **Pattern:** Windows 11 ContentDialog.
- **Trigger:** Clicking `📱 Pendant` in TitleBar or Nav Rail.
- **Dimensions:** 440px wide, 500px high, rounded 12px, centered with smoke acrylic backdrop blur (`rgba(0, 0, 0, 0.65)`).
- **Header:** Lucide `Smartphone` icon + "Wireless Teach Pendant" + Close button (`X`).
- **Body:**
  1. **Connection Badge:** `🟢 HTTP & WebSocket Live • Port 9876` (pulsing status dot).
  2. **Vector SVG QR Code:** Clean 180x180px inline SVG QR Code generated client-side from the machine's loopback/local URL.
  3. **Network URL:** High-contrast Cascadia Code badge: `http://127.0.0.1:9876/` with one-click `Copy` button (providing visual "Copied!" feedback).
  4. **Direct Browser Link:** "Open Web Pendant in Browser" button (uses `window.open` or system launcher).
  5. **Instructions:** "Scan with any smartphone on the same Wi-Fi network to enable wireless touch jogging and MPG wheel."

### D. DigitalTwinView (`src/components/DigitalTwinView.tsx`)
- **Viewport Layout:** Dominates 55% of the central workspace.
- **Mica Frame:** Rounded 12px container with dark frosted glass.
- **HUD Overlay:**
  - Top-left: Real-time Coordinate Badges in Cascadia Code: `X: 230.00`, `Y: 0.00`, `Z: -10.00`, `R: 0.00°`.
  - Top-right: Hover-reveal `Eye` / `EyeOff` 3D offload button for low-power GPU mode.
- **Three.js WebGL:** 60 FPS Dobot Magician 4-DoF model with wireframe reach sphere and smooth S-curve interpolation.

### E. WaypointList (`src/components/WaypointList.tsx`)
- **Card Styling:** WinUI 3 Expander cards with 8px radius.
- **Active State:** 1px `border-cyan-500` glow and subtle accent tint.
- **Columns per Row:**
  - Drag handle / Index number.
  - Waypoint Name (e.g. `Pick Position`, editable).
  - Motion Style chip (`MOVJ` / `MOVL`).
  - Tool Action badge (`Suction Cup: ON/OFF`, `Gripper: OPEN/CLOSE`).
  - Coordinates readout (`X Y Z R`).
  - Pause time input (`0.5 s`).
  - Reorder buttons (`▲` `▼`) and Delete button (`✕`).

### F. JogPanel (`src/components/JogPanel.tsx`)
- **WinUI 3 SettingCards Pattern:**
  - Coordinate System toggle (`Cartesian` | `Joint`) using segmented pill switch.
  - Axis Selector: `X`, `Y`, `Z`, `R` (44px touch-accessible buttons).
  - Primary Jog Action Buttons: `◄ Negative` and `Positive ►` with tactile active depression.
  - Step Size Chips: `0.01`, `0.1`, `1.0`, `10.0`, `Continuous`.
  - Precision Sliders: Speed Ratio ($1-100\%$) and Acceleration Ratio ($1-100\%$) with value badge.
  - Tool Action Selector: Modern Dropdown for End-Effector Mode.

---

## 4. Anti-Slop & Professional UI Checklist (from `ui-ux-pro-max`)

| Rule | Implementation Requirement |
| :--- | :--- |
| **No Emoji as Structural Icons** | Replace all `📱`, `▶`, `🛑`, `⏳` with crisp Lucide vector SVGs (`Smartphone`, `Play`, `Square`, `OctagonAlert`). |
| **Touch Target Minimums** | All buttons, axis chips, and switches are $\ge 44\text{px}$ high for tablet/touch compatibility. |
| **Contrast Parity ($\ge 4.5:1$)**| All text labels pass WCAG AA against dark acrylic surfaces. |
| **Stable Interaction States** | Hover/active states use color and opacity only; zero layout-shifting jitter. |
| **Monospace Coordinates** | All numbers rendered in `Cascadia Code` with `tabular-nums` so columns do not dance during motion. |

---

## 5. Verification & Acceptance Criteria
1. `bun test` passes 14/14 tests.
2. `cargo test` passes 7/7 tests.
3. Windows MCP visual verification:
   - Capture screenshot of the full PowerToys Fluent UI.
   - Capture screenshot of the Pendant Modal showing QR Code and network URL.
   - Verify zero console flash and zero errors.
