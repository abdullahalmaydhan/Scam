"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Answer } from "@/components/ui";
import type { StringKey } from "@/lib/i18n";
import {
  clearPending,
  clearResult,
  clearRound,
  loadChoice,
  loadPending,
  loadResult,
  loadRound,
  saveChoice,
  savePending,
  saveResult,
  saveRound,
  type ResultState,
  type RoundState,
} from "@/lib/game/storage";
import type { Difficulty, Mode, StartResponse, SubmitResponse } from "@/lib/game/types";
import { CategoryStep } from "./CategoryStep";
import { LevelStep } from "./LevelStep";
import { QuestionStep, type SubmitState } from "./QuestionStep";
import { ResultView } from "./ResultView";

/** Stamp prints, then the next message after 720ms (DESIGN.md §6). */
const NEXT_DELAY = 720;

type Step = "category" | "level" | "question" | "result";

/** First question without an answer (resume after a reload). */
function firstOpen(r: RoundState): number {
  const i = r.questions.findIndex((q) => !r.answers[q.position]);
  return i === -1 ? r.questions.length - 1 : i;
}
const allAnswered = (r: RoundState) => r.questions.every((q) => r.answers[q.position]);

/**
 * /play: G-1 → G-2 → G-3 → G-5 as one client page with local state.
 * Rendered only in the browser (it starts from sessionStorage).
 */
