import { useContext } from 'react';
import { MachineryContext } from './MachineryContext';

/** The machinery & equipment store. Must be used under <MachineryProvider>. */
export function useMachinery() {
  const context = useContext(MachineryContext);
  if (!context) {
    throw new Error('useMachinery must be used within a MachineryProvider');
  }
  return context;
}
