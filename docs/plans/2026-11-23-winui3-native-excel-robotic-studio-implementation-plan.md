# Dobot Studio WinUI 3 Native Excel Robotic Studio Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a 100% native Windows 11 WinUI 3 (C# .NET 8, unpackaged) robotics programming studio for Dobot Magician featuring an Excel-compatible spreadsheet DataGrid, Formula & Variable Engine (converting expressions to Plain Ints with a Formula Inspector), Visual Debugger Step Runner (`F10`, `F5`, `Esc`), and native Serial COM port driver.

**Architecture:** A native C# solution composed of a Core class library (Formula Engine, Serial 0xAA driver, Sequence storage, Excel TSV clipboard interop) and a WinUI 3 Desktop App project with Mica Alt backdrop, PowerToys NavigationRail, dedicated Variables Page, and custom Excel DataGrid. Web runtimes (Three.js WebGL and mobile pendant) are completely omitted.

**Tech Stack:** C# .NET 8, Windows App SDK 1.6+, CommunityToolkit.WinUI, `System.IO.Ports`, Cascadia Code font, MSTest / xUnit.

---

### Task 1: Toolchain Bootstrapping & .NET 8 SDK Setup

**Files:**
- Setup: Windows CLI Environment
- Verify: `dotnet --version`

**Step 1: Install .NET 8 SDK**
Run: `winget install Microsoft.DotNet.SDK.8 --silent --accept-source-agreements --accept-package-agreements`
Expected: Successfully installed Microsoft .NET SDK 8.0

**Step 2: Verify .NET 8 SDK and Windows Desktop Workload**
Run: `dotnet --version; dotnet --list-sdks`
Expected: `8.0.xxx` displayed

**Step 3: Commit environment verification**
Run: `git commit --allow-empty -m "chore(env): verify .NET 8 SDK installation"`

---

### Task 2: Formula & Variable Engine (TDD)

**Files:**
- Create: `src-winui/DobotStudioNext.WinUI3.Core/FormulaEngine.cs`
- Create: `src-winui/DobotStudioNext.Tests/FormulaEngineTests.cs`

**Step 1: Write failing unit test for FormulaEngine**
```csharp
[TestMethod]
public void Test_Formula_Evaluation_To_Plain_Int()
{
    var engine = new FormulaEngine();
    engine.SetVariable("base_x", 200);
    engine.SetVariable("pitch", 35);
    
    // Constant string
    Assert.AreEqual(150, engine.EvaluateToPlainInt("150"));
    
    // Expression with variables
    Assert.AreEqual(270, engine.EvaluateToPlainInt("base_x + (pitch * 2)"));
    
    // Complex formula rounding to Plain Int
    Assert.AreEqual(33, engine.EvaluateToPlainInt("100 / 3"));
}
```

**Step 2: Run test to verify it fails**
Run: `dotnet test src-winui/DobotStudioNext.Tests`
Expected: FAIL (FormulaEngine not found)

**Step 3: Implement FormulaEngine with Recursive Descent Parser**
Implement `FormulaEngine.cs` supporting:
- Variable dictionary: `Dictionary<string, double>`
- Mathematical operators: `+`, `-`, `*`, `/`, `^`, parentheses `( )`
- Function: `EvaluateToPlainInt(string expr, out string error)` returning integer

**Step 4: Run test to verify it passes**
Run: `dotnet test src-winui/DobotStudioNext.Tests`
Expected: PASS (All formula evaluations return correct Plain Int)

**Step 5: Commit**
Run: `git add src-winui/` && `git commit -m "feat(core): implement FormulaEngine with recursive descent parser and plain int conversion"`

---

### Task 3: Dobot Serial Protocol Driver & Virtual Kinematics Simulator (TDD)

**Files:**
- Create: `src-winui/DobotStudioNext.WinUI3.Core/DobotSerialDriver.cs`
- Create: `src-winui/DobotStudioNext.WinUI3.Core/VirtualDobotSimulator.cs`
- Create: `src-winui/DobotStudioNext.Tests/SerialDriverTests.cs`

**Step 1: Write failing unit test for Dobot Protocol 0xAA**
```csharp
[TestMethod]
public void Test_Dobot_Packet_Checksum_And_Encoding()
{
    var driver = new DobotSerialDriver();
    byte[] packet = driver.CreatePtpPacket(motionStyle: 1, x: 220, y: 0, z: -10, r: 0);
    Assert.AreEqual(0xAA, packet[0]);
    Assert.AreEqual(0xAA, packet[1]);
    Assert.IsTrue(driver.VerifyChecksum(packet));
}
```

**Step 2: Run test to verify failure**
Run: `dotnet test src-winui/DobotStudioNext.Tests`
Expected: FAIL

