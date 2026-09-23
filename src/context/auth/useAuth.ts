import { useContext } from 'react';
import { AuthContext } from './AuthContext';

/** Access the auth session and actions. Must be used under <AuthProvider>. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
