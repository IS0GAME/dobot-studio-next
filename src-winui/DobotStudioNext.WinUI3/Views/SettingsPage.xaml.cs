using System.Linq;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace DobotStudioNext.WinUI3.Views
{
    public sealed partial class SettingsPage : Page
    {
        public SettingsPage()
        {
            this.InitializeComponent();
            RefreshPorts();
        }

        private void OnScanPortsClicked(object sender, RoutedEventArgs e)
        {
            RefreshPorts();
        }

        private void RefreshPorts()
        {
            var ports = AppServices.SerialDriver.GetAvailablePorts();
            PortComboBox.ItemsSource = ports;
            if (ports.Length > 0)
            {
                PortComboBox.SelectedIndex = 0;
            }
        }
    }
}
