using System;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using DobotStudioNext.WinUI3.Core;

namespace DobotStudioNext.WinUI3.Controls
{
    public sealed partial class FormulaCellControl : UserControl
    {
        public static readonly DependencyProperty RawValueProperty =
            DependencyProperty.Register(nameof(RawValue), typeof(string), typeof(FormulaCellControl),
                new PropertyMetadata(string.Empty, OnRawValueChanged));

        public static readonly DependencyProperty EvaluatedIntProperty =
            DependencyProperty.Register(nameof(EvaluatedInt), typeof(int), typeof(FormulaCellControl),
                new PropertyMetadata(0, OnEvaluatedIntChanged));

        public static readonly DependencyProperty FormulaInfoProperty =
            DependencyProperty.Register(nameof(FormulaInfo), typeof(FormulaInspectionInfo), typeof(FormulaCellControl),
                new PropertyMetadata(null, OnFormulaInfoChanged));

        public static readonly DependencyProperty IsLinkedProperty =
            DependencyProperty.Register(nameof(IsLinked), typeof(bool), typeof(FormulaCellControl),
                new PropertyMetadata(true, OnIsLinkedChanged));

        public string RawValue
        {
            get => (string)GetValue(RawValueProperty);
            set => SetValue(RawValueProperty, value);
        }

        public int EvaluatedInt
        {
            get => (int)GetValue(EvaluatedIntProperty);
            set => SetValue(EvaluatedIntProperty, value);
        }

        public FormulaInspectionInfo? FormulaInfo
        {
            get => (FormulaInspectionInfo?)GetValue(FormulaInfoProperty);
            set => SetValue(FormulaInfoProperty, value);
        }

        public bool IsLinked
        {
            get => (bool)GetValue(IsLinkedProperty);
            set => SetValue(IsLinkedProperty, value);
        }

        public FormulaCellControl()
        {
            this.InitializeComponent();
            UpdateDisplayMode(false);
        }

        private static void OnRawValueChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is FormulaCellControl ctrl)
            {
                ctrl.RawTextBox.Text = e.NewValue?.ToString() ?? string.Empty;
                ctrl.UpdateFlyout();
            }
        }

        private static void OnEvaluatedIntChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is FormulaCellControl ctrl)
            {
                ctrl.PlainIntDisplay.Text = e.NewValue?.ToString() ?? "0";
                ctrl.UpdateFlyout();
            }
        }

        private static void OnFormulaInfoChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is FormulaCellControl ctrl)
            {
                ctrl.UpdateFlyout();
            }
        }

        private static void OnIsLinkedChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (d is FormulaCellControl ctrl && e.NewValue is bool linked)
            {
                ctrl.KeepLinkedSwitch.IsOn = linked;
            }
        }

        private void UpdateDisplayMode(bool isEditing)
        {
            if (isEditing)
            {
                RawTextBox.Opacity = 1.0;
                PlainIntDisplay.Visibility = Visibility.Collapsed;
            }
            else
            {
                RawTextBox.Opacity = 0.0;
                PlainIntDisplay.Visibility = Visibility.Visible;
                PlainIntDisplay.Text = EvaluatedInt.ToString();
            }
        }

        private void UpdateFlyout()
        {
            FormulaExpressionText.Text = $"Formula: {RawValue}";
            FormulaResultText.Text = $"Plain Int: {EvaluatedInt}";
        }

        private void OnGotFocus(object sender, RoutedEventArgs e)
        {
            UpdateDisplayMode(true);
            RawTextBox.SelectAll();
        }

        private void OnLostFocus(object sender, RoutedEventArgs e)
        {
            CommitEdit();
            UpdateDisplayMode(false);
        }

        private void OnKeyDown(object sender, KeyRoutedEventArgs e)
        {
            if (e.Key == Windows.System.VirtualKey.Enter)
            {
                CommitEdit();
                UpdateDisplayMode(false);
                e.Handled = true;
            }
            else if (e.Key == Windows.System.VirtualKey.Escape)
            {
                RawTextBox.Text = RawValue;
                UpdateDisplayMode(false);
                e.Handled = true;
            }
        }

        private void CommitEdit()
        {
            RawValue = RawTextBox.Text;
            AppServices.Recalculate();
        }

        private void OnKeepLinkedToggled(object sender, RoutedEventArgs e)
        {
            IsLinked = KeepLinkedSwitch.IsOn;
        }

        private void OnBakeClicked(object sender, RoutedEventArgs e)
        {
            RawValue = EvaluatedInt.ToString();
            IsLinked = false;
            KeepLinkedSwitch.IsOn = false;
            AppServices.Recalculate();
            InspectorButton.Flyout?.Hide();
        }
    }
}
