# KPEERI Practice Exam

A free, full-length practice exam for the **Knowledge and Practice Examination for Effective Reading Instruction (KPEERI)**, the International Dyslexia Association's certification exam for teachers of reading.

**Take it here:** https://jchappellmedia.github.io/kpeeri-practice-exam/

## What's in it

- **110 original multiple-choice questions**, each with an explanation of why the answer is right and why the most tempting wrong answer is wrong.
- **Built to IDA's published blueprint** (KPEERI Handbook 2026, Appendix A). The real exam has 100 scored questions plus 10 unscored pretest questions; here all 110 count, spread in the same proportions:

| Domain | Real exam (scored) | This exam |
|---|---:|---:|
| **Foundational Concepts** | **54** | **59** |
| Oral and written language learning | 10 | 11 |
| Structure of language | 17 | 19 |
| Recognition and intervention of reading difficulties | 12 | 13 |
| Assessment | 15 | 16 |
| **Structured Literacy Planning and Teaching** | **38** | **42** |
| Lesson planning | 13 | 14 |
| Lesson implementation | 18 | 20 |
| Managing the learning environment | 7 | 8 |
| **Ethical Standards** | **8** | **9** |
| Trust | 5 | 6 |
| Respect | 3 | 3 |

- **Question types** follow the real exam's mix: recall (34%), application (48%), and analysis of student data (18%).
- **Timed mode**: two hours, random order, flag-for-review, a question list to jump around, and a score report by domain and question type.
- **Study mode**: untimed drills by topic, or only the questions you've missed, with feedback after each answer.
- Progress is saved in your browser (localStorage). Nothing is sent to a server.

## Scoring note

The real KPEERI reports a scaled score from 200 to 800; 500 passes. IDA does not publish how many correct answers equal 500, so the percentage here is a readiness check, not a predicted score.

## Disclaimer

This is an independent study resource. It is not affiliated with, endorsed by, or reviewed by the International Dyslexia Association or Meazure Learning. All questions are original; none are taken from the actual exam.

Found a mistake in a question? Please [open an issue](https://github.com/jchappellmedia/kpeeri-practice-exam/issues) with the question text and what you think is wrong.

## Files

- `index.html`, `assets/` — the site (plain HTML, CSS, and JavaScript; no build step)
- `data/questions.json` — the question bank (source of truth)
- `data/questions.js` — the same bank wrapped for the browser; regenerate it after editing the JSON:

```sh
python3 -c "import json; q=json.load(open('data/questions.json')); open('data/questions.js','w').write('/* Generated from questions.json */\nwindow.KPEERI_QUESTIONS = '+json.dumps(q, ensure_ascii=False)+';\n')"
```

- `data/SCHEMA.md` — the question format
