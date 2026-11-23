# PowerToys-Style WinUI 3 Fluent Redesign & Wireless Pendant Modal Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Transform Dobot Studio Next-Gen into a genuine Microsoft PowerToys / WinUI 3 Fluent Design application with a 48px NavigationRail, full vector Lucide iconography (anti-slop), expanded 3D Viewport, and a ContentDialog-style Wireless Pendant Modal with pure vector SVG QR Code and local IP connectivity.

**Architecture:** Implement modular React 19 Fluent 2 components using Lucide icons, Cascadia Code tabular-nums typography, Acrylic/Mica glassmorphism with Tailwind CSS, client-side SVG QR code generation for zero-network wireless pendant pairing, and compile into the standalone Windows GUI binary (`DobotStudioNext.exe`).

**Tech Stack:** React 19, TypeScript 5.6, Tailwind CSS, Lucide React, Three.js WebGL, Bun, C# / .NET Framework 4.0 (`csc.exe`), Windows MCP.

---

### Task 1: Create PowerToys NavigationRail Component

**Files:**
- Create: `src/components/NavigationRail.tsx`
- Test: `tests/navigation-rail.test.ts`

**Step 1: Write the failing unit test**
Create `tests/navigation-rail.test.ts` to test NavigationRail rendering, active item selection indicator, and callback trigger.

**Step 2: Run test to verify it fails**
Run: `bun test tests/navigation-rail.test.ts`
Expected: FAIL ("Cannot find module")

**Step 3: Implement NavigationRail.tsx**
Implement 48px wide sidebar with:
- Top Dobot "D" vector badge
- Vertical navigation items: Teach (Crosshair), Draw (PenTool), Script (Code)
- Left 3px rounded vertical cyan/blue accent pill on active item
- Bottom Settings icon (Settings)
- Fluent hover glow and tooltips

**Step 4: Run test to verify it passes**
Run: `bun test tests/navigation-rail.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/NavigationRail.tsx tests/navigation-rail.test.ts
git commit -m "feat(ui): add PowerToys-style NavigationRail component"
```

---

### Task 2: Implement Windows 11 ContentDialog PendantModal with Pure Vector QR Code

**Files:**
- Create: `src/components/PendantModal.tsx`
- Test: `tests/pendant-modal.test.ts`

**Step 1: Write the failing unit test**
Create `tests/pendant-modal.test.ts` to verify:
- Modal renders when `isOpen = true`
- Vector SVG QR code generates with valid viewBox and paths
- Local port 9876 is present in the rendered URL
- Copy button interaction invokes clipboard feedback

**Step 2: Run test to verify it fails**
Run: `bun test tests/pendant-modal.test.ts`
Expected: FAIL ("Cannot find module")

**Step 3: Implement PendantModal.tsx**
Build Windows 11 ContentDialog modal with:
- Acrylic backdrop blur with dark smoke overlay (`rgba(0,0,0,0.65)`)
- Rounded 12px card with 1px border highlight
- Pure client-side SVG QR Code generator (matrix rendering for `http://<IP>:9876/`)
- Dynamic hostname / Local IP detection
- "Copy URL" button with instant checkmark feedback
- "Open Web Pendant in Browser" button
- Live pulse indicator: "🟢 WebSocket Server Live • Port 9876"

