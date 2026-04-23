import { backendUrl, getRequestUserId, proxyJson, userHeaders } from "../backend";

export async function POST(request: Request) {
  const userId = await getRequestUserId();

  if (!userId) {
    return Response.json({ detail: "Sign in to generate and save calendars." }, { status: 401 });
  }

  try {
    const response = await fetch(backendUrl("/generate"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...userHeaders(userId),
      },
      body: await request.text(),
    });

    return proxyJson(response);
  } catch {
    return Response.json({ detail: "Backend API is not reachable." }, { status: 503 });
  }
}
