using System;
using System.Threading;
using System.Threading.Tasks;

namespace DobotStudioNext.WinUI3.Core
{
    public enum StepRunnerState
    {
        Idle,
        Running,
        Stepping,
        Paused,
        EmergencyStopped
    }

    public class StepRunner
    {
        private readonly DobotSerialDriver _driver;
        private readonly VirtualDobotSimulator _simulator;
        private CancellationTokenSource? _cts;
        private int _currentIndex = -1;
        private StepRunnerState _state = StepRunnerState.Idle;

        public StepRunnerState State
        {
            get => _state;
            private set
            {
                if (_state != value)
                {
                    _state = value;
                    StateChanged?.Invoke(_state);
                }
            }
        }

        public int CurrentIndex
        {
            get => _currentIndex;
            private set
            {
                if (_currentIndex != value)
                {
                    _currentIndex = value;
                    CurrentRowChanged?.Invoke(_currentIndex);
                }
            }
        }

        public event Action<StepRunnerState>? StateChanged;
        public event Action<int>? CurrentRowChanged;

        public StepRunner(DobotSerialDriver driver, VirtualDobotSimulator simulator)
        {
            _driver = driver;
            _simulator = simulator;
        }

        public async Task RunAsync(MotionSequence sequence, int repeatCount = 1)
        {
            if (sequence.Points.Count == 0) return;

            _cts = new CancellationTokenSource();
            State = StepRunnerState.Running;

            try
            {
                for (int rep = 0; rep < repeatCount; rep++)
                {
                    for (int i = 0; i < sequence.Points.Count; i++)
                    {
                        if (_cts.IsCancellationRequested || State == StepRunnerState.EmergencyStopped)
                        {
                            break;
                        }

                        await ExecutePointAsync(sequence.Points[i], i, _cts.Token);
                    }

                    if (_cts.IsCancellationRequested || State == StepRunnerState.EmergencyStopped)
                    {
                        break;
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // Clean cancel
            }
            finally
            {
                if (State != StepRunnerState.EmergencyStopped)
                {
                    State = StepRunnerState.Idle;
                }
                ClearExecutingFlag(sequence);
                CurrentIndex = -1;
            }
        }

        public async Task StepNextAsync(MotionSequence sequence)
        {
            if (sequence.Points.Count == 0) return;

            int next = _currentIndex + 1;
            if (next >= sequence.Points.Count)
            {
                next = 0;
            }

            State = StepRunnerState.Stepping;
            try
            {
                await ExecutePointAsync(sequence.Points[next], next, CancellationToken.None);
            }
            finally
            {
                State = StepRunnerState.Idle;
            }
        }

        public void EmergencyStop(MotionSequence? sequence = null)
        {
            State = StepRunnerState.EmergencyStopped;
            _cts?.Cancel();

            if (_driver.IsConnected)
            {
                byte[] eStop = _driver.CreateEmergencyStopPacket();
                _driver.SendPacket(eStop);
            }

            if (sequence != null)
            {
                ClearExecutingFlag(sequence);
            }
        }

        public void ResetEmergencyStop()
        {
            State = StepRunnerState.Idle;
            CurrentIndex = -1;
        }

        public void TeachPoint(MotionSequence sequence, int? targetIndex = null, string? name = null)
        {
            var coords = _simulator.GetCoords();
            int plainX = (int)Math.Round(coords.X);
            int plainY = (int)Math.Round(coords.Y);
            int plainZ = (int)Math.Round(coords.Z);
            int plainR = (int)Math.Round(coords.R);

            if (targetIndex.HasValue && targetIndex.Value >= 0 && targetIndex.Value < sequence.Points.Count)
            {
                var pt = sequence.Points[targetIndex.Value];
                pt.XRaw = plainX.ToString();
                pt.YRaw = plainY.ToString();
                pt.ZRaw = plainZ.ToString();
                pt.RRaw = plainR.ToString();
                pt.XInt = plainX;
                pt.YInt = plainY;
                pt.ZInt = plainZ;
                pt.RInt = plainR;
            }
            else
            {
                var newPt = new MotionPoint
                {
                    Index = sequence.Points.Count + 1,
                    Name = name ?? $"P{sequence.Points.Count + 1}",
                    MotionStyle = "MOVJ",
                    XRaw = plainX.ToString(),
                    YRaw = plainY.ToString(),
                    ZRaw = plainZ.ToString(),
                    RRaw = plainR.ToString(),
                    XInt = plainX,
                    YInt = plainY,
                    ZInt = plainZ,
                    RInt = plainR,
                    PauseTime = 0.5,
                    ToolAction = "none",
                    ToolState = "off"
                };
                sequence.Points.Add(newPt);
            }
        }

        private async Task ExecutePointAsync(MotionPoint point, int index, CancellationToken ct)
        {
            CurrentIndex = index;
            point.IsCurrentExecuting = true;

            byte motionByte = (byte)(point.MotionStyle.ToUpperInvariant() == "MOVL" ? 2 : 1);
            if (_driver.IsConnected)
            {
                byte[] ptp = _driver.CreatePtpPacket(motionByte, point.XInt, point.YInt, point.ZInt, point.RInt);
                _driver.SendPacket(ptp);

                if (point.ToolAction.ToLowerInvariant() == "suction")
                {
                    bool enable = point.ToolState.ToLowerInvariant() == "on";
                    _driver.SendPacket(_driver.CreateSuctionCupPacket(enable));
                }
            }
            else
            {
                _simulator.MoveTo(point.XInt, point.YInt, point.ZInt, point.RInt);
            }

            int delayMs = (int)(Math.Max(point.PauseTime, 0.05) * 1000);
            if (delayMs > 0)
            {
                await Task.Delay(Math.Min(delayMs, 50), ct);
            }

            point.IsCurrentExecuting = false;
        }

        private void ClearExecutingFlag(MotionSequence sequence)
        {
            foreach (var pt in sequence.Points)
            {
                pt.IsCurrentExecuting = false;
            }
        }
    }
}
