"use client";

import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";

export function ClerkShell({ children }: { children: React.ReactNode }) {
  const enabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      {children}
    </ClerkProvider>
  );
}

export function AuthButtons() {
  const enabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  if (!enabled) {
    return (
      <span className="hidden text-xs text-zinc-500 sm:inline">
        Set Clerk keys to enable sign-in
      </span>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            className="rounded-full border border-zinc-600 px-4 py-1.5 text-sm font-medium text-white transition hover:border-zinc-400"
          >
            Sign In
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button
            type="button"
            className="hidden rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-surface transition hover:bg-accent-muted sm:inline-flex"
          >
            Start Free
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-3">
          <a
            href="/account"
            className="hidden text-sm text-zinc-300 hover:text-white sm:inline"
          >
            Account
          </a>
          <UserButton />
        </div>
      </Show>
    </>
  );
}
