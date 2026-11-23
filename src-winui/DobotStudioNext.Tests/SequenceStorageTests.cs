using Microsoft.VisualStudio.TestTools.UnitTesting;
using DobotStudioNext.WinUI3.Core;
using System.IO;

namespace DobotStudioNext.Tests
{
    [TestClass]
    public class SequenceStorageTests
    {
        [TestMethod]
        public void Test_MotionPoint_Evaluation_With_Formulas()
        {
            var engine = new FormulaEngine();
            engine.SetVariable("base_z", 50);
            engine.SetVariable("step", 15);

            var point = new MotionPoint
            {
                Name = "Pick1",
                MotionStyle = "MOVJ",
                XRaw = "200 + step",
                YRaw = "0",
                ZRaw = "base_z - 10",
                RRaw = "0",
                PauseTime = 0.5,
                ToolAction = "suction_cup",
                ToolState = "on"
            };

            point.Evaluate(engine);

            Assert.AreEqual(215, point.XInt);
            Assert.AreEqual(0, point.YInt);
            Assert.AreEqual(40, point.ZInt);
            Assert.AreEqual(0, point.RInt);
            Assert.IsTrue(point.FormulaInfoX.IsFormula);
            Assert.IsTrue(point.FormulaInfoZ.IsFormula);
        }

        [TestMethod]
        public void Test_Excel_TSV_Export_And_Import()
        {
            var engine = new FormulaEngine();
            var points = new System.Collections.Generic.List<MotionPoint>
            {
                new MotionPoint { Name = "P1", MotionStyle = "MOVJ", XRaw = "220", YRaw = "10", ZRaw = "-10", RRaw = "0" },
                new MotionPoint { Name = "P2", MotionStyle = "MOVL", XRaw = "240", YRaw = "0", ZRaw = "30", RRaw = "45" }
            };
            foreach (var p in points) p.Evaluate(engine);

            string tsv = ExcelClipboardInterop.ExportToTsv(points);
            Assert.IsTrue(tsv.Contains("P1\tMOVJ\t220\t10\t-10\t0"));
            Assert.IsTrue(tsv.Contains("P2\tMOVL\t240\t0\t30\t45"));

            var imported = ExcelClipboardInterop.ImportFromTsv(tsv, engine);
            Assert.AreEqual(2, imported.Count);
            Assert.AreEqual("P1", imported[0].Name);
            Assert.AreEqual(220, imported[0].XInt);
            Assert.AreEqual("P2", imported[1].Name);
            Assert.AreEqual(240, imported[1].XInt);
        }

        [TestMethod]
        public void Test_Json_Storage_Roundtrip()
        {
            var engine = new FormulaEngine();
            engine.SetVariable("safe_z", 45);

            var sequence = new MotionSequence();
            sequence.Points.Add(new MotionPoint { Name = "Approach", XRaw = "220", YRaw = "0", ZRaw = "safe_z", RRaw = "0" });
            sequence.EvaluateAll(engine);

            string tempFile = Path.Combine(Path.GetTempPath(), "dobot_test_project.dobot.json");
            try
            {
                DobotStorage.SaveToJson(tempFile, sequence, engine.GetAllVariables());
                Assert.IsTrue(File.Exists(tempFile));

                bool loaded = DobotStorage.LoadFromJson(tempFile, out var loadedSeq, out var loadedVars);
                Assert.IsTrue(loaded);
                Assert.AreEqual(1, loadedSeq.Points.Count);
                Assert.AreEqual("Approach", loadedSeq.Points[0].Name);
                Assert.AreEqual(45, (int)loadedVars["safe_z"]);
            }
            finally
            {
                if (File.Exists(tempFile)) File.Delete(tempFile);
            }
        }

        [TestMethod]
        public void Test_Dobot_Studio_Legacy_Playback_Xml_Export()
        {
            var sequence = new MotionSequence();
            sequence.Points.Add(new MotionPoint
            {
                Name = "P1",
                MotionStyle = "MOVJ",
                XInt = 230,
                YInt = 0,
                ZInt = 20,
                RInt = 0,
                PauseTime = 0.5,
                ToolAction = "suction_cup",
                ToolState = "on"
            });

            string xml = DobotStorage.ExportToPlaybackXml(sequence);
            Assert.IsTrue(xml.Contains("<playback"));
            Assert.IsTrue(xml.Contains("x=\"230\""));
            Assert.IsTrue(xml.Contains("isSuctionCup=\"1\""));
        }
    }
}
