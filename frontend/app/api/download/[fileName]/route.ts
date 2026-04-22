import { backendUrl } from "../../backend";

export async function GET(_request: Request, { params }: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await params;

  try {
    const response = await fetch(backendUrl(`/download/${encodeURIComponent(fileName)}`), { cache: "no-store" });

    if (!response.ok) {
      const body = await response.text();
      return new Response(body, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") ?? "application/json",
        },
      });
    }

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ??
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": response.headers.get("Content-Disposition") ?? `attachment; filename="${fileName}"`,
      },
    });
  } catch {
    return Response.json({ detail: "Backend API is not reachable on http://127.0.0.1:8000" }, { status: 503 });
  }
}
