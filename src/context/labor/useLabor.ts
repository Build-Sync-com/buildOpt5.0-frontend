import { useContext } from 'react';
import { LaborContext } from './LaborContext';

/** The labour store - register, allocations, muster roll. Must be used under <LaborProvider>. */
export function useLabor() {
  const context = useContext(LaborContext);
  if (!context) {
    throw new Error('useLabor must be used within a LaborProvider');
  }
  return context;
}
