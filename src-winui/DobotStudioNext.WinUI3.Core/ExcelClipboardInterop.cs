using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace DobotStudioNext.WinUI3.Core
{
    public static class ExcelClipboardInterop
    {
        public static string ExportToTsv(IEnumerable<MotionPoint> points)
        {
            var sb = new StringBuilder();
            sb.AppendLine("Name\tMotion\tX\tY\tZ\tR\tPause\tTool\tState");
            foreach (var p in points)
            {
                sb.AppendLine($"{p.Name}\t{p.MotionStyle}\t{p.XInt}\t{p.YInt}\t{p.ZInt}\t{p.RInt}\t{p.PauseTime}\t{p.ToolAction}\t{p.ToolState}");
            }
            return sb.ToString();
        }

        public static List<MotionPoint> ImportFromTsv(string tsvText, FormulaEngine engine)
        {
            var list = new List<MotionPoint>();
            if (string.IsNullOrWhiteSpace(tsvText)) return list;

            using (var reader = new StringReader(tsvText))
            {
                string? line;
                bool isFirst = true;
                while ((line = reader.ReadLine()) != null)
                {
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    string[] parts = line.Split('\t');
                    if (parts.Length < 6) continue;

                    // Skip header if present
                    if (isFirst && parts[0].Trim().Equals("Name", StringComparison.OrdinalIgnoreCase))
                    {
                        isFirst = false;
                        continue;
                    }
                    isFirst = false;

                    var p = new MotionPoint
                    {
                        Name = parts[0].Trim(),
                        MotionStyle = parts.Length > 1 ? parts[1].Trim() : "MOVJ",
                        XRaw = parts.Length > 2 ? parts[2].Trim() : "230",
                        YRaw = parts.Length > 3 ? parts[3].Trim() : "0",
                        ZRaw = parts.Length > 4 ? parts[4].Trim() : "-10",
                        RRaw = parts.Length > 5 ? parts[5].Trim() : "0",
                        PauseTime = (parts.Length > 6 && double.TryParse(parts[6].Trim(), out double pt)) ? pt : 0.0,
                        ToolAction = parts.Length > 7 ? parts[7].Trim() : "none",
                        ToolState = parts.Length > 8 ? parts[8].Trim() : "off"
                    };
                    p.Evaluate(engine);
                    list.Add(p);
                }
            }
            return list;
        }
    }
}
