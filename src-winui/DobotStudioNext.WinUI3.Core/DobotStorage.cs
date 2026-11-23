using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;

namespace DobotStudioNext.WinUI3.Core
{
    public class DobotProjectDto
    {
        public string Version { get; set; } = "2.0.0";
        public Dictionary<string, double> Variables { get; set; } = new Dictionary<string, double>();
        public List<MotionPointDto> Points { get; set; } = new List<MotionPointDto>();
    }

    public class MotionPointDto
    {
        public string Name { get; set; } = "";
        public string MotionStyle { get; set; } = "MOVJ";
        public string XRaw { get; set; } = "230";
        public string YRaw { get; set; } = "0";
        public string ZRaw { get; set; } = "-10";
        public string RRaw { get; set; } = "0";
        public double PauseTime { get; set; } = 0.0;
        public string ToolAction { get; set; } = "none";
        public string ToolState { get; set; } = "off";
    }

    public static class DobotStorage
    {
        public static void SaveToJson(string filePath, MotionSequence sequence, IReadOnlyDictionary<string, double> variables)
        {
            var dto = new DobotProjectDto
            {
                Variables = new Dictionary<string, double>(variables)
            };

            foreach (var p in sequence.Points)
            {
                dto.Points.Add(new MotionPointDto
                {
                    Name = p.Name,
                    MotionStyle = p.MotionStyle,
                    XRaw = p.XRaw,
                    YRaw = p.YRaw,
                    ZRaw = p.ZRaw,
                    RRaw = p.RRaw,
                    PauseTime = p.PauseTime,
                    ToolAction = p.ToolAction,
                    ToolState = p.ToolState
                });
            }

            var options = new JsonSerializerOptions { WriteIndented = true };
            string json = JsonSerializer.Serialize(dto, options);
            File.WriteAllText(filePath, json, Encoding.UTF8);
        }

        public static bool LoadFromJson(string filePath, out MotionSequence sequence, out Dictionary<string, double> variables)
        {
            sequence = new MotionSequence();
            variables = new Dictionary<string, double>();

            if (!File.Exists(filePath)) return false;

            try
            {
                string json = File.ReadAllText(filePath, Encoding.UTF8);
                var dto = JsonSerializer.Deserialize<DobotProjectDto>(json);
                if (dto == null) return false;

                if (dto.Variables != null)
                {
                    variables = dto.Variables;
                }

                if (dto.Points != null)
                {
                    int idx = 1;
                    foreach (var pt in dto.Points)
                    {
                        sequence.Points.Add(new MotionPoint
                        {
                            Index = idx++,
                            Name = pt.Name,
                            MotionStyle = pt.MotionStyle,
                            XRaw = pt.XRaw,
                            YRaw = pt.YRaw,
                            ZRaw = pt.ZRaw,
                            RRaw = pt.RRaw,
                            PauseTime = pt.PauseTime,
                            ToolAction = pt.ToolAction,
                            ToolState = pt.ToolState
                        });
                    }
                }
                return true;
            }
            catch
            {
                return false;
            }
        }

        public static string ExportToPlaybackXml(MotionSequence sequence)
        {
            var doc = new XDocument(
                new XDeclaration("1.0", "utf-8", "yes"),
                new XElement("playback",
                    new XAttribute("version", "1.0.0"),
                    new XElement("pointList")
                )
            );

            var listEl = doc.Root?.Element("pointList");
            if (listEl != null)
            {
                foreach (var p in sequence.Points)
                {
                    int isSuction = (p.ToolAction == "suction_cup" && p.ToolState == "on") ? 1 : 0;
                    int isGripper = (p.ToolAction == "gripper") ? 1 : 0;
                    int isLaser = (p.ToolAction == "laser") ? 1 : 0;

                    var pointEl = new XElement("point",
                        new XAttribute("name", p.Name),
                        new XAttribute("motionStyle", p.MotionStyle),
                        new XAttribute("x", p.XInt),
                        new XAttribute("y", p.YInt),
                        new XAttribute("z", p.ZInt),
                        new XAttribute("r", p.RInt),
                        new XAttribute("pauseTime", p.PauseTime),
                        new XAttribute("isSuctionCup", isSuction),
                        new XAttribute("isGripper", isGripper),
                        new XAttribute("isLaser", isLaser)
                    );
                    listEl.Add(pointEl);
                }
            }

            return doc.ToString();
        }
    }
}
