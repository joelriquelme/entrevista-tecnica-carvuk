export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim() ?? ''

/** Auth is optional: without a Clerk key the app runs in dev mode with no login. */
export const isAuthEnabled = clerkPublishableKey !== ''
