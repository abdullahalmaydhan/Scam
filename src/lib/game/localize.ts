import type { Locale } from "@/lib/i18n";

type Bilingual = {
  sender: string | null;
  sender_meta: string | null;
  subject: string | null;
  body: string;
  sender_en: string | null;
  sender_meta_en: string | null;
  subject_en: string | null;
  body_en: string | null;
};

/** The message fields for the current locale (Arabic when English is missing). */
export function localizeMessage(m: Bilingual, locale: Locale) {
  if (locale !== "en") {
    return { sender: m.sender, meta: m.sender_meta, subject: m.subject, body: m.body };
  }
  return {
    sender: m.sender_en ?? m.sender,
    meta: m.sender_meta_en ?? m.sender_meta,
    subject: m.subject_en ?? m.subject,
    body: m.body_en ?? m.body,
  };
}
