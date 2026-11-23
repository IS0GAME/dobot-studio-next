using System.Threading.Tasks;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using DobotStudioNext.WinUI3.Core;

namespace DobotStudioNext.Tests
{
    [TestClass]
    public class StepRunnerTests
    {
        [TestMethod]
        public async Task StepRunner_RunsSequenceAndUpdatesSimulator()
        {
            var driver = new DobotSerialDriver();
            var sim = new VirtualDobotSimulator();
            var runner = new StepRunner(driver, sim);

            var seq = new MotionSequence();
            seq.Points.Add(new MotionPoint { Index = 1, XInt = 250, YInt = 50, ZInt = 10, RInt = 0, PauseTime = 0.01 });
            seq.Points.Add(new MotionPoint { Index = 2, XInt = 300, YInt = 100, ZInt = -20, RInt = 45, PauseTime = 0.01 });

            int lastHighlightedIndex = -1;
            runner.CurrentRowChanged += (idx) => lastHighlightedIndex = idx;

            await runner.RunAsync(seq, 1);

            Assert.AreEqual(StepRunnerState.Idle, runner.State);
            var coords = sim.GetCoords();
            Assert.AreEqual(300, (int)coords.X);
            Assert.AreEqual(100, (int)coords.Y);
            Assert.AreEqual(-20, (int)coords.Z);
            Assert.AreEqual(45, (int)coords.R);
        }

        [TestMethod]
        public async Task StepRunner_StepNext_AdvancesSingleStep()
        {
            var driver = new DobotSerialDriver();
            var sim = new VirtualDobotSimulator();
            var runner = new StepRunner(driver, sim);

            var seq = new MotionSequence();
            seq.Points.Add(new MotionPoint { Index = 1, XInt = 210, YInt = 20, ZInt = 0, RInt = 0, PauseTime = 0.01 });
            seq.Points.Add(new MotionPoint { Index = 2, XInt = 260, YInt = 40, ZInt = -15, RInt = 90, PauseTime = 0.01 });

            await runner.StepNextAsync(seq);
            Assert.AreEqual(0, runner.CurrentIndex);
            Assert.AreEqual(210, (int)sim.GetCoords().X);

            await runner.StepNextAsync(seq);
            Assert.AreEqual(1, runner.CurrentIndex);
            Assert.AreEqual(260, (int)sim.GetCoords().X);
        }

        [TestMethod]
        public void StepRunner_EmergencyStop_HaltsExecution()
        {
            var driver = new DobotSerialDriver();
            var sim = new VirtualDobotSimulator();
            var runner = new StepRunner(driver, sim);

            runner.EmergencyStop();
            Assert.AreEqual(StepRunnerState.EmergencyStopped, runner.State);

            runner.ResetEmergencyStop();
            Assert.AreEqual(StepRunnerState.Idle, runner.State);
        }

        [TestMethod]
        public void StepRunner_TeachPoint_AppendsCurrentSimulatorPosition()
        {
            var driver = new DobotSerialDriver();
            var sim = new VirtualDobotSimulator();
            sim.MoveTo(275.4f, -30.2f, 15.8f, 12.1f);

            var runner = new StepRunner(driver, sim);
            var seq = new MotionSequence();

            runner.TeachPoint(seq, null, "Taught1");

            Assert.AreEqual(1, seq.Points.Count);
            Assert.AreEqual("Taught1", seq.Points[0].Name);
            Assert.AreEqual(275, seq.Points[0].XInt);
            Assert.AreEqual(-30, seq.Points[0].YInt);
            Assert.AreEqual(16, seq.Points[0].ZInt);
            Assert.AreEqual(12, seq.Points[0].RInt);
        }
    }
}
