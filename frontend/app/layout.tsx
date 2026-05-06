import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import AppShell from "@/components/app-shell";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "ForgeFlow AI";
const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const metadata: Metadata = {
  title: appName,
  description: "Professional AI content planning workspace for sharper weekly calendars.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {publishableKey ? (
          <ClerkProvider publishableKey={publishableKey}>
            <AppShell>{children}</AppShell>
          </ClerkProvider>
        ) : (
          <AppShell>{children}</AppShell>
        )}
      </body>
    </html>
  );
}
