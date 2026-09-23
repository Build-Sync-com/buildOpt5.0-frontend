import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { getRoleById } from '../../constants/userRoles';
import type { Session, SignInCredentials } from '../../types/auth';

/**
 * AuthProvider
 *
 * Holds the signed-in session for the web app. There is no backend yet, so
 * `signIn` accepts any username/password after a short delay and keeps the
 * session in the browser: "keep me signed in" uses localStorage, otherwise it
 * lasts for the tab (sessionStorage). Replace the body of `signIn` with the
 * real API call when auth is wired up — the rest of the app only sees
 * `session`.
 */
const STORAGE_KEY = 'buildopt.session';

type StoredSession = {
  username: string;
  roleId: string;
  signedInAt: string;
};

function readStoredSession(): Session | null {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredSession;
    const role = getRoleById(stored.roleId);
    return role
      ? { username: stored.username, role, signedInAt: stored.signedInAt }
      : null;
  } catch {
    return null;
  }
}

function clearStoredSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (e.g. blocked site data) — nothing to clear.
  }
}

function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readStoredSession);

  const signIn = useCallback(
    async ({ roleId, username, remember }: SignInCredentials) => {
      // Simulated round-trip until the auth API exists.
      await new Promise((resolve) => setTimeout(resolve, 700));

      const role = getRoleById(roleId);
      if (!role) throw new Error(`Unknown role: ${roleId}`);

      const next: Session = {
        username: username.trim(),
        role,
        signedInAt: new Date().toISOString(),
      };
      const stored: StoredSession = {
        username: next.username,
        roleId,
        signedInAt: next.signedInAt,
      };

      clearStoredSession();
      try {
        (remember ? localStorage : sessionStorage).setItem(
          STORAGE_KEY,
          JSON.stringify(stored),
        );
      } catch {
        // Storage unavailable — the session still lasts until a reload.
      }
      setSession(next);
    },
    [],
  );

  const signOut = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, signIn, signOut }),
    [session, signIn, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export default AuthProvider;
