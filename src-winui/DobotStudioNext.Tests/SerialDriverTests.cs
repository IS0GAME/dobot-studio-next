using Microsoft.VisualStudio.TestTools.UnitTesting;
using DobotStudioNext.WinUI3.Core;

namespace DobotStudioNext.Tests
{
    [TestClass]
    public class SerialDriverTests
    {
        [TestMethod]
        public void Test_Dobot_Ptp_Packet_Generation_And_Checksum()
        {
            var driver = new DobotSerialDriver();
            byte[] packet = driver.CreatePtpPacket(motionStyle: 1, x: 220, y: 0, z: -10, r: 0);

            // Header 0xAA 0xAA
            Assert.AreEqual(0xAA, packet[0]);
            Assert.AreEqual(0xAA, packet[1]);

            // Length
            Assert.AreEqual(19, packet[2]);

            // Command ID: 84 (PTP Cmd)
            Assert.AreEqual(84, packet[3]);

            // Checksum verification
            Assert.IsTrue(driver.VerifyChecksum(packet));
        }

        [TestMethod]
        public void Test_Dobot_Suction_Cup_Packet_Checksum()
        {
            var driver = new DobotSerialDriver();
            byte[] packetOn = driver.CreateSuctionCupPacket(enable: true);
            Assert.AreEqual(0xAA, packetOn[0]);
            Assert.AreEqual(0xAA, packetOn[1]);
            Assert.IsTrue(driver.VerifyChecksum(packetOn));

            byte[] packetOff = driver.CreateSuctionCupPacket(enable: false);
            Assert.IsTrue(driver.VerifyChecksum(packetOff));
        }

        [TestMethod]
        public void Test_Virtual_Simulator_Initial_State_And_Move()
        {
            var sim = new VirtualDobotSimulator();
            var initial = sim.GetCoords();
            Assert.AreEqual(230, (int)initial.X);
            Assert.AreEqual(0, (int)initial.Y);
            Assert.AreEqual(-10, (int)initial.Z);

            sim.MoveTo(250, 10, 20, 0);
            var updated = sim.GetCoords();
            Assert.AreEqual(250, (int)updated.X);
            Assert.AreEqual(10, (int)updated.Y);
            Assert.AreEqual(20, (int)updated.Z);
        }
    }
}
