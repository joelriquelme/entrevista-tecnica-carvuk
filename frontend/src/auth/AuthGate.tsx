import { esMX } from '@clerk/localizations'
import {
  ClerkFailed,
  ClerkLoading,
  ClerkProvider,
  Show,
  SignIn,
  useAuth,
} from '@clerk/react'
import { useLayoutEffect, type ReactNode } from 'react'
import { setTokenGetter } from '../api/client'
import { clerkPublishableKey, isAuthEnabled } from './config'

/** Lets the API client attach the Clerk session token to every request. */
function TokenBridge() {
  const { getToken } = useAuth()

  // Layout effect: registered before any query fetch starts (those run in passive effects).
  useLayoutEffect(() => {
    setTokenGetter(() => getToken())
    return () => setTokenGetter(null)
  }, [getToken])

  return null
}

function SignInScreen() {
  return (
    <main className="auth-screen">
      <h1 className="brand brand--large">Carrito Feliz</h1>
      <p className="muted">Inicia sesión para administrar productos y generar boletas.</p>
      <SignIn routing="hash" />
    </main>
  )
}

export function AuthGate({ children }: { children: ReactNode }) {
  if (!isAuthEnabled) return children

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} localization={esMX} afterSignOutUrl="/">
      <ClerkLoading>
        <main className="auth-screen" aria-busy="true">
          <p className="muted">Cargando sesión…</p>
        </main>
      </ClerkLoading>
      <ClerkFailed>
        <main className="auth-screen">
          <p className="alert alert--error" role="alert">
            No se pudo cargar el servicio de autenticación. Recarga la página.
          </p>
        </main>
      </ClerkFailed>
      <Show when="signed-out">
        <SignInScreen />
      </Show>
      <Show when="signed-in">
        <TokenBridge />
        {children}
      </Show>
    </ClerkProvider>
  )
}
