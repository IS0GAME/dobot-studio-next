using System;

namespace DobotStudioNext.WinUI3.Core
{
    public struct RobotCoordinates
    {
        public float X { get; set; }
        public float Y { get; set; }
        public float Z { get; set; }
        public float R { get; set; }
    }

    public class VirtualDobotSimulator
    {
        private RobotCoordinates _coords = new RobotCoordinates
        {
            X = 230.0f,
            Y = 0.0f,
            Z = -10.0f,
            R = 0.0f
        };

        public bool SuctionCupEnabled { get; set; }
        public bool GripperEnabled { get; set; }
        public bool GripperClosed { get; set; }

        public RobotCoordinates GetCoords() => _coords;

        public void MoveTo(float x, float y, float z, float r)
        {
            _coords.X = x;
            _coords.Y = y;
            _coords.Z = z;
            _coords.R = r;
        }

        public void Jog(string axis, float step)
        {
            switch (axis.ToLowerInvariant())
            {
                case "x": _coords.X += step; break;
                case "y": _coords.Y += step; break;
                case "z": _coords.Z += step; break;
                case "r": _coords.R += step; break;
            }
        }
    }
}
