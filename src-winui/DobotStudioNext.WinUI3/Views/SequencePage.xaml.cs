using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Windows.ApplicationModel.DataTransfer;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using DobotStudioNext.WinUI3.Core;

namespace DobotStudioNext.WinUI3.Views
{
    public sealed partial class SequencePage : Page
    {
        public SequencePage()
        {
            this.InitializeComponent();

            MotionDataGrid.ItemsSource = AppServices.Sequence.Points;

            AppServices.StepRunner.CurrentRowChanged += OnCurrentRowChanged;
            AppServices.StepRunner.StateChanged += OnStepRunnerStateChanged;
            AppServices.StateOrSequenceUpdated += UpdateStats;

            UpdateStats();
            UpdatePoseDisplay();

            // Keyboard shortcuts (F5, F10, Esc, Ctrl+T)
            this.KeyDown += OnPageKeyDown;
        }

        private void OnPageKeyDown(object sender, KeyRoutedEventArgs e)
        {
            if (e.Key == Windows.System.VirtualKey.F5)
            {
                OnRunClicked(this, new RoutedEventArgs());
                e.Handled = true;
            }
            else if (e.Key == Windows.System.VirtualKey.F10)
            {
                OnStepNextClicked(this, new RoutedEventArgs());
                e.Handled = true;
            }
            else if (e.Key == Windows.System.VirtualKey.Escape)
            {
                OnEStopClicked(this, new RoutedEventArgs());
                e.Handled = true;
            }
            else if (e.Key == Windows.System.VirtualKey.T && Microsoft.UI.Input.InputKeyboardSource.GetKeyStateForCurrentThread(Windows.System.VirtualKey.Control).HasFlag(Windows.UI.Core.CoreVirtualKeyStates.Down))
            {
                OnTeachClicked(this, new RoutedEventArgs());
                e.Handled = true;
            }
        }

        private void UpdateStats()
        {
            DispatcherQueue.TryEnqueue(() =>
            {
                double totalSec = AppServices.Sequence.Points.Sum(p => p.PauseTime) + (AppServices.Sequence.Points.Count * 0.8);
                SequenceStatsText.Text = $"{AppServices.Sequence.Points.Count} Waypoints | ~{totalSec:F1}s Cycle";
                UpdatePoseDisplay();
            });
        }

        private void UpdatePoseDisplay()
        {
            var coords = AppServices.Simulator.GetCoords();
            PoseDisplayX.Text = $"X: {(int)Math.Round(coords.X)}";
            PoseDisplayY.Text = $"Y: {(int)Math.Round(coords.Y)}";
            PoseDisplayZ.Text = $"Z: {(int)Math.Round(coords.Z)}";
            PoseDisplayR.Text = $"R: {(int)Math.Round(coords.R)}°";
        }

        private void OnCurrentRowChanged(int index)
        {
            DispatcherQueue.TryEnqueue(() =>
            {
                if (index >= 0 && index < AppServices.Sequence.Points.Count)
                {
                    MotionDataGrid.SelectedIndex = index;
                    MotionDataGrid.ScrollIntoView(AppServices.Sequence.Points[index]);
                }
                UpdatePoseDisplay();
            });
        }

        private void OnStepRunnerStateChanged(StepRunnerState state)
        {
            DispatcherQueue.TryEnqueue(() =>
            {
                DebuggerStateText.Text = $"Debugger: {state.ToString().ToUpperInvariant()}";
                RunButton.Content = (state == StepRunnerState.Running) ? "⏸ Pause" : "F5: Run Sequence";
                UpdatePoseDisplay();
            });
        }

        private async void OnRunClicked(object sender, RoutedEventArgs e)
        {
            if (AppServices.StepRunner.State == StepRunnerState.Running)
            {
                AppServices.StepRunner.EmergencyStop(AppServices.Sequence);
            }
            else
            {
                await AppServices.StepRunner.RunAsync(AppServices.Sequence, 1);
            }
        }

        private async void OnStepNextClicked(object sender, RoutedEventArgs e)
        {
            await AppServices.StepRunner.StepNextAsync(AppServices.Sequence);
            UpdatePoseDisplay();
        }

        private void OnEStopClicked(object sender, RoutedEventArgs e)
        {
            AppServices.StepRunner.EmergencyStop(AppServices.Sequence);
        }

