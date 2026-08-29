import fitz  # PyMuPDF
import io
import re
import base64
from typing import Union
from PIL import Image


def convert_pdf_to_base64_images(pdf_input: Union[str, bytes]) -> list[str]:
    """Renders PDF pages as high-resolution base64 JPEG strings."""
    if isinstance(pdf_input, bytes):
        doc = fitz.open(stream=pdf_input, filetype="pdf")
    else:
        doc = fitz.open(pdf_input)

    base64_images = []
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")

        buffered = io.BytesIO()
        img.save(buffered, format="JPEG", quality=90)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        base64_images.append(img_str)

    doc.close()
    return base64_images


def normalize_q_key(text: str) -> str:
    """Normalizes keys like 'Q1(a)', '1(a)', '1.a', 'Q1.' -> '1(a)'"""
    text = text.strip().upper().replace(" ", "")
    text = re.sub(r"^ANS(?:WER)?", "", text)
    text = re.sub(r"^Q", "", text)
    text = text.rstrip(".:-)")
    return text.lower()


def extract_answer_sheet_boxes(pdf_input: Union[str, bytes]) -> dict:
    """
    Layout-aware parser that correctly detects sub-questions (e.g., Q1(a), Q1(b), Q2(a))
    and wraps all multi-line answers until the next question starts.
    """
    if isinstance(pdf_input, bytes):
        doc = fitz.open(stream=pdf_input, filetype="pdf")
    else:
        doc = fitz.open(pdf_input)

    detected_boxes = {}

    # Regex matches: "Q1(a)", "1(a)", "Q1(b)", "1.", "2.", "Ans 1(a)"
    ANCHOR_REGEX = re.compile(
        r"^(?:ANS(?:WER)?\s*|Q\s*)?(\d+(?:\s*\([a-zA-Z0-9]+\)|\.[a-zA-Z0-9]+)?)[\.:\)\s]",
        re.IGNORECASE
    )

    for page_idx, page in enumerate(doc):
        page_num = page_idx + 1
        page_rect = page.rect
        page_width = page_rect.width
        page_height = page_rect.height

        text_dict = page.get_text("dict")
        all_lines = []

        # Extract all physical text lines with geometric bounds
        for block in text_dict.get("blocks", []):
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                line_text = "".join(span.get("text", "") for span in line.get("spans", [])).strip()
                if not line_text:
                    continue

                # Ignore printed headers & banners
                if "Answer Sheet" in line_text or "Assessment Evaluator" in line_text:
                    continue
                if line["bbox"][1] / page_height < 0.10:
                    continue

                all_lines.append({
                    "text": line_text,
                    "bbox": fitz.Rect(line["bbox"]),
                    "y0": line["bbox"][1],
                })

        # Sort visual lines strictly from top to bottom
        all_lines.sort(key=lambda item: item["y0"])

        current_q_key = None
        current_rect = None

        def commit_current_box(q_key, rect):
            if not q_key or not rect:
                return
            ymin = max(0, int(((rect.y0 - 2) / page_height) * 1000))
            xmin = max(0, int(((rect.x0 - 6) / page_width) * 1000))
            ymax = min(1000, int(((rect.y1 + 4) / page_height) * 1000))
            xmax = min(1000, int(((rect.x1 + 10) / page_width) * 1000))

            detected_boxes[q_key] = {
                "page_number": page_num,
                "bounding_box": {
                    "ymin": ymin,
                    "xmin": xmin,
                    "ymax": ymax,
                    "xmax": xmax,
                }
            }

        for item in all_lines:
            line_str = item["text"]
            match = ANCHOR_REGEX.match(line_str)

            if match:
                # Commit previous question before starting new one
                if current_q_key and current_rect:
                    commit_current_box(current_q_key, current_rect)

                raw_matched = match.group(1).replace(" ", "")
                current_q_key = normalize_q_key(raw_matched)
                current_rect = fitz.Rect(item["bbox"])
            elif current_q_key and current_rect:
                # Merge multi-line text into the active answer box
                current_rect |= item["bbox"]

        # Commit the last answer on the page
        if current_q_key and current_rect:
            commit_current_box(current_q_key, current_rect)

    doc.close()
    return detected_boxes