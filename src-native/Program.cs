using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Text;
using System.IO;
using System.Net;
using System.Text;
using System.Diagnostics;
using System.Threading;
using System.Windows.Forms;
using System.Runtime.InteropServices;

namespace DobotStudioNext
{
    static class Program
    {
        [DllImport("Gdi32.dll", EntryPoint = "CreateRoundRectRgn")]
        public static extern IntPtr CreateRoundRectRgn(int nLeftRect, int nTopRect, int nRightRect, int nBottomRect, int nWidthEllipse, int nHeightEllipse);

        [DllImport("user32.dll")]
        public static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        public static extern bool BringWindowToTop(IntPtr hWnd);

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool IsWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
        public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern int GetWindowTextLength(IntPtr hWnd);

        [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
        public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

        private static HttpListener staticListener;
        private static Thread serverThread;
        private static bool isServerRunning = false;
        private static Process pendantProcess;
        private static string distDirectory;

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            bool createdNew;
            using (var mutex = new Mutex(true, "DobotStudioNext_SingleInstance_Mutex_v2", out createdNew))
            {
                if (!createdNew)
                {
                    // Instance already running - focus it and exit gracefully
                    IntPtr existingHwnd = FindDobotAppWindow();
                    if (existingHwnd != IntPtr.Zero)
                    {
                        SetForegroundWindow(existingHwnd);
                        BringWindowToTop(existingHwnd);
                    }
                    return;
                }

                string rootDir = AppDomain.CurrentDomain.BaseDirectory;
                distDirectory = Path.Combine(rootDir, "dist");
                if (!Directory.Exists(distDirectory))
                {
                    distDirectory = rootDir;
                }

                // 1. Start Embedded In-Process Static Server on Port 5173
                StartEmbeddedServer();

                // 2. Start Silent Mobile Pendant Service (Port 9876) if available
                StartPendantService(rootDir);

                // 3. Show Smooth Minimalist Splash Popup (White 'D' on Dark Blue Gradient)
                ShowSplashPopup();

                // 4. Launch Dedicated Native App Window (Edge App Mode) and keep server alive until closed
                LaunchAppWindow();
            }
        }

        static void StartEmbeddedServer()
        {
            try
            {
                staticListener = new HttpListener();
                staticListener.Prefixes.Add("http://127.0.0.1:5173/");
                staticListener.Prefixes.Add("http://localhost:5173/");
                staticListener.Start();
                isServerRunning = true;
            }
            catch (Exception)
            {
                // Fallback: try binding loopback only
                try
                {
                    staticListener = new HttpListener();
                    staticListener.Prefixes.Add("http://127.0.0.1:5173/");
                    staticListener.Start();
                    isServerRunning = true;
                }
                catch (Exception ex)
                {
                    Trace.WriteLine("Static server error: " + ex.Message);
                    return;
                }
            }

            serverThread = new Thread(ServerWorker)
            {
                IsBackground = true,
                Name = "DobotStaticHttpServer"
            };
            serverThread.Start();
        }

        static void ServerWorker()
        {
            while (isServerRunning && staticListener != null && staticListener.IsListening)
            {
                try
                {
                    var context = staticListener.GetContext();
                    ThreadPool.QueueUserWorkItem((c) => HandleRequest((HttpListenerContext)c), context);
                }
                catch
                {
                    if (!isServerRunning) break;
                }
            }
        }

        static void HandleRequest(HttpListenerContext context)
        {
            try
            {
                string rawUrl = context.Request.Url.AbsolutePath;
                string relPath = rawUrl.TrimStart('/');

                // API: Network Info for Mobile Pendant Auto-Discovery
                if (relPath.Equals("api/network-info", StringComparison.OrdinalIgnoreCase) ||
                    relPath.Equals("api/ip", StringComparison.OrdinalIgnoreCase))
                {
                    var ipList = new System.Collections.Generic.List<string>();
                    foreach (var ni in System.Net.NetworkInformation.NetworkInterface.GetAllNetworkInterfaces())
                    {
                        if (ni.OperationalStatus == System.Net.NetworkInformation.OperationalStatus.Up)
                        {
                            foreach (var ip in ni.GetIPProperties().UnicastAddresses)
                            {
                                if (ip.Address.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork &&
                                    !IPAddress.IsLoopback(ip.Address) &&
                                    !ip.Address.ToString().StartsWith("169."))
                                {
                                    ipList.Add(ip.Address.ToString());
                                }
                            }
                        }
                    }
                    var sbIps = new StringBuilder();
                    for (int i = 0; i < ipList.Count; i++)
                    {
                        if (i > 0) sbIps.Append(",");
                        sbIps.Append("\"").Append(ipList[i]).Append("\"");
                    }
                    string defIp = ipList.Count > 0 ? ipList[0] : "127.0.0.1";
                    string json = "{\"ips\":[" + sbIps.ToString() + "],\"defaultIp\":\"" + defIp + "\",\"port\":9876}";
                    byte[] jsonBytes = Encoding.UTF8.GetBytes(json);
                    context.Response.ContentType = "application/json; charset=utf-8";
                    context.Response.ContentLength64 = jsonBytes.Length;
                    context.Response.StatusCode = 200;
                    context.Response.KeepAlive = false;
                    context.Response.OutputStream.Write(jsonBytes, 0, jsonBytes.Length);
                    return;
                }

                if (string.IsNullOrEmpty(relPath)) relPath = "index.html";

                string filePath = Path.Combine(distDirectory, relPath.Replace('/', Path.DirectorySeparatorChar));

                // Fallback to index.html for client-side routing
                if (!File.Exists(filePath))
                {
                    filePath = Path.Combine(distDirectory, "index.html");
                }

                if (File.Exists(filePath))
                {
                    byte[] bytes = File.ReadAllBytes(filePath);
                    context.Response.ContentType = GetMimeType(Path.GetExtension(filePath));
                    context.Response.ContentLength64 = bytes.Length;
                    context.Response.StatusCode = 200;
                    context.Response.KeepAlive = false;

                    if (!string.Equals(context.Request.HttpMethod, "HEAD", StringComparison.OrdinalIgnoreCase))
                    {
                        context.Response.OutputStream.Write(bytes, 0, bytes.Length);
                    }
                }
                else
                {
                    context.Response.StatusCode = 404;
                }
            }
            catch { }
            finally
            {
                try { context.Response.OutputStream.Close(); } catch { }
                try { context.Response.Close(); } catch { }
            }
        }

