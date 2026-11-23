using System;
using System.Collections.Generic;
using System.Globalization;
using System.Text.RegularExpressions;

namespace DobotStudioNext.WinUI3.Core
{
    public class FormulaInspectionInfo
    {
        public bool IsFormula { get; set; }
        public string Expression { get; set; } = string.Empty;
        public int EvaluatedInt { get; set; }
        public string? Error { get; set; }
    }

    public class FormulaEngine
    {
        private readonly Dictionary<string, double> _variables = new Dictionary<string, double>(StringComparer.OrdinalIgnoreCase);

        public void SetVariable(string name, double value)
        {
            if (string.IsNullOrWhiteSpace(name)) return;
            _variables[name.Trim()] = value;
        }

        public bool TryGetVariable(string name, out double value)
        {
            return _variables.TryGetValue(name.Trim(), out value);
        }

        public bool RemoveVariable(string name)
        {
            return _variables.Remove(name.Trim());
        }

        public IReadOnlyDictionary<string, double> GetAllVariables()
        {
            return _variables;
        }

        public FormulaInspectionInfo Inspect(string expression)
        {
            if (string.IsNullOrWhiteSpace(expression))
            {
                return new FormulaInspectionInfo { IsFormula = false, Expression = "", EvaluatedInt = 0 };
            }

            string clean = expression.Trim();
            bool isFormula = clean.StartsWith("=") || Regex.IsMatch(clean, @"[a-zA-Z+\-*/^()]");
            int val = EvaluateToPlainInt(clean, out string error);

            return new FormulaInspectionInfo
            {
                IsFormula = isFormula,
                Expression = clean,
                EvaluatedInt = val,
                Error = string.IsNullOrEmpty(error) ? null : error
            };
        }

        public int EvaluateToPlainInt(string expression, out string error)
        {
            error = string.Empty;
            if (string.IsNullOrWhiteSpace(expression))
            {
                return 0;
            }

            string input = expression.Trim();
            if (input.StartsWith("="))
            {
                input = input.Substring(1).Trim();
            }

            // Quick check: if pure integer
            if (int.TryParse(input, NumberStyles.Integer, CultureInfo.InvariantCulture, out int directInt))
            {
                return directInt;
            }

            try
            {
                var parser = new ExpressionParser(input, _variables);
                double result = parser.Parse();
                return (int)Math.Round(result, MidpointRounding.AwayFromZero);
            }
            catch (Exception ex)
            {
                error = ex.Message;
                return 0;
            }
        }

        private class ExpressionParser
        {
            private readonly string _text;
            private readonly Dictionary<string, double> _vars;
            private int _pos = 0;

            public ExpressionParser(string text, Dictionary<string, double> vars)
            {
                _text = text;
                _vars = vars;
            }

            public double Parse()
            {
                SkipWhitespace();
                double result = ParseExpression();
                SkipWhitespace();
                if (_pos < _text.Length)
                {
                    throw new Exception($"Unexpected token '{_text[_pos]}' at position {_pos}");
                }
                return result;
            }

            private double ParseExpression()
            {
                double left = ParseTerm();
                while (true)
                {
                    SkipWhitespace();
                    if (_pos >= _text.Length) break;

                    char op = _text[_pos];
                    if (op == '+' || op == '-')
                    {
                        _pos++;
                        double right = ParseTerm();
                        left = (op == '+') ? left + right : left - right;
                    }
                    else
                    {
                        break;
                    }
                }
                return left;
            }

            private double ParseTerm()
            {
                double left = ParseFactor();
                while (true)
                {
                    SkipWhitespace();
                    if (_pos >= _text.Length) break;

                    char op = _text[_pos];
                    if (op == '*' || op == '/')
                    {
                        _pos++;
                        double right = ParseFactor();
                        if (op == '/')
                        {
                            if (Math.Abs(right) < 1e-12) throw new DivideByZeroException("Division by zero");
                            left = left / right;
                        }
                        else
                        {
                            left = left * right;
                        }
                    }
                    else
                    {
                        break;
                    }
                }
                return left;
            }

            private double ParseFactor()
            {
                double left = ParsePrimary();
                SkipWhitespace();
                if (_pos < _text.Length && _text[_pos] == '^')
                {
                    _pos++;
                    double right = ParseFactor(); // right-associative power
                    return Math.Pow(left, right);
                }
                return left;
            }

            private double ParsePrimary()
            {
                SkipWhitespace();
                if (_pos >= _text.Length)
                {
                    throw new Exception("Unexpected end of expression");
                }

                char ch = _text[_pos];

                // Unary plus/minus
                if (ch == '+')
                {
                    _pos++;
                    return ParsePrimary();
                }
                if (ch == '-')
                {
                    _pos++;
                    return -ParsePrimary();
                }

                // Parenthesized sub-expression
                if (ch == '(')
                {
                    _pos++;
                    double sub = ParseExpression();
                    SkipWhitespace();
                    if (_pos >= _text.Length || _text[_pos] != ')')
                    {
                        throw new Exception("Missing closing parenthesis ')'");
                    }
                    _pos++;
                    return sub;
                }

                // Number
                if (char.IsDigit(ch) || ch == '.')
                {
                    int start = _pos;
                    bool hasDot = (ch == '.');
                    _pos++;
                    while (_pos < _text.Length && (char.IsDigit(_text[_pos]) || (!hasDot && _text[_pos] == '.')))
                    {
                        if (_text[_pos] == '.') hasDot = true;
                        _pos++;
                    }
                    string numStr = _text.Substring(start, _pos - start);
                    if (double.TryParse(numStr, NumberStyles.Float, CultureInfo.InvariantCulture, out double numVal))
                    {
                        return numVal;
                    }
                    throw new Exception($"Invalid number literal: '{numStr}'");
                }

                // Variable identifier
                if (char.IsLetter(ch) || ch == '_')
                {
                    int start = _pos;
                    _pos++;
                    while (_pos < _text.Length && (char.IsLetterOrDigit(_text[_pos]) || _text[_pos] == '_'))
                    {
                        _pos++;
                    }
                    string varName = _text.Substring(start, _pos - start);
                    if (_vars.TryGetValue(varName, out double varVal))
                    {
                        return varVal;
                    }
                    throw new Exception($"Undefined variable: '{varName}'");
                }

                throw new Exception($"Unexpected character: '{ch}'");
            }

            private void SkipWhitespace()
            {
                while (_pos < _text.Length && char.IsWhiteSpace(_text[_pos]))
                {
                    _pos++;
                }
            }
        }
    }
}
