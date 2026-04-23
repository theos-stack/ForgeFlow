const BACKEND_API_BASE_URL =
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8010";

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
const DEMO_USER_ID = process.env.DEMO_USER_ID ?? "local-demo-user";

export function backendUrl(path: string) {
  return `${BACKEND_API_BASE_URL}${path}`;
}

export async function getRequestUserId(): Promise<string | null> {
  if (!CLERK_ENABLED) return DEMO_USER_ID;

  const { auth } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  return userId;
}

export function userHeaders(userId: string) {
  return {
    "X-ForgeFlow-User-Id": userId,
  };
}

export async function proxyJson(response: Response) {
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}
