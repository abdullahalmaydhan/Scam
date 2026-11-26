"use client";

import { Fragment } from "react";
import { Lock, LockOpen } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/components/PrefsProvider";
import { Stamp } from "./Stamp";
import type { Answer } from "./AnswerButtons";

export type SlipCategory = "sms" | "whatsapp" | "email" | "banking" | "websites";

/**
 * Runs of Latin letters, digits and URL/phone punctuation (with spaces
 * between them, so "+966 55 384 2917" stays one run).
 */
const TOKEN = String.raw`[+]?[A-Za-z0-9](?:[A-Za-z0-9@._:/\-?=&%#~+]*[A-Za-z0-9/])?`;
// Each token ends on a letter, digit or "/", so a sentence's final "." stays outside.
const LTR_RUN = new RegExp(`${TOKEN}(?:\\s+${TOKEN})*`, "g");

/**
 * Message content, exactly as stored, with LTR runs isolated in
 * <bdi dir="ltr">. Links stay plain text: never <a>, never auto-linked.
 */
export function Isolated({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LTR_RUN)) {
    const i = m.index ?? 0;
    if (i > last) parts.push(text.slice(last, i));
    parts.push(
      <bdi key={i} dir="ltr">
        {m[0]}
      </bdi>,
    );
    last = i + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts.map((p, k) => (typeof p === "string" ? <Fragment key={`t${k}`}>{p}</Fragment> : p))}</>;
}

/** Websites: hide https://, keep http:// (HANDOFF decision 24). */
export function displayUrl(url: string): string {
  return url.replace(/^https:\/\//i, "");
}

export function MessageSlip({
  category,
  sender,
  meta,
  subject,
  body,
  link,
  stamp,
  stampAnimate,
  compact,
  stampAt = "bottom",
  className,
}: {
  /** "center": the laptop home slips, where the stamp sits mid-height. */
  stampAt?: "bottom" | "center";
  category: SlipCategory;
  sender: string | null;
  meta?: string | null;
  subject?: string | null;
  body: string;
  link?: string | null;
  /** The player's choice (or the showcase answer). Pass null before the choice. */
  stamp?: Answer | null;
  stampAnimate?: boolean;
  /** Home showcase: body 16 and 88px of padding on the stamp side. */
  compact?: boolean;
  className?: string;
}) {
  const t = useT();
  const isWeb = category === "websites";
  const isEmail = category === "email";
  const secure = isWeb && !!sender && /^https:\/\//i.test(sender);

  return (
    <article
      className={cn(
        "relative flex flex-col gap-4 rounded-md border border-slip-border bg-slip px-4 py-6 text-slip-text lg:p-8",
        // A slip that can carry a stamp (stamp passed, even null) reserves
        // room for it up front, so the layout doesn't jump and no words are covered.
        stamp !== undefined && stampAt === "bottom" && "mb-7",
        stamp !== undefined && !compact && "pb-19 lg:pb-19",
        className,
      )}
    >
      {isWeb ? (
        sender && (
          <div dir="ltr" className="flex flex-col gap-2 rounded-md border border-urlbar-border bg-urlbar p-3">
            <span
              className={cn(
                "inline-flex w-fit items-center gap-1 rounded-sm border px-2 text-caption font-semibold whitespace-nowrap",
                secure ? "border-stamp-safe text-stamp-safe" : "border-stamp text-stamp",
              )}
            >
              {secure ? <Lock aria-hidden size={14} /> : <LockOpen aria-hidden size={14} />}
              <span dir="auto">{t(secure ? "game.url_secure" : "game.url_insecure")}</span>
            </span>
            <span className="font-mono text-url text-slip-text [overflow-wrap:anywhere]">{displayUrl(sender)}</span>
          </div>
        )
      ) : (
        <header className="flex flex-col">
          <span className="text-body font-bold">
            {isEmail && <span className="font-normal text-slip-meta">{t("game.email_from")} </span>}
            {sender && <Isolated text={sender} />}
          </span>
          {meta && (
            <span className="text-caption text-slip-meta">
              <Isolated text={meta} />
            </span>
          )}
        </header>
      )}

      {subject && (
        <h3 className="font-display text-body font-extrabold">
          <Isolated text={subject} />
        </h3>
      )}

      <p
        className={cn(
          "whitespace-pre-line",
          compact ? "text-body pe-[88px]" : "text-title font-normal",
        )}
      >
        <Isolated text={body} />
      </p>

      {link && (
        <bdi
          dir="ltr"
          className="self-end rounded-sm border border-dashed border-slip-meta px-2 font-mono text-body [overflow-wrap:anywhere]"
        >
          {link}
        </bdi>
      )}

      {stamp && (
        <Stamp
          key={stamp}
          kind={stamp}
          animate={stampAnimate}
          className={stampAt === "center" ? "absolute end-4 top-1/2 -mt-12" : "absolute -bottom-7 end-4"}
        />
      )}
    </article>
  );
}
