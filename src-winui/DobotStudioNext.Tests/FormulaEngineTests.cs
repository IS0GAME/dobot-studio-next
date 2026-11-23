using Microsoft.VisualStudio.TestTools.UnitTesting;
using DobotStudioNext.WinUI3.Core;

namespace DobotStudioNext.Tests
{
    [TestClass]
    public class FormulaEngineTests
    {
        [TestMethod]
        public void Test_Constant_Integer_Parsing()
        {
            var engine = new FormulaEngine();
            int result = engine.EvaluateToPlainInt("230", out string error);
            Assert.IsTrue(string.IsNullOrEmpty(error));
            Assert.AreEqual(230, result);
        }

        [TestMethod]
        public void Test_Constant_Float_Rounded_To_Plain_Int()
        {
            var engine = new FormulaEngine();
            int result1 = engine.EvaluateToPlainInt("220.4", out string error1);
            Assert.AreEqual(220, result1);

            int result2 = engine.EvaluateToPlainInt("220.6", out string error2);
            Assert.AreEqual(221, result2);
        }

        [TestMethod]
        public void Test_Variables_Evaluation_To_Plain_Int()
        {
            var engine = new FormulaEngine();
            engine.SetVariable("base_x", 200);
            engine.SetVariable("pitch", 35);
            engine.SetVariable("depth", 10.4);

            // Variable lookup
            int r1 = engine.EvaluateToPlainInt("base_x", out string e1);
            Assert.AreEqual(200, r1);

            // Simple addition
            int r2 = engine.EvaluateToPlainInt("base_x + 15", out string e2);
            Assert.AreEqual(215, r2);

            // Multiplication and parentheses
            int r3 = engine.EvaluateToPlainInt("base_x + (pitch * 2)", out string e3);
            Assert.AreEqual(270, r3);

            // Float subtraction rounding to int
            int r4 = engine.EvaluateToPlainInt("base_x - depth", out string e4);
            Assert.AreEqual(190, r4);
        }

        [TestMethod]
        public void Test_Unknown_Variable_Returns_Error()
        {
            var engine = new FormulaEngine();
            int result = engine.EvaluateToPlainInt("unknown_var + 10", out string error);
            Assert.IsFalse(string.IsNullOrEmpty(error));
            Assert.IsTrue(error.Contains("unknown_var"));
        }

        [TestMethod]
        public void Test_Inspection_Info_Formatting()
        {
            var engine = new FormulaEngine();
            engine.SetVariable("safe_z", 50);

            var info = engine.Inspect("safe_z - 15");
            Assert.IsTrue(info.IsFormula);
            Assert.AreEqual("safe_z - 15", info.Expression);
            Assert.AreEqual(35, info.EvaluatedInt);
        }
    }
}
