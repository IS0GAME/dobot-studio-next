# Dobot Studio Next: Native Standalone Release & Fluent UX Design

**Date:** 2026-11-23  
**Status:** Approved  
**Author:** Antigravity Engineering  

---

## 1. Problem Statement & Motivation
While the internal drivers, kinematics engine, and WebGL 3D twin of Dobot Studio Next are functionally verified and unit tested, launching via `scripts/launch-nextgen.bat` resulted in:
1. An unpolished developer experience where a black Windows Command Prompt (`cmd.exe`) console flashed open.
2. An icon with an unmasked bounding box on the desktop.
3. Sudden loading of UI components without a smooth transitional skeleton state.

To meet commercial **Production-Ready** standards (comparable to Microsoft PowerToys and professional industrial robotics suites), the application must run as a pure Windows GUI application with a dedicated, minimalist startup popup and an elegant skeleton loading screen.

---

## 2. Architecture & Subsystem Specification

### 2.1 Pure Windows GUI Subsystem
- **Executable Target:** `DobotStudioNext.exe` (x86_64 Windows PE binary).
- **Subsystem Attribute:** `#![windows_subsystem = "windows"]` in Rust or `/target:winexe` in C# host.
- **Guarantee:** Under no circumstances will Windows spawn `conhost.exe` or a Command Prompt window when the user double-clicks the application.

### 2.2 Minimalist Pop-and-Fade Startup Popup
- **Dimensions:** 460 x 260 px, centered on primary display.
- **Window Type:** Win32 Borderless `WS_EX_LAYERED | WS_EX_TOPMOST` with a 18px rounded corner clipping region (`CreateRoundRectRgn`).
- **Styling:**
  - Background: Dark obsidian/slate `#0f172a` with subtle 1px border `#1e293b`.
  - Icon: Clean minimalist vector Dobot Magician robotic arm icon (transparent squircle).
  - Typography: `DOBOT STUDIO NEXT` with subtle cyan accent and `Version 2.0.0`.
  - Status Indicator: Minimalist glowing cyan pulsing aura indicator.
- **Lifecycle & Timing:**
  - `0 - 150 ms`: Alpha fade-in (0 $\to$ 255).
  - `150 - 1,200 ms`: Displayed statically while background services spin up silently.
  - `1,200 - 1,400 ms`: Smooth alpha fade-out (255 $\to$ 0) and window destruction.

### 2.3 Full-Window Fluent Skeleton Loading State
- **Component:** `src/components/SkeletonView.tsx`.
- **Anatomy:**
  1. **Top Header Skeleton:** TitleBar placeholder, QuickTeach/Studio pill placeholder, connection badge.
  2. **Center 3D Viewport Skeleton:** Large rounded acrylic container with a glowing holographic wireframe outline of the 4-DoF Dobot arm and shimmering coordinate chips $(X, Y, Z, R)$.
  3. **Right Jog Panel Skeleton:** Shimmering axis selector buttons (Cartesian / Joint) and step-size pills.
  4. **Bottom/Side Waypoint Table Skeleton:** 4 shimmering table rows with index, coordinate tags, and "โหมดการใช้งาน" status indicators.
- **Animation:** CSS `shimmer-wave` keyframes traveling across a linear gradient (`rgba(255,255,255,0.03)` to `rgba(255,255,255,0.1)`).
- **Hydration & Transition:** 350ms smooth cross-fade (`cubic-bezier(0.16, 1, 0.3, 1)`) once WebGL canvas and telemetry listeners are mounted.

### 2.4 Desktop Integration
- **Shortcut:** `C:\Users\Administrator\Desktop\DobotStudio (Next-Gen).lnk` pointing to `DobotStudioNext.exe`.
- **Icon:** Multi-resolution `app-icon.ico` (256x256 down to 16x16) with 100% alpha transparency outside the squircle.
