using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using DobotStudioNext.WinUI3.Core;

namespace DobotStudioNext.WinUI3
{
    public class VariableDisplayItem : INotifyPropertyChanged
    {
        private string _name = string.Empty;
        private double _value = 0.0;
        private string _description = string.Empty;

        public string Name
        {
            get => _name;
            set { _name = value; OnPropertyChanged(nameof(Name)); }
        }

        public double Value
        {
            get => _value;
            set { _value = value; OnPropertyChanged(nameof(Value)); }
        }

        public string Description
        {
            get => _description;
            set { _description = value; OnPropertyChanged(nameof(Description)); }
        }

        public event PropertyChangedEventHandler? PropertyChanged;
        private void OnPropertyChanged(string prop) => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(prop));
    }

    public static class AppServices
    {
        public static FormulaEngine FormulaEngine { get; } = new FormulaEngine();
        public static MotionSequence Sequence { get; } = new MotionSequence();
        public static DobotSerialDriver SerialDriver { get; } = new DobotSerialDriver();
        public static VirtualDobotSimulator Simulator { get; } = new VirtualDobotSimulator();
        public static StepRunner StepRunner { get; } = new StepRunner(SerialDriver, Simulator);

        public static ObservableCollection<VariableDisplayItem> VariableItems { get; } = new ObservableCollection<VariableDisplayItem>();

        public static event Action? StateOrSequenceUpdated;

        static AppServices()
        {
            // Seed initial variables
            SetVariable("base_x", 200.0, "Base pick X offset");
            SetVariable("pitch", 35.0, "Pallet grid pitch spacing");
            SetVariable("drop_z", -40.0, "Tray bottom Z height");

            // Seed initial motion points
            Sequence.Points.Add(new MotionPoint
            {
                Index = 1,
                Name = "P1_Pick",
                MotionStyle = "MOVJ",
                XRaw = "base_x",
                YRaw = "0",
                ZRaw = "drop_z + 50",
                RRaw = "0",
                PauseTime = 0.5,
                ToolAction = "suction",
                ToolState = "on"
            });

            Sequence.Points.Add(new MotionPoint
            {
                Index = 2,
                Name = "P2_Place",
                MotionStyle = "MOVL",
                XRaw = "base_x + pitch",
                YRaw = "150",
                ZRaw = "drop_z",
                RRaw = "45",
                PauseTime = 1.0,
                ToolAction = "suction",
                ToolState = "off"
            });

            Recalculate();
        }

        public static void SetVariable(string name, double val, string desc = "")
        {
            FormulaEngine.SetVariable(name, val);

            var existing = VariableItems.FirstOrDefault(v => string.Equals(v.Name, name, StringComparison.OrdinalIgnoreCase));
            if (existing != null)
            {
                existing.Value = val;
                if (!string.IsNullOrEmpty(desc)) existing.Description = desc;
            }
            else
            {
                VariableItems.Add(new VariableDisplayItem { Name = name, Value = val, Description = desc });
            }

            Recalculate();
        }

        public static void RemoveVariable(string name)
        {
            FormulaEngine.RemoveVariable(name);
            var existing = VariableItems.FirstOrDefault(v => string.Equals(v.Name, name, StringComparison.OrdinalIgnoreCase));
            if (existing != null)
            {
                VariableItems.Remove(existing);
            }

            Recalculate();
        }

        public static void Recalculate()
        {
            Sequence.EvaluateAll(FormulaEngine);
            StateOrSequenceUpdated?.Invoke();
        }
    }
}
