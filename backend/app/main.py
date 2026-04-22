import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.config import APP_NAME, FRONTEND_ORIGINS, OUTPUT_DIR
from app.generator import generate_content_calendar
from app.schemas import GenerateCalendarRequest
from app.utils import build_platform_summary

app = FastAPI(title=APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok", "app_name": APP_NAME}


@app.post("/generate")
def generate(request: GenerateCalendarRequest):
    result = generate_content_calendar(
        company_details=request.company_details,
        weekly_focus=request.weekly_focus,
        tone=request.tone,
        platforms=request.platforms,
        posts_per_day=request.posts_per_day,
        number_of_days=request.number_of_days,
        call_to_action=request.call_to_action or "Encourage engagement or consultation",
        target_audience=request.target_audience or "Decision-makers and potential buyers",
        output_file_name=request.output_file_name or "content-calendar",
    )

    records = result["records"]
    platform_summary = build_platform_summary(records, request.platforms)

    return {
        "records": records,
        "file_name": result["file_name"],
        "download_url": f"/download/{result['file_name']}",
        "platform_summary": platform_summary,
        "total_rows": len(records),
        "generation_mode": result.get("generation_mode"),
        "warning": result.get("warning"),
    }


@app.get("/download/{file_name}")
def download_file(file_name: str):
    output_root = os.path.abspath(OUTPUT_DIR)
    file_path = os.path.abspath(os.path.join(output_root, file_name))

    if os.path.commonpath([output_root, file_path]) != output_root or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=file_name,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
