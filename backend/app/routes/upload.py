import os

from fastapi import (
    APIRouter,
    File,
    HTTPException,
    UploadFile,
)

from app.services.file_service import save_pdf
from app.services.pdf_service import (
    convert_pdf_to_base64_images,
)
from app.services.ai_service import (
    extract_and_map_assessment,
)


router = APIRouter(
    prefix="/api",
    tags=["Assessment"],
)


@router.post("/process")
async def process_assessment(
    question_paper: UploadFile = File(...),
    answer_sheet: UploadFile = File(...),
):

    qp_path = None
    ans_path = None

    try:

        # ======================================================
        # SAVE FILES
        # ======================================================

        qp_file_info = await save_pdf(
            question_paper
        )

        ans_file_info = await save_pdf(
            answer_sheet
        )

        qp_path = qp_file_info["path"]
        ans_path = ans_file_info["path"]


        # ======================================================
        # PDF → BASE64 IMAGES
        # ======================================================

        qp_images = (
            convert_pdf_to_base64_images(
                qp_path
            )
        )

        ans_images = (
            convert_pdf_to_base64_images(
                ans_path
            )
        )


        # ======================================================
        # GEMINI EVALUATION
        # ======================================================

        ai_data = (
            await extract_and_map_assessment(
                qp_images,
                ans_images
            )
        )


        # ======================================================
        # RESPONSE
        # ======================================================

        return {
            "success": True,

            "summary":
                ai_data.get(
                    "summary",
                    {}
                ),

            "questions":
                ai_data.get(
                    "questions",
                    []
                ),

            "answer_sheet_images":
                ans_images,
        }


    except Exception as err:

        print(
            "Processing Error:",
            err
        )

        raise HTTPException(
            status_code=500,
            detail=str(err)
        )


    finally:

        if (
            qp_path and
            os.path.exists(qp_path)
        ):
            os.remove(qp_path)

        if (
            ans_path and
            os.path.exists(ans_path)
        ):
            os.remove(ans_path)