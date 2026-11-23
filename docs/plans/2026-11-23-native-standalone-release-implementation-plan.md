# Dobot Studio Next: Native Standalone Release & Fluent UX Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Transform Dobot Studio Next into a true commercial-grade standalone Windows executable (`DobotStudioNext.exe`) featuring a pure Windows GUI subsystem (zero console/CMD window), a minimalist 1.2-second smooth Pop-and-Fade startup popup, and an animated full-window Fluent Skeleton loading state.

**Architecture:** A native Windows GUI application (`#![windows_subsystem = "windows"]`) initializes a borderless Win32 layered popup card displaying the new minimalist vector Dobot icon with smooth fade-in/fade-out, silently spawns background Tokio services (kinematics, protocol driver, port 9876 mobile pendant server), and presents an Edge WebView2 window that renders the production React/Three.js bundle featuring an animated Fluent Skeleton state before hydrating live controls.

**Tech Stack:** Rust 2021, Win32 API (`user32.dll`, `gdi32.dll`), Microsoft Edge WebView2, React 19, TypeScript, Three.js, Tailwind CSS, Vite.

---

### Task 1: Skeleton Loading UI Component & Shimmer Animations

**Files:**
- Create: `src/components/SkeletonView.tsx`
- Modify: `src/index.css` (add shimmer keyframe animation)
- Modify: `src/App.tsx` (integrate skeleton loading lifecycle)
- Test: `tests/skeleton.test.ts`

**Step 1: Write the failing test**
Create `tests/skeleton.test.ts` testing that `SkeletonView` renders all core layout sections (Header, 3D Viewport wireframe card, Jog panel controls, and Waypoint table skeleton) and handles transition completion.

**Step 2: Run test to verify it fails**
Run: `bun test tests/skeleton.test.ts`  
Expected: FAIL (Cannot find module `src/components/SkeletonView.tsx`)

**Step 3: Write minimal implementation**
- Add `@keyframes shimmer-wave` and utility classes in `src/index.css`.
- Implement `src/components/SkeletonView.tsx` with full acrylic wireframe layout.
- Update `src/App.tsx` to mount `SkeletonView` during initial 600ms hydration before cross-fading into `QuickTeach` / `Studio` view.

**Step 4: Run test to verify it passes**
Run: `bun test tests/skeleton.test.ts`  
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/SkeletonView.tsx src/index.css src/App.tsx tests/skeleton.test.ts
git commit -m "feat(ui): add Fluent Skeleton loading screen with shimmer keyframe wave"
```

---

### Task 2: Production Bundle Compilation & Asset Packaging

**Files:**
- Modify: `vite.config.ts` (configure standalone single-page bundle output)
- Modify: `package.json`
- Test: Verify `dist/index.html` and `dist/assets/` output

**Step 1: Write verification command for production build**
Run: `bun run build`

**Step 2: Resolve build dependencies**
Fix any rollup externalization or tailwind plugin issues so that `bun run build` succeeds cleanly and produces standalone HTML/CSS/JS in `dist/`.

**Step 3: Run build to verify it passes**
Run: `bun run build`  
Expected: Exit code 0, `dist/index.html` created.

**Step 4: Commit**
```bash
git add vite.config.ts package.json dist/
git commit -m "build: generate clean production distribution bundle in dist/"
```

---

### Task 3: Win32 Minimalist Pop-and-Fade Startup Popup

**Files:**
- Create: `src-tauri/src/splash.rs`
- Test: `src-tauri/tests/splash_test.rs`

**Step 1: Write the failing test**
Create a test in Rust verifying that the splash window configuration adheres to 460x260 dimensions, layered window flags (`WS_EX_LAYERED`), and 1200ms timer parameters.

**Step 2: Run test to verify it fails**
Run: `cd src-tauri && cargo test --test splash_test`  
Expected: FAIL

**Step 3: Implement Win32 splash window**
Implement `splash.rs` with `CreateWindowExW`, `SetLayeredWindowAttributes` for alpha blending fade-in/fade-out, and rounded corner region clipping (`CreateRoundRectRgn`).

**Step 4: Run test to verify it passes**
Run: `cd src-tauri && cargo test --test splash_test`  
Expected: PASS

**Step 5: Commit**
```bash
git add src-tauri/src/splash.rs src-tauri/tests/splash_test.rs
git commit -m "feat(native): implement Win32 layered minimalist startup popup with smooth fade"
```

---

### Task 4: Standalone GUI Native Launcher (`DobotStudioNext.exe`)

**Files:**
- Modify: `src-tauri/src/main.rs`
- Modify: `src-tauri/Cargo.toml`
- Test: `src-tauri/tests/launcher_test.rs`

**Step 1: Write the failing test**
Verify subsystem declaration and silent startup behavior.

**Step 2: Implement Windows GUI Subsystem in main.rs**
- Add `#![windows_subsystem = "windows"]` at top of `src-tauri/src/main.rs`.
- Wire up Splash screen launch $\to$ background Tokio services $\to$ Edge WebView2 main window initialization $\to$ smooth cross-fade.

**Step 3: Compile Release Binary**
Run: `cd src-tauri && cargo build --release`  
Expected: `target/release/dobot-studio-next.exe` generated without compiler errors.

**Step 4: Commit**
```bash
git add src-tauri/src/main.rs src-tauri/Cargo.toml
git commit -m "feat(release): build standalone DobotStudioNext.exe with pure Windows GUI subsystem"
```

---

### Task 5: Desktop Launcher & End-to-End Release Verification

**Files:**
- Create: `scripts/deploy-release.ps1`
- Modify: `docs/plans/task.md`

**Step 1: Copy release binary to project root**
Copy `dobot-studio-next.exe` to `C:\Users\Administrator\.gemini\antigravity\scratch\dobot-studio-qol\DobotStudioNext.exe`.

**Step 2: Update Desktop Shortcut**
Point `C:\Users\Administrator\Desktop\DobotStudio (Next-Gen).lnk` directly to `DobotStudioNext.exe` with `app-icon.ico`.

**Step 3: Verify Zero-Console Startup**
Launch executable and confirm that no console window appears, the minimalist splash card fades in smoothly, and the full window opens displaying the skeleton state.

**Step 4: Update Tracker and Commit**
Update `task.md` to reflect 100% completion with verification evidence and push to GitHub repository.
