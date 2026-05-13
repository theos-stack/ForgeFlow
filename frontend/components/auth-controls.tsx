"use client";

import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";

type AuthControlsProps = {
  compact?: boolean;
};

const CLERK_ENABLED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default function AuthControls({ compact = false }: AuthControlsProps) {
  if (!CLERK_ENABLED) {
    return <span className={`auth-demo-pill ${compact ? "compact-auth-pill" : ""}`}>Demo</span>;
  }

  return <ClerkAuthControls compact={compact} />;
}

function ClerkAuthControls({ compact }: AuthControlsProps) {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <div className={`auth-controls signed-in-controls ${compact ? "compact-auth-controls" : ""}`}>
        <UserButton />
      </div>
    );
  }

  if (compact) {
    return (
      <div className="auth-controls compact-auth-controls">
        <SignInButton mode="modal">
          <button className="auth-button compact-auth-button" type="button">
            <span className="auth-button-icon" aria-hidden="true">in</span>
            <span>Sign in</span>
          </button>
        </SignInButton>
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
