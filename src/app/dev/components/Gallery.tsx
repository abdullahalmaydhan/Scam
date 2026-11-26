"use client";

import { useState } from "react";
import { Home, Settings } from "lucide-react";
import { usePrefs } from "@/components/PrefsProvider";
import {
  AnswerButtons,
  BadgeChip,
  Button,
  Card,
  Input,
  ListItem,
  MessageSlip,
  ProgressBar,
  RadioGroup,
  RadioOption,
  RiskMeter,
  ScoreRing,
  Segmented,
  Sheet,
  Stamp,
  type Answer,
} from "@/components/ui";
import type { Locale, Theme } from "@/lib/i18n";

/** Dev-only gallery (BUILD_PLAN M0). Section labels are dev chrome. */
function Section({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-line pt-6">
      <h2 dir="ltr" className="text-start font-mono text-caption text-dust">
        {name}
      </h2>
      {children}
    </section>
  );
}

const LEVELS = ["easy", "medium", "hard"] as const;
const POINTS = { easy: 10, medium: 20, hard: 30 } as const;

export function Gallery() {
  const { t, n, locale, theme, setLocale, setTheme } = usePrefs();
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [level, setLevel] = useState<string>("easy");
  const [sheet, setSheet] = useState(false);
  const [progress, setProgress] = useState(3);
  const ar = locale === "ar";

  return (
    <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-4 py-8 lg:px-6">
      <header className="flex flex-col gap-4">
        <h1 className="text-display">{t("brand")}</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <Segmented<Locale>
            name="lang"
            label={t("settings.language")}
            value={locale}
            onChange={setLocale}
            options={[
              { value: "ar", label: "العربية" },
              { value: "en", label: "English" },
            ]}
          />
          <Segmented<Theme>
            name="theme"
            label={t("settings.appearance")}
            value={theme}
            onChange={setTheme}
            options={[
              { value: "dark", label: t("settings.dark") },
              { value: "light", label: t("settings.light") },
            ]}
          />
        </div>
      </header>

      <Section name="Typography · display 48 · title 22 · body 16 · caption 13">
        <p className="font-display text-display font-extrabold">{n(2540)}</p>
        <p className="font-display text-title font-extrabold">{t("home.headline")}</p>
        <p className="text-body">{t("home.lead_laptop")}</p>
        <p className="text-caption text-dust">{t("home.showcase_note")}</p>
      </Section>

      <Section name="Button · primary · hero · secondary · destructive · destructive-confirm">
        <div className="flex flex-col gap-4 md:max-w-[560px]">
          <Button variant="hero" fullWidth>
            {t("home.cta")}
          </Button>
          <Button
            fullWidth
            loading={loading}
            loadingText={t("game.loading", { n: 10 })}
            onClick={() => {
              setLoading(true);
              setTimeout(() => setLoading(false), 1500);
            }}
          >
            {t("game.start", { n: 10 })}
          </Button>
          <Button fullWidth disabled>
            {t("scan.submit_empty")}
          </Button>
          <Button variant="secondary" fullWidth icon={<Home aria-hidden size={18} />}>
            {t("result.home")}
          </Button>
          <Button variant="destructive" fullWidth>
            {t("settings.delete")}
          </Button>
          <Button variant="destructive-confirm" fullWidth>
            {t("settings.delete")}
          </Button>
        </div>
      </Section>

      <Section name="AnswerButtons · default · chosen · disabled">
        <div className="flex flex-col gap-4 md:max-w-[560px]">
          <AnswerButtons onAnswer={setAnswer} chosen={answer} />
          <Button variant="secondary" onClick={() => setAnswer(null)}>
            {t("nav.back")}
          </Button>
          <AnswerButtons onAnswer={() => {}} disabled />
        </div>
      </Section>

      <Section name="MessageSlip · sms · whatsapp · email · websites (+ stamp)">
        <div className="grid gap-12 lg:grid-cols-2">
          <MessageSlip
            category="sms"
            sender="+966 55 384 2917"
            meta={ar ? "رسالة نصية · ١١:٤٢ ص" : "SMS · 11:42 AM"}
            body={
              ar
                ? "عميلنا العزيز، شحنتك معلقة بسبب عدم اكتمال العنوان. ادفع ٩٫٥٠ ريال خلال ١٢ ساعة عبر الرابط:"
                : "Dear customer, your parcel is on hold because the address is incomplete. Pay 9.50 SAR within 12 hours at the link:"
            }
            link="spl-ksa-track.info/pay"
            stamp={answer}
            stampAnimate
          />
          <MessageSlip
            category="whatsapp"
            sender="+966 50 771 0264"
            meta={ar ? "واتساب · أمس" : "WhatsApp · Yesterday"}
            body={
              ar
                ? "مبروك! ربحت ٥٠٠٠ ريال في سحب العملاء. أرسل رقم الآيبان عشان نحوّل لك المبلغ."
                : "Congrats! You won 5000 SAR in the customer draw. Send your IBAN so we can transfer it."
            }
            stamp="scam"
          />
          <MessageSlip
            category="email"
            sender="security@bank-alert-help.com"
            meta={ar ? "٨:٠٠ ص" : "8:00 AM"}
            subject={ar ? "تنبيه عاجل: حسابك موقوف" : "Urgent: your account is suspended"}
            body={
              ar
                ? "اضغط على الرابط خلال ٢٤ ساعة لتفعيل حسابك، وإلا بيتم إغلاقه نهائياً."
                : "Click the link within 24 hours to reactivate your account, or it will be closed for good."
            }
          />
          <MessageSlip
            category="websites"
            sender="http://gov-services-login.com"
            subject={ar ? "تسجيل الدخول للخدمات الحكومية" : "Government services login"}
            body={
              ar
                ? "ادخل رقم الهوية وكلمة المرور ورمز التحقق للدخول للخدمات الحكومية."
                : "Enter your ID number, password and verification code to log in to government services."
            }
          />
          <MessageSlip
            category="websites"
            sender="https://www.citylibrary.sa/booking"
            subject={ar ? "مكتبة المدينة · احجز كتابك" : "City Library · book a title"}
            body={
              ar
                ? "اختر الكتاب والفرع، ونرسل لك تأكيد الحجز على جوالك."
                : "Choose the book and branch, and we’ll text you the booking confirmation."
            }
            stamp="safe"
          />
          <MessageSlip
            category="sms"
            compact
            sender={ar ? "رمز التحقق" : "Verification code"}
            meta={ar ? "رسالة نصية · ١١:٣٠ ص" : "SMS · 11:30 AM"}
            body={
              ar
                ? "رمز التحقق لتسجيل الدخول: 482916. لا تشاركه مع أحد، حتى لو قال إنه من الدعم."
                : "Your login code: 482916. Don’t share it with anyone, even if they say they’re support."
            }
            stamp="safe"
          />
        </div>
      </Section>

      <Section name="Stamp">
        <div className="flex gap-8 rounded-md bg-slip p-8">
          <Stamp kind="scam" />
          <Stamp kind="safe" />
        </div>
      </Section>

      <Section name="Input · default · error">
        <div className="flex flex-col gap-4 md:max-w-[560px]">
          <Input label={t("auth.email")} type="email" dir="ltr" autoComplete="email" />
          <Input label={t("auth.password")} type="password" error={t("errors.LOGIN_FAILED")} />
        </div>
      </Section>

      <Section name="Card · ListItem">
        <div className="flex flex-col gap-2 md:max-w-[720px]">
          <Card>
            <p className="text-body font-bold">{t("home.scan_title")}</p>
            <p className="text-caption text-dust">{t("home.scan_sub")}</p>
          </Card>
          <ListItem title={t("home.learn_title")} sub={t("home.learn_sub")} href="/dev/components" />
          <ListItem
            title={t("nav.settings")}
            icon={<Settings aria-hidden size={20} />}
            onClick={() => setSheet(true)}
          />
        </div>
      </Section>

      <Section name="RadioOption">
        <RadioGroup label={t("game.level_title")} className="md:max-w-[560px]">
          {LEVELS.map((l) => (
            <RadioOption
              key={l}
              name="level"
              value={l}
              checked={level === l}
              onChange={setLevel}
              title={t(`game.levels.${l}.title`)}
              sub={t(`game.levels.${l}.sub`)}
              side={
                <>
                  {t("game.points_side", { n: POINTS[l] })}
                  <br />
                  {t("game.per_question")}
                </>
              }
            />
          ))}
        </RadioGroup>
      </Section>

      <Section name="BadgeChip · earned · in progress">
        <div className="flex flex-wrap gap-2">
          <BadgeChip name={ar ? "البداية" : "First steps"} earned />
          <BadgeChip name={ar ? "خبير واتساب" : "WhatsApp expert"} earned={false} current={40} target={50} />
        </div>
      </Section>

      <Section name="RiskMeter · low · suspicious · high · insufficient">
        <div className="grid gap-6 md:max-w-[560px]">
          <RiskMeter risk="low" />
          <RiskMeter risk="suspicious" />
          <RiskMeter risk="high" />
          <RiskMeter risk="insufficient" />
        </div>
      </Section>

      <Section name="ProgressBar">
        <div className="flex flex-col gap-2 md:max-w-[560px]">
          <span className="text-caption text-dust">{t("game.progress", { i: progress, n: 10 })}</span>
          <ProgressBar value={progress} max={10} label={t("game.progress", { i: progress, n: 10 })} />
          <Button variant="secondary" onClick={() => setProgress((p) => (p >= 10 ? 0 : p + 1))}>
            +1
          </Button>
        </div>
      </Section>

      <Section name="ScoreRing · 7 of 10 · perfect">
        <div className="flex flex-wrap gap-12 p-4">
          <ScoreRing correct={7} total={10} />
          <ScoreRing correct={10} total={10} />
        </div>
      </Section>

      <Section name="Sheet (phone) / Dialog (laptop)">
        <Button variant="secondary" onClick={() => setSheet(true)}>
          {t("game.exit")}
        </Button>
        <Sheet open={sheet} onClose={() => setSheet(false)} title={t("game.exit_title")}>
          <p className="text-body text-dust">{t("game.exit_body", { done: 4, n: 10 })}</p>
          <Button fullWidth onClick={() => setSheet(false)}>
            {t("game.exit_stay")}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setSheet(false)}>
            {t("game.exit_leave")}
          </Button>
        </Sheet>
      </Section>
    </main>
  );
}