**Step 3: Implement DobotSerialDriver and VirtualDobotSimulator**
- Protocol 0xAA 0xAA packet generator and parser
- Auto-detect COM port with baud rate 115200
- Virtual simulator with analytical kinematics fallback

**Step 4: Run test to verify it passes**
Run: `dotnet test src-winui/DobotStudioNext.Tests`
Expected: PASS

**Step 5: Commit**
Run: `git add src-winui/` && `git commit -m "feat(core): implement DobotSerialDriver 0xAA and VirtualDobotSimulator in C#"`

---

### Task 4: Motion Sequence Data Model & Excel TSV Clipboard Interop (TDD)

**Files:**
- Create: `src-winui/DobotStudioNext.WinUI3.Core/MotionPoint.cs`
- Create: `src-winui/DobotStudioNext.WinUI3.Core/MotionSequence.cs`
- Create: `src-winui/DobotStudioNext.WinUI3.Core/ExcelClipboardInterop.cs`
- Create: `src-winui/DobotStudioNext.WinUI3.Core/DobotStorage.cs`
- Create: `src-winui/DobotStudioNext.Tests/SequenceStorageTests.cs`

**Step 1: Write failing unit test for Excel TSV copy/paste and JSON/XML storage**
```csharp
[TestMethod]
public void Test_Excel_TSV_Serialization_And_Deserialization()
{
    var seq = new MotionSequence();
    seq.Points.Add(new MotionPoint { Name = "P1", XRaw = "200", YRaw = "0", ZRaw = "50", RRaw = "0" });
    
    string tsv = ExcelClipboardInterop.ExportToTsv(seq.Points);
    Assert.IsTrue(tsv.Contains("P1\t200\t0\t50\t0"));
    
    var imported = ExcelClipboardInterop.ImportFromTsv(tsv);
    Assert.AreEqual(1, imported.Count);
    Assert.AreEqual("P1", imported[0].Name);
}
```

**Step 2: Run test to verify failure**
Run: `dotnet test src-winui/DobotStudioNext.Tests`
Expected: FAIL

**Step 3: Implement MotionPoint, MotionSequence, and DobotStorage**
- `MotionPoint`: Observable object with `XRaw`, `XInt`, `FormulaInfo`, `IsFormulaLinked`
- `ExcelClipboardInterop`: TSV serialization for direct Excel paste/copy
- `DobotStorage`: `.dobot.json` and Dobot Studio 1.9.4 `.playback` XML converter

**Step 4: Run test to verify it passes**
Run: `dotnet test src-winui/DobotStudioNext.Tests`
Expected: PASS

**Step 5: Commit**
Run: `git add src-winui/` && `git commit -m "feat(core): implement MotionSequence, Excel TSV interop, and .dobot.json/.playback storage"`

---

### Task 5: WinUI 3 Unpackaged Desktop App Shell & NavigationRail

**Files:**
- Create: `src-winui/DobotStudioNext.WinUI3/DobotStudioNext.WinUI3.csproj`
- Create: `src-winui/DobotStudioNext.WinUI3/App.xaml`
- Create: `src-winui/DobotStudioNext.WinUI3/MainWindow.xaml`
- Create: `src-winui/DobotStudioNext.WinUI3/MainWindow.xaml.cs`

**Step 1: Configure WinUI 3 Unpackaged Project**
- `<TargetFramework>net8.0-windows10.0.19041.0</TargetFramework>`
- `<WindowsPackageType>None</WindowsPackageType>`
- Add `Microsoft.WindowsAppSDK` (1.6+) and `CommunityToolkit.WinUI`

**Step 2: Implement MainWindow with Mica Alt and NavigationRail**
- 48px `NavigationView` with custom icons (Sequence 📋, Variables 🧮, Settings ⚙️)
- PowerToys-style Breadcrumb TitleBar with hardware status indicator
- Frame navigation between pages

**Step 3: Build unpackaged executable**
Run: `dotnet build src-winui/DobotStudioNext.WinUI3 -c Release`
Expected: `Build succeeded. 0 Warning(s). 0 Error(s).`

**Step 4: Commit**
Run: `git add src-winui/` && `git commit -m "feat(winui): create unpackaged WinUI 3 MainWindow with Mica Alt and NavigationRail"`

---

### Task 6: Variables Manager Page (WinUI 3)

**Files:**
- Create: `src-winui/DobotStudioNext.WinUI3/Views/VariablesPage.xaml`
- Create: `src-winui/DobotStudioNext.WinUI3/Views/VariablesPage.xaml.cs`
- Create: `src-winui/DobotStudioNext.WinUI3/ViewModels/VariablesViewModel.cs`

**Step 1: Create VariablesPage XAML**
- Header: "Parametric Variables" with subtitle
- Table of variables with columns: Name, Value (Plain Int / Float), Description, Actions (Delete)
- Add Variable Input Card: `Variable Name`, `Initial Value`, `Description`, `[+ Add Variable]` button
- Reactive event invoking sequence re-evaluation on value changes

