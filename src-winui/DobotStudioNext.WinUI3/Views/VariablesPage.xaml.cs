using System;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace DobotStudioNext.WinUI3.Views
{
    public sealed partial class VariablesPage : Page
    {
        public VariablesPage()
        {
            this.InitializeComponent();
            VariablesListView.ItemsSource = AppServices.VariableItems;
            UpdateCount();
            AppServices.StateOrSequenceUpdated += UpdateCount;
        }

        private void UpdateCount()
        {
            VariableCountText.Text = $"{AppServices.VariableItems.Count} variable(s) defined";
        }

        private void OnSaveVariableClicked(object sender, RoutedEventArgs e)
        {
            string name = VariableNameBox.Text?.Trim() ?? string.Empty;
            if (string.IsNullOrEmpty(name)) return;

            double val = double.IsNaN(VariableValueBox.Value) ? 0.0 : VariableValueBox.Value;
            string desc = VariableDescBox.Text?.Trim() ?? string.Empty;

            AppServices.SetVariable(name, val, desc);

            VariableNameBox.Text = string.Empty;
            VariableDescBox.Text = string.Empty;
            UpdateCount();
        }

        private void OnDeleteVariableClicked(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn && btn.Tag is string varName)
            {
                AppServices.RemoveVariable(varName);
                UpdateCount();
            }
        }

        private void OnInsertGridPresetClicked(object sender, RoutedEventArgs e)
        {
            AppServices.SetVariable("grid_rows", 3.0, "Pallet matrix rows count");
            AppServices.SetVariable("grid_cols", 3.0, "Pallet matrix cols count");
            AppServices.SetVariable("pitch_x", 35.0, "Pallet X delta pitch (mm)");
            AppServices.SetVariable("pitch_y", 35.0, "Pallet Y delta pitch (mm)");
            UpdateCount();
        }
    }
}
