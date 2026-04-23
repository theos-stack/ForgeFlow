export type Platform = "LinkedIn" | "Instagram" | "Twitter/X" | "YouTube";

export interface GenerateRequest {
  company_details: string;
  weekly_focus: string;
  tone: string;
  platforms: Platform[];
  posts_per_day: number;
  number_of_days: number;
  call_to_action: string;
  target_audience: string;
  output_file_name: string;
}

export interface CalendarRecord {
  Day: string;
  Platform: string;
  Content_Pillar: string;
  Topic: string;
  Hook: string;
  Format: string;
  Description: string;
  CTA: string;
}

export interface GenerateResponse {
  records: CalendarRecord[];
  file_name: string;
  download_url: string;
  platform_summary: Record<string, number>;
  total_rows: number;
  generation_mode?: "ai" | "hybrid" | "fallback";
  warning?: string | null;
}

export interface GenerationHistoryEvent {
  id: string;
  user_id: string;
  company_summary: string;
  weekly_focus: string;
  platforms: Platform[];
  posts_per_day: number;
  number_of_days: number;
  total_rows: number;
  file_name: string;
  download_url: string;
  generation_mode?: "ai" | "hybrid" | "fallback";
  created_at: string;
}

export interface GenerationHistoryResponse {
  events: GenerationHistoryEvent[];
}