**Step 4: Run test to verify it passes**
Run: `bun test tests/pendant-modal.test.ts`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/PendantModal.tsx tests/pendant-modal.test.ts
git commit -m "feat(pendant): add WinUI ContentDialog PendantModal with vector SVG QR Code"
```

---

### Task 3: Modernize TitleBar with PowerToys Breadcrumb and Vector Icons

**Files:**
- Modify: `src/components/TitleBar.tsx`

**Step 1: Update TitleBar with Lucide Vector Icons**
- Replace emoji `📱` with Lucide `Smartphone` vector icon
- Replace generic dots with WinUI 3 breadcrumb styling
- Segmented mode switcher pills with subtle active elevation
- Add connection status indicator

**Step 2: Verify TypeScript & Build**
Run: `bun run build`
Expected: PASS

**Step 3: Commit**
```bash
git add src/components/TitleBar.tsx
git commit -m "refactor(titlebar): modernize with PowerToys breadcrumb and Lucide vector icons"
```

---

### Task 4: Upgrade JogPanel & WaypointList with PowerToys SettingCards Pattern

**Files:**
- Modify: `src/components/JogPanel.tsx`
- Modify: `src/components/WaypointList.tsx`

**Step 1: Upgrade JogPanel**
- Replace any emoji icons with Lucide SVG (`Play`, `Square`, `Sliders`, `Plus`, `Trash2`, `OctagonAlert`)
- Structure into PowerToys SettingCards (`rgba(255,255,255,0.04)` with `1px solid rgba(255,255,255,0.08)`)
- Ensure all touch targets meet $\ge 44\text{px}$ touch guidelines
- Use `Cascadia Code` for all step sizes and coordinate displays

**Step 2: Upgrade WaypointList**
- WinUI Expander style list items with 8px radius
- Tool action badges with clear text labels (Suction Cup ON / Gripper OPEN)
- Reorder buttons (`ChevronUp`, `ChevronDown`)
- High-contrast typography ($\ge 4.5:1$ contrast ratio)

**Step 3: Verify Tests**
Run: `bun test`
Expected: All tests pass

**Step 4: Commit**
```bash
git add src/components/JogPanel.tsx src/components/WaypointList.tsx
git commit -m "feat(ui): style JogPanel and WaypointList with PowerToys SettingCards and vector icons"
```

---

### Task 5: Integrate PowerToys Layout in App Shell and Refine CSS

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/index.css`

**Step 1: Update App.tsx**
- Incorporate `NavigationRail` on the left (48px)
- Bind Pendant modal state (`isPendantOpen`, `setIsPendantOpen`)
- Expand 3D Digital Twin Viewport to 55% height
- Apply Mica backdrop blur to main canvas

**Step 2: Update index.css**
- Add Fluent 2 scrollbar styling (slender, dark-themed)
- Add PowerToys elevation shadow classes (`0 10px 30px rgba(0,0,0,0.5)`)
- Define optical sizing font classes for `Segoe UI Variable` and `Cascadia Code`

**Step 3: Build Production Bundle**
Run: `bun run build`
Expected: Clean build with CSS and JS bundles generated in `dist/`

**Step 4: Recompile Standalone Binary**
Run: `& "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /target:winexe /win32icon:assets\dobot-minimal.ico /out:DobotStudioNext.exe src-native\Program.cs`
Expected: Exit code 0, binary updated

**Step 5: Commit**
```bash
git add src/App.tsx src/index.css
git commit -m "feat(shell): integrate PowerToys Fluent layout with expanded 3D viewport and modal"
```

---

### Task 6: Comprehensive Unit Test Suite Verification

**Files:**
- Run: `bun test`
- Run: `cargo test --manifest-path src-tauri/Cargo.toml`

**Step 1: Execute all unit & integration tests**
Run: `bun test && cargo test --manifest-path src-tauri/Cargo.toml`
Expected: All 16+ tests pass with 0 failures

**Step 2: Verify production build output**
Run: `bun run build`
Expected: Clean compilation with 0 errors

---

### Task 7: Visual Verification via Windows MCP (Mandatory Pre-Delivery)

**Tools:**
- `windows-mcp:app`
- `windows-mcp:window_management`
- `windows-mcp:screenshot_control`

**Step 1: Launch updated DobotStudioNext.exe**
Call `windows-mcp:app` with `programPath: "...\DobotStudioNext.exe"`

**Step 2: Verify main window appearance**
Activate window and capture full-screen screenshot to artifact directory. Verify:
- Left NavigationRail is visible with Dobot vector logo and active Teach indicator
- 3D Viewport is expanded, dark acrylic styled, 60fps WebGL active
- All buttons use vector Lucide icons (ZERO emojis)
- Waypoints and Jog panel reflect clean PowerToys WinUI 3 styling

**Step 3: Trigger Pendant Modal and Verify**
Click or trigger Pendant Modal, capture screenshot to artifact directory. Verify:
- ContentDialog opens centered with smooth acrylic blur
- Pure vector SVG QR Code is sharp and scannable
- Local IP address is displayed with Copy button

**Step 4: Report Evidence to User**
Present captured screenshot artifacts with detailed notes.