        private void OnTeachClicked(object sender, RoutedEventArgs e)
        {
            int? selIdx = MotionDataGrid.SelectedIndex >= 0 ? MotionDataGrid.SelectedIndex : (int?)null;
            AppServices.StepRunner.TeachPoint(AppServices.Sequence, selIdx);
            AppServices.Recalculate();
            UpdateStats();
        }

        private void OnAddRowClicked(object sender, RoutedEventArgs e)
        {
            var pt = new MotionPoint
            {
                Index = AppServices.Sequence.Points.Count + 1,
                Name = $"P{AppServices.Sequence.Points.Count + 1}",
                MotionStyle = "MOVJ",
                XRaw = "230",
                YRaw = "0",
                ZRaw = "-10",
                RRaw = "0",
                PauseTime = 0.5,
                ToolAction = "none",
                ToolState = "off"
            };
            AppServices.Sequence.Points.Add(pt);
            AppServices.Recalculate();
            UpdateStats();
        }

        private void OnDeleteRowClicked(object sender, RoutedEventArgs e)
        {
            if (MotionDataGrid.SelectedIndex >= 0 && MotionDataGrid.SelectedIndex < AppServices.Sequence.Points.Count)
            {
                AppServices.Sequence.Points.RemoveAt(MotionDataGrid.SelectedIndex);
                AppServices.Sequence.Reindex();
                AppServices.Recalculate();
                UpdateStats();
            }
        }

        private void OnApplyOffsetClicked(object sender, RoutedEventArgs e)
        {
            int dx = double.IsNaN(OffsetDeltaX.Value) ? 0 : (int)Math.Round(OffsetDeltaX.Value);
            int dy = double.IsNaN(OffsetDeltaY.Value) ? 0 : (int)Math.Round(OffsetDeltaY.Value);
            int dz = double.IsNaN(OffsetDeltaZ.Value) ? 0 : (int)Math.Round(OffsetDeltaZ.Value);

            foreach (var p in AppServices.Sequence.Points)
            {
                p.XInt += dx;
                p.YInt += dy;
                p.ZInt += dz;
                p.XRaw = p.XInt.ToString();
                p.YRaw = p.YInt.ToString();
                p.ZRaw = p.ZInt.ToString();
            }
            AppServices.Recalculate();
        }

        private void OnCopyTsvClicked(object sender, RoutedEventArgs e)
        {
            string tsv = ExcelClipboardInterop.ExportToTsv(AppServices.Sequence.Points);
            var package = new DataPackage();
            package.SetText(tsv);
            Clipboard.SetContent(package);
        }

        private async void OnPasteExcelClicked(object sender, RoutedEventArgs e)
        {
            var content = Clipboard.GetContent();
            if (content.Contains(StandardDataFormats.Text))
            {
                string text = await content.GetTextAsync();
                var imported = ExcelClipboardInterop.ImportFromTsv(text, AppServices.FormulaEngine);
                if (imported.Count > 0)
                {
                    AppServices.Sequence.Points.Clear();
                    foreach (var p in imported)
                    {
                        AppServices.Sequence.Points.Add(p);
                    }
                    AppServices.Recalculate();
                    UpdateStats();
                }
            }
        }

        private void OnMoveSinglePointClicked(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is MotionPoint pt)
            {
                AppServices.Simulator.MoveTo(pt.XInt, pt.YInt, pt.ZInt, pt.RInt);
                if (AppServices.SerialDriver.IsConnected)
                {
                    byte style = (byte)(pt.MotionStyle.ToUpperInvariant() == "MOVL" ? 2 : 1);
                    AppServices.SerialDriver.SendPacket(AppServices.SerialDriver.CreatePtpPacket(style, pt.XInt, pt.YInt, pt.ZInt, pt.RInt));
                }
                UpdatePoseDisplay();
            }
        }

        private void OnSaveClicked(object sender, RoutedEventArgs e)
        {
            string path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "DobotSequence.dobot.json");
            DobotStorage.SaveToJson(path, AppServices.Sequence, AppServices.FormulaEngine.GetAllVariables());
        }

        private void OnOpenClicked(object sender, RoutedEventArgs e)
        {
            string path = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Desktop), "DobotSequence.dobot.json");
            if (File.Exists(path) && DobotStorage.LoadFromJson(path, out var seq, out var vars))
            {
                AppServices.Sequence.Points.Clear();
                foreach (var p in seq.Points) AppServices.Sequence.Points.Add(p);

                foreach (var kvp in vars)
                {
                    AppServices.SetVariable(kvp.Key, kvp.Value);
                }
                AppServices.Recalculate();
                UpdateStats();
            }
        }
    }
}
