import { useState } from 'react';
import { createSampleProgram } from '../data/sampleProgram';
import type { Program } from '../types/program';

/**
 * useProgram
 *
 * The site's construction program, as published from the admin portal.
 * Read-only: there's nothing to change from this portal.
 *
 * Returns the sample program until the program API exists - swap this for
 * a fetch then; the page only uses what this hook returns.
 */
export function useProgram(): Program {
  const [program] = useState(createSampleProgram);
  return program;
}
