Each part file is a JSON array of question objects:
{
  "id": "1B-07",                       // subdomain code + 2-digit sequence
  "domain": 1,                         // 1 Foundational Concepts, 2 SL Planning & Teaching, 3 Ethical Standards
  "subdomain": "1B",                   // 1A 1B 1C 1D 2A 2B 2C 3A 3B
  "level": "recall",                   // "recall" | "application" | "analysis"
  "topic": "Orthography: spelling generalizations",   // short tag tied to the handbook outline indicator
  "stem": "Question text. Plain text; may use <em>, <strong>, <u> for marking words.",
  "data": {                            // OPTIONAL — tabular data for analysis items
    "title": "Mid-year assessment results",
    "headers": ["Measure", "Score", "Percentile"],
    "rows": [["Oral reading fluency (WCPM)", "48", "12th"]],
    "note": "Standard scores: mean = 100, SD = 15"
  },
  "sample": "OPTIONAL — preformatted student work (spelling list, writing sample, reading errors). Newlines preserved.",
  "options": ["four", "answer", "choices", "exactly"],
  "answer": 2,                         // 0-based index of the correct option
  "explanation": "2-4 sentences: why the key is right and why the most tempting distractor is wrong."
}
