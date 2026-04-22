import { GenerateRequest, GenerateResponse } from "@/lib/types";

const API_BASE_URL = "/api";

function formatErrorDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return String(item);

        const field = "loc" in item && Array.isArray(item.loc) ? item.loc.at(-1) : null;
        const message = "msg" in item && typeof item.msg === "string" ? item.msg : JSON.stringify(item);
        return field ? `${field}: ${message}` : message;
      })
      .join(" ");
  }

  if (detail && typeof detail === "object" && "msg" in detail && typeof detail.msg === "string") {
    return detail.msg;
  }

  return JSON.stringify(detail);
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data?.detail) return formatErrorDetail(data.detail);
    return JSON.stringify(data);
  } catch {
    return response.statusText || "Unknown error";
  }
}

export async function checkHealth(): Promise<{ status: string; app_name?: string }> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export async function generateCalendar(payload: GenerateRequest): Promise<GenerateResponse> {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json();
}

export function buildDownloadUrl(downloadUrl: string): string {
  if (!downloadUrl) return "#";
  if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) return downloadUrl;
  if (downloadUrl.startsWith("/download/")) return `${API_BASE_URL}${downloadUrl}`;
  return `${API_BASE_URL}${downloadUrl}`;
}