export function Game() {
  const router = useRouter();

  // Initial state comes from sessionStorage, so a reload resumes silently.
  const [initial] = useState(() => {
    const round = loadRound();
    const result = round ? null : loadResult();
    const choice = loadChoice();
    return { round, result, choice };
  });

  const [mode, setMode] = useState<Mode>(initial.choice?.mode ?? "sms");
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.choice?.difficulty ?? "easy");
  const [step, setStep] = useState<Step>(initial.round ? "question" : initial.result ? "result" : "category");
  const [round, setRound] = useState<RoundState | null>(initial.round);
  const [index, setIndex] = useState(initial.round ? firstOpen(initial.round) : 0);
  const [chosen, setChosen] = useState<Answer | null>(null);
  const [result, setResult] = useState<ResultState | null>(initial.result);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<StringKey | null>(null);
  const [submit, setSubmit] = useState<SubmitState>(
    initial.round && allAnswered(initial.round) ? { kind: "sending" } : { kind: "idle" },
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // ---- start ------------------------------------------------------------
  const start = useCallback(async () => {
    setStarting(true);
    setStartError(null);
    saveChoice({ mode, difficulty });
    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, difficulty }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setStartError(data?.error === "NOT_ENOUGH_QUESTIONS" ? "errors.NOT_ENOUGH_QUESTIONS" : "errors.GENERIC");
        return;
      }
      const s = data as StartResponse;
      const r: RoundState = {
        v: 1,
        session_id: s.session_id,
        claim_token: s.claim_token,
        mode,
        difficulty,
        total: s.total,
        points_per_correct: s.points_per_correct,
        questions: s.questions,
        answers: {},
        started_at: Date.now(),
      };
      saveRound(r);
      clearResult();
      if (s.claim_token) savePending({ session_id: s.session_id, claim_token: s.claim_token });
      else clearPending();
      setRound(r);
      setIndex(0);
      setChosen(null);
      setSubmit({ kind: "idle" });
      setStep("question");
      window.scrollTo(0, 0);
    } catch {
      setStartError("errors.GENERIC");
    } finally {
      setStarting(false);
    }
  }, [mode, difficulty]);

  // ---- submit (all answers at once, at the end) ---------------------------
  // State updates here all happen after the await.
  const post = useCallback(async (r: RoundState) => {
    try {
      const res = await fetch("/api/game/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: r.session_id,
          answers: r.questions.map((q) => ({ position: q.position, answer: r.answers[q.position] })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        const out: ResultState = { session_id: r.session_id, mode: r.mode, difficulty: r.difficulty, result: data as SubmitResponse };
        saveResult(out);
        clearRound();
        const pending = loadPending();
        if (pending?.session_id === r.session_id) savePending({ ...pending, points: out.result.points });
        setResult(out);
        setRound(null);
        setStep("result");
        setSubmit({ kind: "idle" });
        window.scrollTo(0, 0);
        return;
      }
      const code = data?.error as string | undefined;
      if (code === "SESSION_ALREADY_SUBMITTED" || code === "SESSION_NOT_FOUND") {
        // Show the result if we have it (HANDOFF §5), otherwise the error.
        const cached = loadResult();
        if (cached?.session_id === r.session_id) {
          clearRound();
          setResult(cached);
          setRound(null);
          setStep("result");
          setSubmit({ kind: "idle" });
          return;
        }
        clearRound();
        setSubmit({ kind: "failed", error: `errors.${code}` as StringKey, retry: false });
        return;
      }
      setSubmit({ kind: "failed", error: res.status === 503 ? "errors.NETWORK" : "errors.GENERIC", retry: true });
    } catch {
      // No connection: the answers stay on the device; retry with the same ones.
      setSubmit({ kind: "failed", error: "errors.NETWORK", retry: true });
    }
  }, []);

  const send = useCallback(
    (r: RoundState) => {
      setSubmit({ kind: "sending" });
      void post(r);
    },
    [post],
  );

  // A round reloaded after its last answer (submit already "sending"): send it.
  useEffect(() => {
    const r = initial.round;
    if (!r || !allAnswered(r)) return;
    // In a timer so StrictMode's double effect sends only once (cleanup cancels).
    const id = setTimeout(() => void post(r), 0);
    return () => clearTimeout(id);
  }, [initial.round, post]);

  // "نكمل أول ما يرجع النت": retry by itself when the connection is back.
  useEffect(() => {
    if (submit.kind !== "failed" || !submit.retry || !round) return;
    const onOnline = () => send(round);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [submit, round, send]);

  // ---- answer -------------------------------------------------------------
  const answer = useCallback(
    (a: Answer) => {
      if (!round || chosen || submit.kind !== "idle") return;
      const q = round.questions[index];
      const next: RoundState = { ...round, answers: { ...round.answers, [q.position]: a } };
      saveRound(next);
      setRound(next);
      setChosen(a);
      timer.current = setTimeout(() => {
        setChosen(null);
        if (index + 1 < next.questions.length) {
          setIndex(index + 1);
        } else {
          send(next);
        }
      }, NEXT_DELAY);
    },
    [round, chosen, submit.kind, index, send],
  );

  // ---- leave / restart ------------------------------------------------------
  const leave = useCallback(() => {
    // The session is abandoned (not graded); the server marks it after a day.
    clearRound();
    clearPending();
    router.push("/");
  }, [router]);

  const chooseAnother = useCallback(() => {
    // Back to G-1, keeping the last choices (HANDOFF §4).
    clearResult();
    clearRound();
    setResult(null);
    setRound(null);
    setSubmit({ kind: "idle" });
    setStep("category");
    window.scrollTo(0, 0);
  }, []);

  // ---- focus (keyboard and screen readers keep their place) ---------------
  // New screen → its heading. Skipped on first load so we don't steal focus.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const h1 = document.querySelector<HTMLElement>("main h1");
    if (h1) {
      h1.tabIndex = -1;
      h1.focus({ preventScroll: true });
    }
  }, [step]);
  // Next question → back on the answer buttons (they were disabled while the stamp printed).
  useEffect(() => {
    if (step !== "question" || chosen !== null || index === 0) return;
    document.querySelector<HTMLElement>("button[aria-pressed]")?.focus({ preventScroll: true });
  }, [step, chosen, index]);

  // ---- render -------------------------------------------------------------
  if (step === "result" && result) return <ResultView state={result} onOther={chooseAnother} />;

  if (step === "question" && round) {
    return (
      <QuestionStep
        round={round}
        index={index}
        chosen={chosen}
        submit={submit}
        onAnswer={answer}
        onRetry={() => send(round)}
        onLeave={leave}
        onRestart={chooseAnother}
      />
    );
  }

  if (step === "level") {
    return (
      <LevelStep
        mode={mode}
        difficulty={difficulty}
        onChange={setDifficulty}
        onBack={() => setStep("category")}
        onStart={start}
        loading={starting}
        error={startError}
      />
    );
  }

  return (
    <CategoryStep
      mode={mode}
      onChange={setMode}
      onNext={() => {
        setStartError(null);
        setStep("level");
        window.scrollTo(0, 0);
      }}
    />
  );
}
