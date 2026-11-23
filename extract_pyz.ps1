$code = @"
using System;
using System.IO;
using System.IO.Compression;
using System.Collections.Generic;
using System.Text;

public class PyzEntryInfo {
    public string Name;
    public int IsPkg;
    public int Pos;
    public int Length;
}

public class PyzExtractor {
    public static List<PyzEntryInfo> ExtractAll(string exePath, long pyzBase, long tocOffset, string outDir) {
        var list = new List<PyzEntryInfo>();
        var refs = new List<object>();

        byte[] pycHeader = new byte[] { 0x16, 0x0D, 0x0D, 0x0A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };

        using (var fs = File.OpenRead(exePath)) {
            fs.Seek(tocOffset, SeekOrigin.Begin);
            using (var reader = new BinaryReader(fs)) {
                byte typeTag = reader.ReadByte();
                if ((typeTag & 0x80) != 0) {
                    refs.Add(new Dictionary<object, object>());
                }
                int count = reader.ReadInt32();

                Func<object> readObj = null;
                readObj = () => {
                    byte tag = reader.ReadByte();
                    bool flag = (tag & 0x80) != 0;
                    byte rawTag = (byte)(tag & 0x7F);

                    int slot = -1;
                    if (flag) {
                        slot = refs.Count;
                        refs.Add(null);
                    }

                    object result = null;
                    switch ((char)rawTag) {
                        case 'z': // short ascii
                        case 'Z': // short ascii interned
                        {
                            int len = reader.ReadByte();
                            byte[] sbytes = reader.ReadBytes(len);
                            result = Encoding.ASCII.GetString(sbytes);
                            break;
                        }
                        case 'a': // ascii
                        case 'A': // ascii interned
                        case 'u': // unicode
                        case 's': // string
                        case 't': // interned
                        {
                            int len = reader.ReadInt32();
                            byte[] sbytes = reader.ReadBytes(len);
                            result = Encoding.UTF8.GetString(sbytes);
                            break;
                        }
                        case 'r': // ref
                        {
                            int refIdx = reader.ReadInt32();
                            return refs[refIdx];
                        }
                        case ')': // small tuple
                        {
                            int tlen = reader.ReadByte();
                            object[] tuple = new object[tlen];
                            if (flag) refs[slot] = tuple;
                            for (int i = 0; i < tlen; i++) {
                                tuple[i] = readObj();
                            }
                            result = tuple;
                            break;
                        }
                        case '(': // tuple
                        {
                            int tlen = reader.ReadInt32();
                            object[] tuple = new object[tlen];
                            if (flag) refs[slot] = tuple;
                            for (int i = 0; i < tlen; i++) {
                                tuple[i] = readObj();
                            }
                            result = tuple;
                            break;
                        }
                        case 'i':
                        case 'I':
                        case (char)0xE9:
                        {
                            result = reader.ReadInt32();
                            break;
                        }
                        case 'e':
                        {
                            result = reader.ReadDouble();
                            break;
                        }
                        case 'N': result = null; break;
                        case 'T': result = true; break;
                        case 'F': result = false; break;
                        default:
                            throw new Exception(string.Format("Unknown marshal tag: 0x{0:X2} at pos {1}", rawTag, fs.Position - 1));
                    }

                    if (flag) refs[slot] = result;
                    return result;
                };

                for (int i = 0; i < count; i++) {
                    object item = readObj();
                    object[] pair = item as object[];
                    if (pair != null && pair.Length == 2) {
                        string name = pair[0] as string;
                        object[] vals = pair[1] as object[];
                        if (name != null && vals != null && vals.Length >= 3) {
                            try {
                                int isPkg = Convert.ToInt32(vals[0]);
                                int pos = Convert.ToInt32(vals[1]);
                                int len = Convert.ToInt32(vals[2]);
                                list.Add(new PyzEntryInfo { Name = name, IsPkg = isPkg, Pos = pos, Length = len });
                            } catch (Exception) {
                                Console.WriteLine("FAILED at i={0}, name={1}: vals[0]={2} ({3}), vals[1]={4} ({5}), vals[2]={6} ({7})",
                                    i, name,
                                    vals[0], vals[0] != null ? vals[0].GetType().Name : "null",
                                    vals[1], vals[1] != null ? vals[1].GetType().Name : "null",
                                    vals[2], vals[2] != null ? vals[2].GetType().Name : "null");
                                throw;
                            }
                        }
                    }
                }
            } // end reader

            using (var fs2 = File.OpenRead(exePath)) {
                // Now extract and decompress all files
                Directory.CreateDirectory(outDir);
                int successCount = 0;
                foreach (var entry in list) {
                    fs2.Seek(pyzBase + entry.Pos, SeekOrigin.Begin);
                    byte[] cmprsd = new byte[entry.Length];
                    int read = fs2.Read(cmprsd, 0, entry.Length);
                    if (read != entry.Length) continue;

                    // Decompress (zlib: skip 2 bytes header, skip 4 bytes Adler32 checksum)
                    byte[] decompressed = null;
                    try {
                        using (var ms = new MemoryStream(cmprsd, 2, cmprsd.Length - 6))
                        using (var deflate = new DeflateStream(ms, CompressionMode.Decompress))
                        using (var outMs = new MemoryStream()) {
                            deflate.CopyTo(outMs);
                            decompressed = outMs.ToArray();
                        }
                    } catch {
                        continue;
                    }

                    if (decompressed == null) continue;

                    string relPath = entry.Name.Replace('.', Path.DirectorySeparatorChar);
                    if (entry.IsPkg == 1) {
                        relPath = Path.Combine(relPath, "__init__.pyc");
                    } else {
                        relPath += ".pyc";
                    }

                    string fullPath = Path.Combine(outDir, relPath);
                    string dir = Path.GetDirectoryName(fullPath);
                    if (!Directory.Exists(dir)) {
                        Directory.CreateDirectory(dir);
                    }

                    using (var outFile = File.Create(fullPath)) {
                        outFile.Write(pycHeader, 0, pycHeader.Length);
                        outFile.Write(decompressed, 0, decompressed.Length);
                    }
                    successCount++;
                }
                Console.WriteLine("Extracted {0} of {1} pyc files successfully.", successCount, list.Count);
            }
        }

        return list;
    }
}
"@
Add-Type -TypeDefinition $code -Language CSharp
$outDir = "C:\Users\Administrator\.gemini\antigravity\scratch\dobot-studio-qol\extracted_pyc"
$entries = [PyzExtractor]::ExtractAll("C:\DobotStudio\RunDobot.exe", 238346, 8485114, $outDir)
Write-Output "Parsed $($entries.Count) modules!"
$entries | Where-Object { $_.Name -like "*dobot*" -or $_.Name -like "*Main*" } | Format-Table -AutoSize
