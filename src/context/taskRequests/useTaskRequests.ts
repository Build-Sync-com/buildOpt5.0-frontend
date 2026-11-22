import { useContext } from 'react';
import { TaskRequestsContext } from './TaskRequestsContext';

/** Requests raised from the program, and actions to raise them. Must be used under <TaskRequestsProvider>. */
export function useTaskRequests() {
  const context = useContext(TaskRequestsContext);
  if (!context) {
    throw new Error('useTaskRequests must be used within a TaskRequestsProvider');
  }
  return context;
}
