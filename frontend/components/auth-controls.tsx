"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function AuthControls() {
  if (!CLERK_ENABLED) {
    return <span className="auth-demo-pill">Demo history mode</span>;
  }

  return <ClerkAuthControls />;
}

function ClerkAuthControls() {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <div className="auth-controls signed-in-controls">
        <UserButton />
      </div>
    );
  }

  return (
    <div className="auth-controls">
      <SignInButton mode="modal">
        <button className="auth-button" type="button">
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="auth-button primary-auth" type="button">
          Create account
        </button>
      </SignUpButton>
    </div>
  );
}
