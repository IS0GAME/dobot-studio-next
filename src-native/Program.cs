using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.IO;
using System.Diagnostics;
using System.Threading;
using System.Windows.Forms;
using System.Runtime.InteropServices;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;

namespace DobotStudioNext
{
    static class Program
    {
        [DllImport("Gdi32.dll", EntryPoint = "CreateRoundRectRgn")]
        public static extern IntPtr CreateRoundRectRgn(int nLeftRect, int nTopRect, int nRightRect, int nBottomRect, int nWidthEllipse, int nHeightEllipse);

        [DllImport("dwmapi.dll")]
        public static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // 1. Show Minimalist Pop-and-Fade Splash Popup
            using (var splash = new SplashPopup())
            {
                splash.Show();
                splash.Refresh();

                // Start background silent service (Bun dev or preview on port 5173 with CreateNoWindow = true)
                Process bgProcess = StartBackgroundService();

                // Let splash display for 1.2s with smooth animation
                var sw = Stopwatch.StartNew();
                while (sw.ElapsedMilliseconds < 1200)
                {
                    Application.DoEvents();
                    Thread.Sleep(15);
                }

                // Smooth fade-out (200ms)
                for (double op = 1.0; op >= 0.0; op -= 0.1)
                {
                    splash.Opacity = op;
                    Application.DoEvents();
                    Thread.Sleep(20);
                }
                splash.Close();

                // 2. Open Main Maximized Window with Edge WebView2
                using (var mainForm = new MainWindow(bgProcess))
                {
                    Application.Run(mainForm);
                }
            }
        }

        static Process StartBackgroundService()
        {
            try
            {
                string rootDir = AppDomain.CurrentDomain.BaseDirectory;
                string bunPath = @"C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Links\bun.exe";
                if (!File.Exists(bunPath)) bunPath = "bun";

                var psi = new ProcessStartInfo
                {
                    FileName = bunPath,
                    Arguments = "run dev",
                    WorkingDirectory = rootDir,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                psi.EnvironmentVariables["PATH"] = @"C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Links;" + Environment.GetEnvironmentVariable("PATH");

                return Process.Start(psi);
            }
            catch
            {
                return null;
            }
        }
    }

    public class SplashPopup : Form
    {
        private Image iconImage;
        private int pulsePhase = 0;
        private System.Windows.Forms.Timer animTimer;

        public SplashPopup()
        {
            this.FormBorderStyle = FormBorderStyle.None;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Size = new Size(460, 260);
            this.BackColor = Color.FromArgb(15, 23, 42); // #0f172a
            this.ShowInTaskbar = false;
            this.TopMost = true;
            this.DoubleBuffered = true;

            // Rounded corners
            this.Region = Region.FromHrgn(Program.CreateRoundRectRgn(0, 0, 460, 260, 24, 24));

            string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "assets", "icon.png");
            if (File.Exists(iconPath))
            {
                iconImage = Image.FromFile(iconPath);
            }

            animTimer = new System.Windows.Forms.Timer();
            animTimer.Interval = 30;
            animTimer.Tick += (s, e) => { pulsePhase = (pulsePhase + 6) % 360; this.Invalidate(); };
            animTimer.Start();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;

            // Draw Subtle Border
            using (var borderPen = new Pen(Color.FromArgb(56, 189, 248), 1.5f))
            {
                g.DrawRectangle(borderPen, 0, 0, 459, 259);
            }

            // Draw Minimalist Dobot Vector Icon
            if (iconImage != null)
            {
                int iconSize = 96;
                int iconX = (this.Width - iconSize) / 2;
                int iconY = 35;
                g.DrawImage(iconImage, iconX, iconY, iconSize, iconSize);
            }

            // Draw Title Text
            using (var fontTitle = new Font("Segoe UI", 16, FontStyle.Bold))
            using (var brushTitle = new SolidBrush(Color.FromArgb(248, 250, 252)))
            {
                string title = "DOBOT STUDIO NEXT";
                SizeF sz = g.MeasureString(title, fontTitle);
                g.DrawString(title, fontTitle, brushTitle, (this.Width - sz.Width) / 2, 145);
            }

            // Draw Subtitle Text
            using (var fontSub = new Font("Segoe UI", 9, FontStyle.Regular))
            using (var brushSub = new SolidBrush(Color.FromArgb(148, 163, 184)))
            {
                string sub = "Version 2.0.0 • High-Precision Robotics Suite";
                SizeF sz = g.MeasureString(sub, fontSub);
                g.DrawString(sub, fontSub, brushSub, (this.Width - sz.Width) / 2, 178);
            }

            // Pulsing Cyan Status Aura Line
            double sinVal = Math.Sin(pulsePhase * Math.PI / 180.0);
            int alpha = (int)(140 + 100 * sinVal);
            using (var pulseBrush = new SolidBrush(Color.FromArgb(alpha, 56, 189, 248)))
            {
                int barW = 120;
                int barX = (this.Width - barW) / 2;
                g.FillRectangle(pulseBrush, barX, 218, barW, 3);
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                if (animTimer != null) animTimer.Dispose();
                if (iconImage != null) iconImage.Dispose();
            }
            base.Dispose(disposing);
        }
    }

    public class MainWindow : Form
    {
        private WebView2 webView;
        private Process bgProcess;

        public MainWindow(Process bgProc)
        {
            this.bgProcess = bgProc;
            this.Text = "Dobot Studio Next-Gen";
            this.WindowState = FormWindowState.Maximized;
            this.BackColor = Color.FromArgb(10, 10, 15);

            string icoPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "assets", "app-icon.ico");
            if (File.Exists(icoPath))
            {
                this.Icon = new Icon(icoPath);
            }

            // Enable Windows 11 Dark Mode Titlebar
            int darkMode = 1;
            Program.DwmSetWindowAttribute(this.Handle, 20, ref darkMode, sizeof(int)); // DWMWA_USE_IMMERSIVE_DARK_MODE

            webView = new WebView2();
            webView.Dock = DockStyle.Fill;
            this.Controls.Add(webView);

            InitializeWebView();
        }

        private async void InitializeWebView()
        {
            try
            {
                var env = await CoreWebView2Environment.CreateAsync(null, Path.Combine(Path.GetTempPath(), "DobotStudioNext_WebView2"));
                await webView.EnsureCoreWebView2Async(env);
                webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                webView.CoreWebView2.Settings.AreDevToolsEnabled = false;

                // Navigate to local application (which will immediately display the Fluent Skeleton Loading State)
                webView.Source = new Uri("http://127.0.0.1:5173/");
            }
            catch (Exception ex)
            {
                MessageBox.Show("WebView2 Initialization Error: " + ex.Message);
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            base.OnFormClosing(e);
            if (bgProcess != null && !bgProcess.HasExited)
            {
                try
                {
                    bgProcess.Kill();
                }
                catch { }
            }
        }
    }
}
