import { backendUrl, proxyJson } from "../backend";

export async function POST(request: Request) {
  try {
    const response = await fetch(backendUrl("/generate"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: await request.text(),
    });

    return proxyJson(response);
  } catch {
    return Response.json({ detail: "Backend API is not reachable on http://127.0.0.1:8000" }, { status: 503 });
  }
}
