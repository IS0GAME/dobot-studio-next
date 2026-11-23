using System;
using System.IO;
using System.IO.Ports;
using System.Linq;

namespace DobotStudioNext.WinUI3.Core
{
    public class DobotSerialDriver
    {
        private SerialPort? _serialPort;

        public bool IsConnected => _serialPort != null && _serialPort.IsOpen;
        public string? ConnectedPortName => _serialPort?.PortName;

        public byte[] CreatePtpPacket(byte motionStyle, float x, float y, float z, float r)
        {
            // PTP Command: ID 84, Length = 19 (1 ctrl + 1 ptpMode + 4*4 coords)
            byte len = 19;
            byte cmdId = 84;
            byte ctrl = 0x03; // isQueued

            byte[] packet = new byte[len + 4]; // 2 header + 1 len + 1 id + payload + 1 checksum
            packet[0] = 0xAA;
            packet[1] = 0xAA;
            packet[2] = len;
            packet[3] = cmdId;
            packet[4] = ctrl;
            packet[5] = motionStyle;

            Buffer.BlockCopy(BitConverter.GetBytes(x), 0, packet, 6, 4);
            Buffer.BlockCopy(BitConverter.GetBytes(y), 0, packet, 10, 4);
            Buffer.BlockCopy(BitConverter.GetBytes(z), 0, packet, 14, 4);
            Buffer.BlockCopy(BitConverter.GetBytes(r), 0, packet, 18, 4);

            packet[packet.Length - 1] = ComputeChecksum(packet, 3, len);
            return packet;
        }

        public byte[] CreateSuctionCupPacket(bool enable)
        {
            // EndEffectorSuctionCup: ID 62, Length = 4 (1 ctrl + 1 enableCtrl + 1 onSuck)
            byte len = 4;
            byte cmdId = 62;
            byte ctrl = 0x03;

            byte[] packet = new byte[len + 4];
            packet[0] = 0xAA;
            packet[1] = 0xAA;
            packet[2] = len;
            packet[3] = cmdId;
            packet[4] = ctrl;
            packet[5] = 1; // enableCtrl
            packet[6] = (byte)(enable ? 1 : 0);
            packet[packet.Length - 1] = ComputeChecksum(packet, 3, len);
            return packet;
        }

        public byte[] CreateGripperPacket(bool enable, bool close)
        {
            // EndEffectorGripper: ID 63, Length = 4
            byte len = 4;
            byte cmdId = 63;
            byte ctrl = 0x03;

            byte[] packet = new byte[len + 4];
            packet[0] = 0xAA;
            packet[1] = 0xAA;
            packet[2] = len;
            packet[3] = cmdId;
            packet[4] = ctrl;
            packet[5] = (byte)(enable ? 1 : 0);
            packet[6] = (byte)(close ? 1 : 0);
            packet[packet.Length - 1] = ComputeChecksum(packet, 3, len);
            return packet;
        }

        public byte[] CreateEStopPacket()
        {
            // ClearAllAlarmsState & Emergency Stop: ID 21 / PTP stop
            byte len = 2;
            byte cmdId = 21;
            byte[] packet = new byte[len + 4];
            packet[0] = 0xAA;
            packet[1] = 0xAA;
            packet[2] = len;
            packet[3] = cmdId;
            packet[4] = 0x01; // immediate
            packet[packet.Length - 1] = ComputeChecksum(packet, 3, len);
            return packet;
        }

        public byte ComputeChecksum(byte[] buffer, int offset, int length)
        {
            int sum = 0;
            for (int i = offset; i < offset + length; i++)
            {
                sum += buffer[i];
            }
            return (byte)(256 - (sum % 256));
        }

        public bool VerifyChecksum(byte[] packet)
        {
            if (packet.Length < 5) return false;
            byte len = packet[2];
            if (packet.Length != len + 4) return false;
            byte expected = ComputeChecksum(packet, 3, len);
            return packet[packet.Length - 1] == expected;
        }

        public bool Connect(string portName, int baudRate = 115200)
        {
            Disconnect();
            try
            {
                _serialPort = new SerialPort(portName, baudRate, Parity.None, 8, StopBits.One)
                {
                    ReadTimeout = 500,
                    WriteTimeout = 500
                };
                _serialPort.Open();
                return true;
            }
            catch
            {
                _serialPort = null;
                return false;
            }
        }

        public void Disconnect()
        {
            if (_serialPort != null)
            {
                try
                {
                    if (_serialPort.IsOpen) _serialPort.Close();
                    _serialPort.Dispose();
                }
                catch { }
                _serialPort = null;
            }
        }

        public string[] GetAvailablePorts()
        {
            return SerialPort.GetPortNames();
        }

        public string? AutoDetectComPort()
        {
            var ports = GetAvailablePorts();
            return ports.FirstOrDefault();
        }

        public bool SendPacket(byte[] packet)
        {
            if (_serialPort != null && _serialPort.IsOpen)
            {
                try
                {
                    _serialPort.Write(packet, 0, packet.Length);
                    return true;
                }
                catch
                {
                    Disconnect();
                    return false;
                }
            }
            return false;
        }
    }
}
