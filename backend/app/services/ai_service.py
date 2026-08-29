import os
import json
import base64

from google import genai
from google.genai import types
from dotenv import load_dotenv


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


# ============================================================
# GEMINI PROMPT
# ============================================================

PROMPT = """
You are an expert exam evaluator, OCR engine, and visual document-grounding system.

You will receive:

1. Question Paper pages
2. Student Answer Sheet pages

Your job is to extract questions, identify the corresponding student answers,
grade them, and provide an accurate visual bounding box around each student's
answer.

============================================================
TASK 1 — QUESTION EXTRACTION
============================================================

Extract every question/sub-question from the Question Paper.

For every question return:

- question number
- complete question text
- maximum marks

Preserve sub-question numbers such as:

Q1(a)
Q1(b)
Q2(a)
Q2(b)

Do not merge separate sub-questions.

============================================================
TASK 2 — ANSWER IDENTIFICATION
============================================================

For every extracted question, locate the corresponding answer on the
Student Answer Sheet.

The answer may:

- start on the same line as the question number
- continue across multiple lines
- contain several sentences
- contain mathematical expressions
- contain code
- continue onto the next physical line

The answer belongs to the question number written by the student.

For example:

Q2(a) A tuple is mutable, so its elements can be changed
after creation.

The COMPLETE answer is BOTH lines.

============================================================
TASK 3 — PRECISE ANSWER BOUNDING BOX
============================================================

For every answered question, return ONE bounding box containing ONLY
the student's answer to THAT question.

This is a visual localization task.

IMPORTANT:

Do NOT include the previous question's answer.

Do NOT include the next question's answer.

Do NOT use the question paper coordinates.

Do NOT create a box based on semantic similarity.

The bounding box must be determined ONLY by visually inspecting the
student answer sheet image.

------------------------------------------------------------
STRICT QUESTION BOUNDARY RULE
------------------------------------------------------------

Answers on the answer sheet are normally written sequentially:

Question 1 answer
Question 2 answer
Question 3 answer
Question 4 answer
...

For question N:

START:
The box starts at the top of the question number and/or first answer
line belonging to question N.

END:
The box ends immediately after the LAST visible line belonging to
question N.

The box MUST stop BEFORE question N+1 begins.

------------------------------------------------------------
CRITICAL EXAMPLE
------------------------------------------------------------

If the answer sheet contains:

7. Accuracy = (80/100) x 100 = 80%.

8. Preprocessing cleans and transforms raw data,
   handles missing values and inconsistent formats,
   and prepares useful features.

9. INNER JOIN returns only rows that have matching
   values in both tables.

Then:

Q7 bounding box:
ONLY question 7 answer.

Q8 bounding box:
ONLY question 8 answer.

Q9 bounding box:
ONLY question 9 answer.

Q8 MUST NOT contain any part of Q7.

Q8 MUST NOT contain any part of Q9.

------------------------------------------------------------
MULTI-LINE RULE
------------------------------------------------------------

If Q8 has 3 lines:

8. Preprocessing cleans and transforms raw data,
   handles missing values and inconsistent formats,
   and prepares useful features.

Then:

ymin = top of line containing "8."
ymax = bottom of "features."

Do NOT set ymin at question 7.

Do NOT set ymax after question 9.

------------------------------------------------------------
VISUAL CHECK BEFORE RETURNING
------------------------------------------------------------

For each answer:

1. Find the question number.
2. Find the first line belonging to that question.
3. Find every continuation line.
4. Find the final line of that answer.
5. Locate the next question.
6. Ensure the bounding box ends BEFORE the next question.
7. Verify that no line from the previous or next question is inside.
8. Add only 5-10 normalized coordinate units of padding.

If uncertain, prefer a TIGHTER box rather than including neighboring
answers.

============================================================
TASK 4 — GRADING
============================================================

Evaluate every answer against the corresponding question.

Return:

status:

- "correct"
- "partially_correct"
- "incorrect"
- "unanswered"

Also return:

- marks_awarded
- feedback
- is_answered

Be careful that answers correspond to the CORRECT question number.

============================================================
TASK 5 — SUMMARY
============================================================

Calculate:

- total marks obtained
- total maximum marks
- overall percentage
- total questions
- attempted count
- correct count
- strengths
- areas for improvement
- overall feedback

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

Use exactly this structure:

{
  "summary": {
    "total_marks_obtained": 21,
    "total_max_marks": 32,
    "overall_percentage": 65.63,
    "total_questions": 16,
    "attempted_count": 16,
    "correct_count": 10,
    "strengths": "Clear definitions for AI/ML concepts.",
    "areas_for_improvement": "Review Python data type mutability.",
    "overall_feedback": "A mixed performance with good understanding of core concepts."
  },

  "questions": [
    {
      "id": "q1a",
      "question_number": "1(a)",
      "question_text": "Define Artificial Intelligence (AI). Give one real-world application.",
      "max_marks": 2,
      "marks_awarded": 2,
      "status": "correct",
      "is_answered": true,
      "feedback": "Correct definition and relevant example.",
      "page_number": 1,
      "bounding_box": {
        "ymin": 150,
        "xmin": 80,
        "ymax": 310,
        "xmax": 900
      }
    }
  ]
}

Rules:

- Return one object for every question/sub-question.
- Do not omit unanswered questions.
- Unanswered questions must have:
  "is_answered": false
  "status": "unanswered"
  "bounding_box": null
- Answered questions must have a bounding_box.
- bounding_box coordinates must be integers from 0 to 1000.
- Never return markdown.
- Never return explanatory text outside JSON.
"""


# ============================================================
# BASE64 IMAGE → BYTES
# ============================================================

def b64_to_bytes(b64_str: str) -> bytes:
    return base64.b64decode(b64_str)


# ============================================================
# MAIN AI PROCESSING FUNCTION
# ============================================================

async def extract_and_map_assessment(
    qp_images: list[str],
    ans_images: list[str]
) -> dict:

    parts = [
        PROMPT
    ]

    # ========================================================
    # QUESTION PAPER
    # ========================================================

    parts.append(
        "=== QUESTION PAPER ==="
    )

    for idx, img in enumerate(qp_images):

        parts.append(
            f"Question Paper Page {idx + 1}:"
        )

        parts.append(
            types.Part.from_bytes(
                data=b64_to_bytes(img),
                mime_type="image/jpeg"
            )
        )

    # ========================================================
    # ANSWER SHEET
    # ========================================================

    parts.append(
        "=== STUDENT ANSWER SHEET ==="
    )

    for idx, img in enumerate(ans_images):

        parts.append(
            f"Answer Sheet Page {idx + 1}:"
        )

        parts.append(
            types.Part.from_bytes(
                data=b64_to_bytes(img),
                mime_type="image/jpeg"
            )
        )

    # ========================================================
    # SEND TO GEMINI
    # ========================================================

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=parts,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=0.0
        )
    )

    # ========================================================
    # PARSE GEMINI JSON RESPONSE
    # ========================================================

    try:

        result = json.loads(
            response.text
        )

    except json.JSONDecodeError as error:

        print(
            "Gemini returned invalid JSON:"
        )

        print(
            response.text
        )

        raise ValueError(
            f"Invalid JSON returned by Gemini: {error}"
        )

    return result