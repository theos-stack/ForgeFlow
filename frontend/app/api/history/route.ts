import { backendUrl, getRequestUserId, proxyJson, userHeaders } from "../backend";

export async function GET() {
  const userId = await getRequestUserId();

  if (!userId) {
    return Response.json({ detail: "Sign in to view your dashboard." }, { status: 401 });
  }

  try {
    const response = await fetch(backendUrl("/history"), {
      cache: "no-store",
      headers: userHeaders(userId),
    });

    return proxyJson(response);
  } catch {
    return Response.json({ detail: "Backend API is not reachable." }, { status: 503 });
  }
}
