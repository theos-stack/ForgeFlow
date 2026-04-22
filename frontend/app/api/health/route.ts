import { backendUrl, proxyJson } from "../backend";

export async function GET() {
  try {
    const response = await fetch(backendUrl("/health"), { cache: "no-store" });
    return proxyJson(response);
  } catch {
    return Response.json({ detail: "Backend API is not reachable on http://127.0.0.1:8000" }, { status: 503 });
  }
}
