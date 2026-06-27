/**
 * @license
 * SPDX-License-Identifier: MIT
 *
 * Shared labor-assessment logic used by both the 5-1-1 checker (StatsGrid)
 * and the Phase Detector (HelpCenter) so the two panels always agree.
 *
 * Everything is evaluated per-contraction over a sliding window of the LAST
 * HOUR, never via averages, per midwife guidance ("we only care about the
 * last hour").
 */

import { Contraction } from './types';

const FIVE_MIN_MS = 5 * 60 * 1000;
const ONE_MIN_SEC = 60;
const ONE_HOUR_MS = 60 * 60 * 1000;

export type LaborPhase = 'awaiting' | 'early' | 'transitioning' | 'active';

export interface LaborAssessment {
  /** Contractions that started within the last 60 minutes. */
  lastHourCount: number;
  /** 5-1-1: every start-to-start interval in the last hour is <= 5 min. */
  frequencyMet: boolean;
  /** 5-1-1: every contraction in the last hour lasts >= 60s. */
  durationMet: boolean;
  /** 5-1-1: the full pattern (<=5 min apart AND each >=1 min) sustained >= 1h. */
  sustainedMet: boolean;
  /** 5-1-1 fully met. */
  is511Met: boolean;
  /** Coarse phase classification derived from the same checks. */
  phase: LaborPhase;
}

export function assessLabor(
  contractions: Contraction[],
  now: number = Date.now()
): LaborAssessment {
  const completed = contractions.filter((c) => c.endTime !== null);
  const chrono = [...completed].sort((a, b) => a.startTime - b.startTime);
  const inWindow = chrono.filter((c) => now - c.startTime <= ONE_HOUR_MS);
  const lastHourCount = inWindow.length;

  if (inWindow.length < 2) {
    return {
      lastHourCount,
      frequencyMet: false,
      durationMet: false,
      sustainedMet: false,
      is511Met: false,
      phase: 'awaiting',
    };
  }

  // 5 Min: every consecutive start-to-start interval within the last hour <= 5 min.
  let frequencyMet = true;
  for (let i = 1; i < inWindow.length; i++) {
    if (inWindow[i].startTime - inWindow[i - 1].startTime > FIVE_MIN_MS) {
      frequencyMet = false;
      break;
    }
  }

  // 1 Min: every contraction in the last hour lasts >= 60s.
  const durationMet = inWindow.every((c) => c.duration >= ONE_MIN_SEC);

  // 1 Hour: walk back from the most recent contraction while BOTH the interval
  // is <= 5 min and each contraction lasts >= 1 min. That run's span is how long
  // the full pattern has been continuously sustained. The walk may reach before
  // the window only to confirm the pattern started >= 1 hour ago.
  let runOldestIdx = chrono.length - 1;
  for (let i = chrono.length - 2; i >= 0; i--) {
    const intervalOk =
      chrono[i + 1].startTime - chrono[i].startTime <= FIVE_MIN_MS;
    const durationOk =
      chrono[i].duration >= ONE_MIN_SEC && chrono[i + 1].duration >= ONE_MIN_SEC;
    if (intervalOk && durationOk) {
      runOldestIdx = i;
    } else {
      break;
    }
  }
  const sustainedMet =
    chrono[chrono.length - 1].startTime - chrono[runOldestIdx].startTime >=
    ONE_HOUR_MS;

  const is511Met = frequencyMet && durationMet && sustainedMet;

  let phase: LaborPhase;
  if (is511Met) {
    phase = 'active';
  } else if (frequencyMet && durationMet) {
    // 5 & 1 are met in the last hour, just not yet sustained for a full hour.
    phase = 'transitioning';
  } else {
    phase = 'early';
  }

  return {
    lastHourCount,
    frequencyMet,
    durationMet,
    sustainedMet,
    is511Met,
    phase,
  };
}
