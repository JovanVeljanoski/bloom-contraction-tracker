/**
 * @license
 * SPDX-License-Identifier: MIT
 */

export type Intensity = 'Mild' | 'Moderate' | 'Strong' | 'Unspecified';

export interface Contraction {
  id: string;
  startTime: number;      // Unix timestamp in ms
  endTime: number | null; // Unix timestamp in ms, null if active
  duration: number;       // calculated duration in seconds
  intensity?: Intensity;
  notes: string;
}

export interface SummaryStats {
  averageDuration: number;  // in seconds
  averageFrequency: number; // in seconds (start-to-start)
  averageRest: number;      // in seconds (end-to-start)
  count: number;
}
