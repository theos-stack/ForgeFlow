from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class GenerateCalendarRequest(BaseModel):
    company_details: str = Field(..., min_length=10)
    weekly_focus: str = Field(..., min_length=3)
    tone: str = Field(default="Professional")
    platforms: List[str] = Field(default_factory=lambda: ["LinkedIn", "Instagram"])
    posts_per_day: int = Field(default=1, ge=1, le=5)
    number_of_days: int = Field(default=7, ge=1, le=31)
    call_to_action: Optional[str] = Field(default="Encourage engagement or consultation")
    target_audience: Optional[str] = Field(default="Decision-makers and potential buyers")
    output_file_name: Optional[str] = Field(default="content-calendar", min_length=1, max_length=80)


class GenerateCalendarResponse(BaseModel):
    records: List[Dict[str, Any]]
    file_name: str
    download_url: str
    platform_summary: Dict[str, int]
    total_rows: int
    generation_mode: Optional[str] = None
    warning: Optional[str] = None
