using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace DobotStudioNext.WinUI3.Core
{
    public class MotionPoint : INotifyPropertyChanged
    {
        private int _index = 1;
        private string _name = "P1";
        private string _motionStyle = "MOVJ";
        private string _xRaw = "230";
        private string _yRaw = "0";
        private string _zRaw = "-10";
        private string _rRaw = "0";
        private int _xInt = 230;
        private int _yInt = 0;
        private int _zInt = -10;
        private int _rInt = 0;
        private bool _isFormulaLinked = true;
        private double _pauseTime = 0.0;
        private string _toolAction = "none";
        private string _toolState = "off";
        private bool _isCurrentExecuting = false;

        public int Index { get => _index; set => SetField(ref _index, value); }
        public string Name { get => _name; set => SetField(ref _name, value); }
        public string MotionStyle { get => _motionStyle; set => SetField(ref _motionStyle, value); }

        public string XRaw { get => _xRaw; set => SetField(ref _xRaw, value); }
        public string YRaw { get => _yRaw; set => SetField(ref _yRaw, value); }
        public string ZRaw { get => _zRaw; set => SetField(ref _zRaw, value); }
        public string RRaw { get => _rRaw; set => SetField(ref _rRaw, value); }

        public int XInt { get => _xInt; set => SetField(ref _xInt, value); }
        public int YInt { get => _yInt; set => SetField(ref _yInt, value); }
        public int ZInt { get => _zInt; set => SetField(ref _zInt, value); }
        public int RInt { get => _rInt; set => SetField(ref _rInt, value); }

        public bool IsFormulaLinked { get => _isFormulaLinked; set => SetField(ref _isFormulaLinked, value); }
        public double PauseTime { get => _pauseTime; set => SetField(ref _pauseTime, value); }
        public string ToolAction { get => _toolAction; set => SetField(ref _toolAction, value); }
        public string ToolState { get => _toolState; set => SetField(ref _toolState, value); }
        public bool IsCurrentExecuting { get => _isCurrentExecuting; set => SetField(ref _isCurrentExecuting, value); }

        public FormulaInspectionInfo FormulaInfoX { get; private set; } = new FormulaInspectionInfo();
        public FormulaInspectionInfo FormulaInfoY { get; private set; } = new FormulaInspectionInfo();
        public FormulaInspectionInfo FormulaInfoZ { get; private set; } = new FormulaInspectionInfo();
        public FormulaInspectionInfo FormulaInfoR { get; private set; } = new FormulaInspectionInfo();

        public void Evaluate(FormulaEngine engine)
        {
            if (!_isFormulaLinked) return;

            FormulaInfoX = engine.Inspect(_xRaw);
            FormulaInfoY = engine.Inspect(_yRaw);
            FormulaInfoZ = engine.Inspect(_zRaw);
            FormulaInfoR = engine.Inspect(_rRaw);

            XInt = FormulaInfoX.EvaluatedInt;
            YInt = FormulaInfoY.EvaluatedInt;
            ZInt = FormulaInfoZ.EvaluatedInt;
            RInt = FormulaInfoR.EvaluatedInt;

            OnPropertyChanged(nameof(FormulaInfoX));
            OnPropertyChanged(nameof(FormulaInfoY));
            OnPropertyChanged(nameof(FormulaInfoZ));
            OnPropertyChanged(nameof(FormulaInfoR));
        }

        public void UnlinkFormulasToStaticInts()
        {
            _isFormulaLinked = false;
            _xRaw = _xInt.ToString();
            _yRaw = _yInt.ToString();
            _zRaw = _zInt.ToString();
            _rRaw = _rInt.ToString();
            OnPropertyChanged(nameof(XRaw));
            OnPropertyChanged(nameof(YRaw));
            OnPropertyChanged(nameof(ZRaw));
            OnPropertyChanged(nameof(RRaw));
            OnPropertyChanged(nameof(IsFormulaLinked));
        }

        public event PropertyChangedEventHandler? PropertyChanged;
        protected void OnPropertyChanged([CallerMemberName] string? propName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propName));
        }

        protected bool SetField<T>(ref T field, T value, [CallerMemberName] string? propName = null)
        {
            if (System.Collections.Generic.EqualityComparer<T>.Default.Equals(field, value)) return false;
            field = value;
            OnPropertyChanged(propName);
            return true;
        }
    }

    public class MotionSequence
    {
        public ObservableCollection<MotionPoint> Points { get; set; } = new ObservableCollection<MotionPoint>();

        public void EvaluateAll(FormulaEngine engine)
        {
            for (int i = 0; i < Points.Count; i++)
            {
                Points[i].Index = i + 1;
                Points[i].Evaluate(engine);
            }
        }

        public void Reindex()
        {
            for (int i = 0; i < Points.Count; i++)
            {
                Points[i].Index = i + 1;
            }
        }
    }
}
