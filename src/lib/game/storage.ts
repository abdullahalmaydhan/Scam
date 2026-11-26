"use client";

import type { Answer } from "@/components/ui/AnswerButtons";
import type { Difficulty, Mode, Question, SubmitResponse } from "./types";

/**
 * sessionStorage for the round (API.md): answers survive a dropped
 * connection and a reload in the same tab. Closing the tab clears it.
 */
const ROUND = "sos.round";
const RESULT = "sos.result";
const CHOICE = "sos.choice";
/** Read by the auth pages in M3 to claim a guest round (API.md). */
export const PENDING_ROUND = "pendingRound";

const ONE_DAY = 24 * 60 * 60 * 1000;

export type RoundState = {
  v: 1;
  session_id: string;
  claim_token: string | null;
  mode: Mode;
  difficulty: Difficulty;
  total: number;
  points_per_correct: number;
  questions: Question[];
  answers: Record<number, Answer>;
  started_at: number;
};

export type ResultState = {
  session_id: string;
  mode: Mode;
  difficulty: Difficulty;
  result: SubmitResponse;
  /** Set after sign-up ("new") or login ("existing") claimed this guest round. */
  claim?: "new" | "existing" | "failed";
};

export type PendingRound = { session_id: string; claim_token: string; points?: number };
export type Choice = { mode: Mode; difficulty: Difficulty };

function read<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the round still works in memory.
  }
}
function remove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {}
}

/** The round in progress, if it's from the last day (HANDOFF §5). */
export function loadRound(): RoundState | null {
  const r = read<RoundState>(ROUND);
  if (!r || r.v !== 1 || Date.now() - r.started_at > ONE_DAY) {
    if (r) remove(ROUND);
    return null;
  }
  return r;
}
export const saveRound = (r: RoundState) => write(ROUND, r);
export const clearRound = () => remove(ROUND);

export const loadResult = () => read<ResultState>(RESULT);
export const saveResult = (r: ResultState) => write(RESULT, r);
export const clearResult = () => remove(RESULT);

export const loadChoice = () => read<Choice>(CHOICE);
export const saveChoice = (c: Choice) => write(CHOICE, c);

export const loadPending = () => read<PendingRound>(PENDING_ROUND);
export const savePending = (p: PendingRound) => write(PENDING_ROUND, p);
export const clearPending = () => remove(PENDING_ROUND);
