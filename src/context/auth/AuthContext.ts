import { createContext } from 'react';
import type { Session, SignInCredentials } from '../../types/auth';

export type AuthContextValue = {
  /** The signed-in user, or null when signed out. */
  session: Session | null;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
