using System;
using Microsoft.UI.Composition.SystemBackdrops;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using DobotStudioNext.WinUI3.Core;
using DobotStudioNext.WinUI3.Views;

namespace DobotStudioNext.WinUI3;

public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        this.InitializeComponent();

        // Mica Alt Backdrop
        if (MicaController.IsSupported())
        {
            this.SystemBackdrop = new MicaBackdrop { Kind = MicaKind.BaseAlt };
        }

        // Default navigation
        NavView.SelectedItem = NavView.MenuItems[0];
    }

    private void NavView_SelectionChanged(NavigationView sender, NavigationViewSelectionChangedEventArgs args)
    {
        if (args.IsSettingsSelected)
        {
            BreadcrumbCurrentPage.Text = "Settings";
            ContentFrame.Navigate(typeof(SettingsPage));
            return;
        }

        if (args.SelectedItem is NavigationViewItem item)
        {
            string tag = item.Tag?.ToString() ?? "";
            switch (tag)
            {
                case "sequence":
                    BreadcrumbCurrentPage.Text = "Motion Sequence (Excel Grade)";
                    ContentFrame.Navigate(typeof(SequencePage));
                    break;
                case "variables":
                    BreadcrumbCurrentPage.Text = "Parametric Variables";
                    ContentFrame.Navigate(typeof(VariablesPage));
                    break;
            }
        }
    }

    private void OnScanPortClicked(object sender, RoutedEventArgs e)
    {
        string? port = AppServices.SerialDriver.AutoDetectDobotPort();
        if (port != null)
        {
            HardwareStatusText.Text = $"Dobot Hardware ({port})";
            HardwareStatusText.Foreground = new SolidColorBrush(Microsoft.UI.Colors.LightGreen);
        }
        else
        {
            HardwareStatusText.Text = "Virtual Simulator (Active)";
            HardwareStatusText.Foreground = new SolidColorBrush(Microsoft.UI.Colors.Teal);
        }
    }
}
