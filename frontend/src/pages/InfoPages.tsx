import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { btnPrimary, btnSecondary } from "@/components/Buttons";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { PageTitle } from "@/pages/ListingPages";
import { sendContactMessage, ApiError } from "@/lib/api";

function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mt-12 max-w-[680px] space-y-6 text-[1.0625rem] leading-[1.75] [&_h2]:headline [&_h2]:pt-6 [&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
      {children}
    </div>
  );
}

export function AboutPage() {
  const { t } = useTranslation();
  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow={t("info.about.eyebrow")} title={t("info.about.title")}>
        {t("info.about.subtitle")}
      </PageTitle>
      <Reveal>
        <Prose>
          <h2>{t("info.about.missionTitle")}</h2>
          <p>{t("info.about.missionBody")}</p>
          <h2>{t("info.about.coverTitle")}</h2>
          <ul>
            <li>{t("info.about.coverItem1")}</li>
            <li>{t("info.about.coverItem2")}</li>
            <li>{t("info.about.coverItem3")}</li>
            <li>{t("info.about.coverItem4")}</li>
          </ul>
          <h2>{t("info.about.pickTitle")}</h2>
          <p>{t("info.about.pickBody")}</p>
          <h2>{t("info.about.standardsTitle")}</h2>
          <p>{t("info.about.standardsBody")}</p>
        </Prose>
      </Reveal>
    </Container>
  );
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  subject: z.string().trim().min(3, "Please add a subject").max(150),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(2000),
});
type ContactValues = z.infer<typeof contactSchema>;

const fieldCls =
  "mt-2 w-full min-h-[48px] rounded-[4px] border border-border bg-background px-4 py-3 outline-none transition-colors focus-visible:border-foreground";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-signal">{error}</p>}
    </div>
  );
}

export function ContactPage() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(contactSchema) });

  const onSubmit = async (values: ContactValues) => {
    try {
      await sendContactMessage({
        name: values.name,
        email: values.email,
        subject: values.subject,
        message: values.message,
        type: "contact",
      });
      toast.success(t("contact.success"));
      reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("contact.error"));
    }
  };

  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow={t("contact.eyebrow")} title={t("contact.title")}>
        {t("contact.subtitle")}
      </PageTitle>
      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 lg:col-span-7">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field id="c-name" label={t("contact.name")} error={errors.name?.message}>
              <input id="c-name" autoComplete="name" className={fieldCls} {...register("name")} />
            </Field>
            <Field id="c-email" label={t("contact.email")} error={errors.email?.message}>
              <input
                id="c-email"
                type="email"
                autoComplete="email"
                className={fieldCls}
                {...register("email")}
              />
            </Field>
          </div>
          <Field id="c-subject" label={t("contact.subject")} error={errors.subject?.message}>
            <input id="c-subject" className={fieldCls} {...register("subject")} />
          </Field>
          <Field id="c-message" label={t("contact.message")} error={errors.message?.message}>
            <textarea id="c-message" rows={6} className={fieldCls} {...register("message")} />
          </Field>
          <button type="submit" disabled={isSubmitting} className={btnPrimary()}>
            {isSubmitting ? t("contact.sending") : t("contact.send")}
          </button>
        </form>
        <aside className="border-t border-foreground pt-6 lg:col-span-4 lg:col-start-9">
          <h2 className="font-label text-xl">{t("info.contact.tipTitle")}</h2>
          <p className="mt-3 text-muted-foreground">{t("info.contact.tipBody")}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("info.contact.tipHintPrefix")}{" "}
            <span className="font-semibold text-foreground">"Tip:"</span>{" "}
            {t("info.contact.tipHintSuffix")}
          </p>
        </aside>
      </div>
    </Container>
  );
}

export function AdvertisePage() {
  const { t } = useTranslation();
  const blocks = [
    { title: t("info.advertise.audienceTitle"), body: t("info.advertise.audienceBody") },
    { title: t("info.advertise.formatsTitle"), body: t("info.advertise.formatsBody") },
    { title: t("info.advertise.principlesTitle"), body: t("info.advertise.principlesBody") },
  ];
  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow={t("info.advertise.eyebrow")} title={t("info.advertise.title")}>
        {t("info.advertise.subtitle")}
      </PageTitle>
      <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-3">
        {blocks.map((x) => (
          <Reveal key={x.title} className="border-t border-foreground pt-4">
            <h2 className="font-label text-xl">{x.title}</h2>
            <p className="mt-3 text-muted-foreground">{x.body}</p>
          </Reveal>
        ))}
      </div>
      <div className="mt-16 flex flex-wrap gap-3">
        <Link to="/contact" className={btnPrimary()}>
          {t("info.advertise.contactCta")}
        </Link>
        <Link to="/about" className={btnSecondary()}>
          {t("info.advertise.aboutCta")}
        </Link>
      </div>
    </Container>
  );
}

function Legal({
  title,
  sections,
}: {
  title: string;
  sections: [string, string][];
}) {
  const { t } = useTranslation();
  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow={t("info.legal.eyebrow")} title={title}>
        {t("info.legal.lastUpdated")}
      </PageTitle>
      <Prose>
        {sections.map(([h, p]) => (
          <section key={h}>
            <h2>{h}</h2>
            <p className="mt-3">{p}</p>
          </section>
        ))}
      </Prose>
    </Container>
  );
}

// TODO(i18n): legal body paragraphs remain English — needs professional translation.
// Headings and page titles are translated via t("info.legal.*").
export const PrivacyPage = () => {
  const { t } = useTranslation();
  return (
    <Legal
      title={t("info.legal.privacyTitle")}
      sections={[
        [
          "Information we collect",
          "If you subscribe to our newsletter we store your email address. We collect basic, anonymous usage statistics to understand which pages are read.",
        ],
        [
          "How we use it",
          "We use your email only to send the newsletter you asked for. We do not sell or rent personal data to anyone.",
        ],
        [
          "Cookies",
          "We use a small number of essential cookies, for example to remember your theme preference.",
        ],
        [
          "Your rights",
          "You can unsubscribe at any time and ask us to delete your data by contacting us.",
        ],
      ]}
    />
  );
};

export const TermsPage = () => {
  const { t } = useTranslation();
  return (
    <Legal
      title={t("info.legal.termsTitle")}
      sections={[
        [
          "Using the site",
          "Startup News Room provides summaries of news published by third parties. Content is for information only and is not investment advice.",
        ],
        [
          "Third-party links",
          "We link to original sources. We are not responsible for the content or policies of external websites.",
        ],
        [
          "Intellectual property",
          "Summaries, design and branding belong to Startup News Room. Original articles belong to their publishers.",
        ],
        [
          "Changes",
          "We may update these terms from time to time. Continued use of the site means you accept the current version.",
        ],
      ]}
    />
  );
};