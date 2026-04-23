import os

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.config import (
    APP_NAME,
    FRONTEND_ORIGINS,
    MONGODB_URI_CONFIGURED,
    OPENAI_API_KEY_CONFIGURED,
    OPENAI_MODEL,
    OUTPUT_DIR,
)
from app.database import get_history_store
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
    history_store = get_history_store()
    return {
        "status": "ok",
        "app_name": APP_NAME,
        "ai_configured": OPENAI_API_KEY_CONFIGURED,
        "openai_model": OPENAI_MODEL,
        "mongo_configured": MONGODB_URI_CONFIGURED,
        "storage_backend": history_store.storage_backend,
        "storage_warning": history_store.storage_warning,
    }


def get_required_user_id(user_id: str | None) -> str:
    clean_user_id = (user_id or "").strip()
    if not clean_user_id:
        raise HTTPException(status_code=401, detail="Sign in is required.")
    return clean_user_id


def summarize_company_details(company_details: str) -> str:
    summary = " ".join(company_details.split())
    return summary[:120] + ("..." if len(summary) > 120 else "")


@app.post("/generate")
def generate(request: GenerateCalendarRequest, x_forgeflow_user_id: str | None = Header(default=None)):
    user_id = get_required_user_id(x_forgeflow_user_id)
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
    response_payload = {
        "records": records,
        "file_name": result["file_name"],
        "download_url": f"/download/{result['file_name']}",
        "platform_summary": platform_summary,
        "total_rows": len(records),
        "generation_mode": result.get("generation_mode"),
        "warning": result.get("warning"),
    }

    get_history_store().save_generation(
        {
            "user_id": user_id,
            "company_summary": summarize_company_details(request.company_details),
            "weekly_focus": request.weekly_focus,
            "platforms": request.platforms,
            "posts_per_day": request.posts_per_day,
            "number_of_days": request.number_of_days,
            "total_rows": len(records),
            "file_name": result["file_name"],
            "download_url": response_payload["download_url"],
            "generation_mode": result.get("generation_mode"),
        }
    )

    return response_payload


@app.get("/history")
def list_history(
    x_forgeflow_user_id: str | None = Header(default=None),
    limit: int = Query(default=50, ge=1, le=100),
):
    user_id = get_required_user_id(x_forgeflow_user_id)
    return {"events": get_history_store().list_generations(user_id=user_id, limit=limit)}


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
