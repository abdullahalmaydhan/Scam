import type { Answer } from "@/components/ui/AnswerButtons";
import type { SlipCategory } from "@/components/ui/MessageSlip";

export const MODES = ["sms", "whatsapp", "email", "banking", "websites", "mixed"] as const;
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Mode = (typeof MODES)[number];
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Points per correct answer (HANDOFF §8 rule 2). Display only: SQL grades. */
export const POINTS: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 30 };
/** Round size (HANDOFF decision 19). Display only: SQL decides. */
export const roundSize = (m: Mode) => (m === "websites" ? 3 : 10);

/** A question as start_game returns it. Never carries the answer. */
export type Question = {
  position: number;
  category: SlipCategory;
  sender: string | null;
  sender_meta: string | null;
  subject: string | null;
  body: string;
  link: string | null;
  sender_en: string | null;
  sender_meta_en: string | null;
  subject_en: string | null;
  body_en: string | null;
};

export type StartResponse = {
  session_id: string;
  claim_token: string | null;
  total: number;
  points_per_correct: number;
  questions: Question[];
};

export type WrongItem = {
  position: number;
  your_answer: Answer;
  correct_answer: Answer;
  body: string;
  explanation: string;
  body_en: string | null;
  explanation_en: string | null;
};

export type NewBadge = { code: string; name_ar: string; description_ar: string };

export type SubmitResponse = {
  correct: number;
  total: number;
  points: number;
  percent: number;
  saved: boolean;
  total_points: number | null;
  new_badges: NewBadge[];
  wrong: WrongItem[];
};

export type ShowcaseItem = {
  category: SlipCategory;
  sender: string | null;
  sender_meta: string | null;
  subject: string | null;
  body: string;
  link: string | null;
  correct_answer: Answer;
  sender_en: string | null;
  sender_meta_en: string | null;
  subject_en: string | null;
  body_en: string | null;
};