**Step 2: Build project and test data binding**
Run: `dotnet build src-winui/DobotStudioNext.WinUI3 -c Release`
Expected: Build succeeded

**Step 3: Commit**
Run: `git add src-winui/` && `git commit -m "feat(winui): implement dedicated Variables Manager Page"`

---

### Task 7: Excel DataGrid Page with Formula Inspector & Toolbar (WinUI 3)

**Files:**
- Create: `src-winui/DobotStudioNext.WinUI3/Views/SequencePage.xaml`
- Create: `src-winui/DobotStudioNext.WinUI3/Views/SequencePage.xaml.cs`
- Create: `src-winui/DobotStudioNext.WinUI3/ViewModels/SequenceViewModel.cs`
- Create: `src-winui/DobotStudioNext.WinUI3/Controls/FormulaCellControl.xaml`

**Step 1: Implement FormulaCellControl**
- Text template: Cascadia Code font, displays Plain Int
- Tooltip/Flyout Formula Inspector: Shows `Formula: base_x + 10 = 210` with `[Keep Linked | Unlink to Static Int]` toggle
- Editing template: Focus enters editing mode, raw formula/text displayed, `Enter`/`Tab` evaluates to Plain Int

**Step 2: Implement SequencePage XAML**
- Command Bar: `[Ctrl+T: Teach Point]`, `[+ Add Row]`, `[- Delete]`, `[Duplicate]`, `[Batch Offset]`, `[Copy TSV]`, `[Paste Excel]`
- Excel DataGrid Table:
  - Header: `#`, `Point Name`, `Motion`, `X`, `Y`, `Z`, `R`, `Pause (s)`, `Tool Action`, `Tool State`, `Go`
  - Keyboard Navigation: `Arrow keys`, `Tab`, `Shift+Tab`, `Enter`
  - Row Selection & Batch Offset Flyout

**Step 3: Build project and test**
Run: `dotnet build src-winui/DobotStudioNext.WinUI3 -c Release`
Expected: Build succeeded

**Step 4: Commit**
Run: `git add src-winui/` && `git commit -m "feat(winui): implement Excel DataGrid with FormulaCellControl and batch offset"`

---

### Task 8: Step Runner & Teach Execution Engine (Visual Debugger)

**Files:**
- Create: `src-winui/DobotStudioNext.WinUI3.Core/StepRunner.cs`
- Modify: `src-winui/DobotStudioNext.WinUI3/Views/SequencePage.xaml.cs`
- Modify: `src-winui/DobotStudioNext.WinUI3/MainWindow.xaml.cs`

**Step 1: Implement StepRunner State Machine**
- Properties: `CurrentIndex`, `State` (`Idle`, `Running`, `Stepping`, `EmergencyStop`)
- Methods: `StepNext()`, `RunSequence()`, `Pause()`, `EmergencyStop()`
- Event: `RowExecuting(int index)` triggering visual glow indicator in DataGrid

**Step 2: Wire Keyboard Shortcuts & Toolbar Controls**
- `F10`: Step Next
- `F5`: Run / Pause
- `Esc`: Emergency Stop (instant pause & stop packet)
- `Ctrl+T`: Teach Point (appends by default, or overwrites if configured in Settings)

**Step 3: Build and run test suite**
Run: `dotnet test src-winui/DobotStudioNext.Tests`
Expected: 100% PASS

**Step 4: Commit**
Run: `git add src-winui/` && `git commit -m "feat(winui): implement Visual Debugger StepRunner and Teach shortcut engine"`

---

### Task 9: End-to-End Build, Launch, and Visual Verification via Windows MCP

**Files:**
- Verify: `DobotStudioNext.WinUI3.exe`
- Evidence: Captured screenshot artifacts in artifact directory

**Step 1: Release Build of WinUI 3 Standalone Exe**
Run: `dotnet publish src-winui/DobotStudioNext.WinUI3 -c Release -r win-x64 --self-contained false -p:PublishSingleFile=true`
Expected: Single standalone `DobotStudioNext.WinUI3.exe` generated

**Step 2: Launch via Windows MCP and Capture Visual Evidence**
- Launch using `windows-mcp:app(programPath=".../DobotStudioNext.WinUI3.exe")`
- Capture visual evidence using `windows-mcp:screenshot_control`
- Verify:
  1. Native WinUI 3 Window with Mica Alt backdrop
  2. PowerToys NavigationRail
  3. Excel DataGrid with Cascadia Code tabular-nums Plain Ints
  4. Formula Inspector Flyout
  5. Step Runner Glowing Row Indicator
  6. Zero web runtimes, zero connection refused errors

**Step 3: Commit and Push to GitHub PR #1**
Run: `git push origin release/v2.0-standalone-fluent-suite`
Expected: All commits pushed to GitHub PR #1