        static string GetMimeType(string ext)
        {
            switch (ext.ToLowerInvariant())
            {
                case ".html": case ".htm": return "text/html; charset=utf-8";
                case ".js": case ".mjs": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".png": return "image/png";
                case ".jpg": case ".jpeg": return "image/jpeg";
                case ".svg": return "image/svg+xml";
                case ".ico": return "image/x-icon";
                case ".json": return "application/json";
                case ".wasm": return "application/wasm";
                case ".map": return "application/json";
                default: return "application/octet-stream";
            }
        }

        static void StartPendantService(string rootDir)
        {
            try
            {
                string bunPath = @"C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Links\bun.exe";
                if (!File.Exists(bunPath)) bunPath = "bun";

                var psiPendant = new ProcessStartInfo
                {
                    FileName = bunPath,
                    Arguments = "run src/server/pendantServer.ts",
                    WorkingDirectory = rootDir,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                psiPendant.EnvironmentVariables["PATH"] = @"C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Links;" + Environment.GetEnvironmentVariable("PATH");
                pendantProcess = Process.Start(psiPendant);
            }
            catch { }
        }

        static void ShowSplashPopup()
        {
            using (var splash = new SplashForm())
            {
                splash.Show();
                SetForegroundWindow(splash.Handle);
                BringWindowToTop(splash.Handle);

                // Display brand splash for 1.2 seconds
                var sw = Stopwatch.StartNew();
                while (sw.ElapsedMilliseconds < 1200)
                {
                    Application.DoEvents();
                    Thread.Sleep(15);
                }

                // Smooth fade-out
                for (double op = 1.0; op >= 0.05; op -= 0.1)
                {
                    splash.Opacity = op;
                    Application.DoEvents();
                    Thread.Sleep(15);
                }
                splash.Close();
            }
        }

        static IntPtr FindDobotAppWindow()
        {
            IntPtr found = IntPtr.Zero;
            EnumWindows((hWnd, lParam) =>
            {
                StringBuilder sbClass = new StringBuilder(256);
                GetClassName(hWnd, sbClass, sbClass.Capacity);
                if (sbClass.ToString() == "Chrome_WidgetWin_1")
                {
                    int len = GetWindowTextLength(hWnd);
                    if (len > 0)
                    {
                        StringBuilder sbTitle = new StringBuilder(len + 1);
                        GetWindowText(hWnd, sbTitle, sbTitle.Capacity);
                        string title = sbTitle.ToString();
                        if (title.IndexOf("Dobot Studio", StringComparison.OrdinalIgnoreCase) >= 0 ||
                            title.IndexOf("5173", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            found = hWnd;
                            return false;
                        }
                    }
                }
                return true;
            }, IntPtr.Zero);
            return found;
        }

        static void LaunchAppWindow()
        {
            try
            {
                string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
                if (!File.Exists(edgePath))
                {
                    edgePath = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
                }

                string url = "http://127.0.0.1:5173/";
                string userProfile = Path.Combine(Path.GetTempPath(), "DobotStudioAppProfile");
                string args = string.Format("--app=\"{0}\" --user-data-dir=\"{1}\" --remote-debugging-port=9222 --test-type --no-first-run --no-default-browser-check --start-maximized", url, userProfile);

                var psi = new ProcessStartInfo
                {
                    FileName = edgePath,
                    Arguments = args,
                    UseShellExecute = false
                };

                Process edgeProc = Process.Start(psi);
                if (edgeProc != null)
                {
                    try
                    {
                        edgeProc.WaitForExit();
                    }
                    catch { }
                }

                // If edgeProc exited prematurely, double check if window is still alive
                IntPtr targetHwnd = FindDobotAppWindow();
                if (targetHwnd != IntPtr.Zero)
                {
                    while (IsWindow(targetHwnd))
                    {
                        Thread.Sleep(500);
                    }
                }
            }
            finally
            {
                CleanupServices();
            }
        }

        static void CleanupServices()
        {
            isServerRunning = false;
            try { if (staticListener != null) staticListener.Stop(); } catch { }
            try { if (pendantProcess != null && !pendantProcess.HasExited) pendantProcess.Kill(); } catch { }
        }
    }

    /// <summary>
    /// Smooth Minimalist Splash Popup with Rounded Corners and Crisp White 'D' on Dark Blue Gradient.
    /// </summary>
    public class SplashForm : Form
    {
        private Image iconImage;
        private int pulsePhase = 0;
        private System.Windows.Forms.Timer animTimer;

        public SplashForm()
        {
            this.FormBorderStyle = FormBorderStyle.None;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.Size = new Size(460, 260);
            this.BackColor = Color.FromArgb(10, 25, 47); // Dark Midnight Blue #0a192f
            this.ShowInTaskbar = false;
            this.TopMost = true;
            this.DoubleBuffered = true;

            // Rounded corners mask
            this.Region = Region.FromHrgn(Program.CreateRoundRectRgn(0, 0, 461, 261, 28, 28));

            string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "assets", "icon.png");
            if (File.Exists(iconPath))
            {
                iconImage = Image.FromFile(iconPath);
            }

            animTimer = new System.Windows.Forms.Timer();
            animTimer.Interval = 25;
            animTimer.Tick += (s, e) =>
            {
                pulsePhase = (pulsePhase + 6) % 360;
                this.Invalidate();
            };
            animTimer.Start();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics;
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.TextRenderingHint = TextRenderingHint.ClearTypeGridFit;

            using (var path = GetRoundRect(0, 0, this.Width - 1, this.Height - 1, 26))
            {
                // 1. Dark Blue Gradient Background
                using (var brush = new LinearGradientBrush(
                    new Point(0, 0),
                    new Point(this.Width, this.Height),
                    Color.FromArgb(10, 25, 47),   // Deep Midnight Navy #0a192f
                    Color.FromArgb(30, 58, 138)   // Rich Royal Blue #1e3a8a
                ))
                {
                    ColorBlend cb = new ColorBlend(3);
                    cb.Colors = new Color[] { Color.FromArgb(10, 25, 47), Color.FromArgb(15, 43, 92), Color.FromArgb(30, 58, 138) };
                    cb.Positions = new float[] { 0.0f, 0.45f, 1.0f };
                    brush.InterpolationColors = cb;
                    g.FillPath(brush, path);
                }

                // 2. Subtle Cyan Border along the rounded path (Anti-aliased)
                using (var borderPen = new Pen(Color.FromArgb(120, 56, 189, 248), 2.0f))
                {
                    g.DrawPath(borderPen, path);
                }
            }

            // 3. Crisp Minimalist White 'D' Logo
            if (iconImage != null)
            {
                int iconSize = 88;
                int iconX = (this.Width - iconSize) / 2;
                int iconY = 24;
                g.DrawImage(iconImage, new Rectangle(iconX, iconY, iconSize, iconSize));
            }

            // 4. Clean Typographic Wordmark
            using (var fontTitle = new Font("Segoe UI", 16, FontStyle.Bold))
            using (var brushTitle = new SolidBrush(Color.FromArgb(248, 250, 252)))
            {
                string title = "DOBOT STUDIO NEXT";
                SizeF sz = g.MeasureString(title, fontTitle);
                g.DrawString(title, fontTitle, brushTitle, (this.Width - sz.Width) / 2, 126);
            }

            using (var fontSub = new Font("Segoe UI", 9, FontStyle.Regular))
            using (var brushSub = new SolidBrush(Color.FromArgb(148, 163, 184)))
            {
                string sub = "Version 2.0.0 • High-Precision Robotics Suite";
                SizeF sz = g.MeasureString(sub, fontSub);
                g.DrawString(sub, fontSub, brushSub, (this.Width - sz.Width) / 2, 158);
            }

            // 5. Pulsing Cyan Status Aura Line
            double sinVal = Math.Sin(pulsePhase * Math.PI / 180.0);
            int pulseAlpha = (int)(130 + 110 * sinVal);
            using (var pulseBrush = new SolidBrush(Color.FromArgb(pulseAlpha, 56, 189, 248)))
            {
                int barW = 120;
                int barX = (this.Width - barW) / 2;
                using (var barPath = GetRoundRect(barX, 204, barW, 3, 2))
                {
                    g.FillPath(pulseBrush, barPath);
                }
            }
        }

        private GraphicsPath GetRoundRect(int x, int y, int w, int h, int r)
        {
            var path = new GraphicsPath();
            path.AddArc(x, y, r * 2, r * 2, 180, 90);
            path.AddArc(x + w - r * 2, y, r * 2, r * 2, 270, 90);
            path.AddArc(x + w - r * 2, y + h - r * 2, r * 2, r * 2, 0, 90);
            path.AddArc(x, y + h - r * 2, r * 2, r * 2, 90, 90);
            path.CloseFigure();
            return path;
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
}
