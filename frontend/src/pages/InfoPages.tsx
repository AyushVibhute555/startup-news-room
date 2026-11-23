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
          <Link to="/post-news" className={`${btnPrimary()} mt-5`}>
            {t("postNews.submit")}
          </Link>
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

function Legal({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow={t("info.legal.eyebrow")} title={title}>
        {t("info.legal.lastUpdated")}
      </PageTitle>
      <Prose>{children}</Prose>
    </Container>
  );
}

// TODO(i18n): legal body paragraphs remain English — needs professional translation.
// Headings and page titles are translated via t("info.legal.*").
export const PrivacyPage = () => {
  const { t } = useTranslation();
  return (
    <Legal title={t("info.legal.privacyTitle")}>
      <p>
        Startup News Room ("SNR", "we", "us") publishes startup news at{" "}
        <a className="underline" href="https://startupnewsroom.in">
          startupnewsroom.in
        </a>
        . The site is run by Startup Newsroom, Bengaluru. This policy explains what personal data we
        collect, why we collect it, and the choices you have. We collect as little as we need.
      </p>

      <section>
        <h2>1. What we collect</h2>
        <ul>
          <li>
            <strong>When you just read the site:</strong> we do not ask for your name or email. Our
            analytics tools record basic usage data such as pages visited, time spent, device and
            browser type, approximate location (city level) and how you reached us.
          </li>
          <li>
            <strong>When you subscribe to our newsletter:</strong> your email address.
          </li>
          <li>
            <strong>When you contact us or send a tip:</strong> your name, email address and your
            message.
          </li>
          <li>
            <strong>When you submit news through "Post News":</strong> your name, email address, the
            story text and the image you upload. We also record your IP address to prevent spam and
            abuse.
          </li>
          <li>
            <strong>Your preferences:</strong> your chosen language and light or dark theme are
            saved in your own browser, not on our servers.
          </li>
        </ul>
        <p>
          We do not collect payment details, government IDs or any sensitive personal data, and we
          do not knowingly collect data from children under 18.
        </p>
      </section>

      <section>
        <h2>2. Why we use it</h2>
        <ul>
          <li>To send you the newsletter you asked for</li>
          <li>To reply to your messages and review the news you submit</li>
          <li>To understand which stories readers find useful and improve the site</li>
          <li>To keep the site secure and prevent spam, fraud and misuse</li>
          <li>To meet our legal obligations</li>
        </ul>
        <p>
          We do not sell your personal data, and we do not use it for any purpose you have not
          agreed to.
        </p>
      </section>

      <section>
        <h2>3. Your consent</h2>
        <p>
          We process your personal data on the basis of your consent, which you give when you
          subscribe, contact us or submit news, and for legitimate uses allowed under the Digital
          Personal Data Protection Act, 2023. You can withdraw your consent at any time. Withdrawing
          consent does not affect anything we did before you withdrew it.
        </p>
      </section>

      <section>
        <h2>4. Cookies and analytics</h2>
        <p>
          We use Google Analytics, through Google Tag Manager, to count visits and see how the site
          is used. These tools set cookies on your device. You can block or delete cookies in your
          browser settings, and the site will still work. You can also opt out of Google Analytics
          using Google's browser add-on.
        </p>
      </section>

      <section>
        <h2>5. Who we share data with</h2>
        <p>
          We share data only with service providers that help us run the site, and only for that
          purpose:
        </p>
        <ul>
          <li>website hosting</li>
          <li>server hosting</li>
          <li>database</li>
          <li>image storage</li>
          <li>Google (analytics)</li>
          <li>Our email service, to send the newsletter</li>
        </ul>
        <p>
          Some of these providers store data on servers outside India. We use reputable providers
          that protect data with appropriate safeguards. We may also share data if the law requires
          it, for example in response to a valid request from a government authority or court.
        </p>
      </section>

      <section>
        <h2>6. How long we keep it</h2>
        <ul>
          <li>Newsletter emails: until you unsubscribe</li>
          <li>Messages and tips: up to 2 years, then deleted</li>
          <li>
            News submissions: up to 2 years. If we publish a story based on your submission, the
            published story stays on the site
          </li>
          <li>Analytics data: as set in our Google Analytics settings, usually up to 14 months</li>
        </ul>
      </section>

      <section>
        <h2>7. Your rights</h2>
        <p>Under Indian law, you can ask us to:</p>
        <ul>
          <li>Tell you what personal data we hold about you and how we use it</li>
          <li>Correct or update it</li>
          <li>Delete it, unless we must keep it by law</li>
          <li>Stop sending you the newsletter (use the unsubscribe link in any email)</li>
          <li>Name someone to exercise these rights on your behalf if you are unable to</li>
        </ul>
        <p>
          To make a request, email{" "}
          <a className="underline" href="mailto:editor@startupnewsroom.in">
            editor@startupnewsroom.in
          </a>
          . We will respond within 30 days.
        </p>
      </section>

      <section>
        <h2>8. Security</h2>
        <p>
          We use encrypted connections (HTTPS), access controls and trusted hosting providers to
          protect your data. No system is completely secure, but we work to protect your information
          and will notify you and the authorities if a data breach affects you, as the law requires.
        </p>
      </section>

      <section>
        <h2>9. Links to other sites</h2>
        <p>
          Our stories may mention or link to other websites. We are not responsible for their
          privacy practices; please read their policies.
        </p>
      </section>

      <section>
        <h2>10. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. We will change the "Last updated" date at the
          top, and for major changes we will tell newsletter subscribers by email.
        </p>
      </section>

      <section>
        <h2>11. Grievance Officer</h2>
        <p>
          If you have a question or complaint about your personal data, contact our Grievance
          Officer:
        </p>
        <p>
          The Editor, Startup Newsroom
          <br />
          Email:{" "}
          <a className="underline" href="mailto:editor@startupnewsroom.in">
            editor@startupnewsroom.in
          </a>
          <br />
          Address: HSR Layout, Bengaluru
        </p>
        <p>
          We will acknowledge your complaint within 24 hours and aim to resolve it within 15 days.
          If you are not satisfied with our response, you may contact the Data Protection Board of
          India.
        </p>
      </section>
    </Legal>
  );
};

export const TermsPage = () => {
  const { t } = useTranslation();
  return (
    <Legal title={t("info.legal.termsTitle")}>
      <p>
        Welcome to Startup News Room (
        <a className="underline" href="https://startupnewsroom.in">
          startupnewsroom.in
        </a>
        ), run by Startup Newsroom, Bengaluru. By using this website, you agree to these terms. If
        you do not agree, please do not use the site.
      </p>

      <section>
        <h2>1. What we do</h2>
        <p>
          Startup News Room publishes news, analysis and updates about startups, investors and the
          technology ecosystem in Karnataka, India and around the world. Our stories are written by
          the SNR Desk based on public information, company announcements, regulatory filings and
          media reports.
        </p>
      </section>

      <section>
        <h2>2. Using the site</h2>
        <p>
          You may read, share and link to our stories for personal and non-commercial use. You agree
          not to:
        </p>
        <ul>
          <li>
            Copy, republish or sell our stories, images or banners in bulk without our written
            permission
          </li>
          <li>Use bots, scrapers or automated tools to copy content from the site</li>
          <li>Try to hack, overload or disrupt the site or its servers</li>
          <li>
            Post or submit anything unlawful, defamatory, misleading, obscene or that infringes
            someone else's rights
          </li>
          <li>Pretend to be someone else or give false information</li>
        </ul>
        <p>
          Sharing a headline with a link back to the full story on{" "}
          <a className="underline" href="https://startupnewsroom.in">
            startupnewsroom.in
          </a>{" "}
          is always welcome.
        </p>
      </section>

      <section>
        <h2>3. Our content</h2>
        <p>
          All stories, banners, graphics and the Startup News Room name and logo belong to Startup
          Newsroom or are used with permission. They are protected by copyright and trademark law.
          Company names and logos mentioned in our stories belong to their owners.
        </p>
      </section>

      <section>
        <h2>4. News accuracy</h2>
        <p>
          We work hard to be accurate and fair, but news changes quickly. Our content is for general
          information only. It is not investment, financial, legal or business advice. Do not make
          investment decisions based only on our stories; please verify important facts and speak to
          a qualified advisor.
        </p>
        <p>
          If you spot an error, email{" "}
          <a className="underline" href="mailto:editor@startupnewsroom.in">
            editor@startupnewsroom.in
          </a>
          . We will review it and correct the story where needed.
        </p>
      </section>

      <section>
        <h2>5. Submitting news</h2>
        <p>When you send us news through "Post News", a tip or a message:</p>
        <ul>
          <li>
            You confirm that the information is true to the best of your knowledge and that you have
            the right to share it, including any image
          </li>
          <li>
            You allow us to edit, publish and share it, in full or in part, on our website and
            social media
          </li>
          <li>
            Submitting does not guarantee publication. Our editors decide what to publish, and may
            change or reject any submission
          </li>
          <li>We do not pay for submissions</li>
        </ul>
      </section>

      <section>
        <h2>6. Sponsored content</h2>
        <p>
          Any paid or partner content is clearly labelled "Sponsored" or "Partner content". Our news
          coverage is independent of advertisers and sponsors.
        </p>
      </section>

      <section>
        <h2>7. Newsletter</h2>
        <p>
          If you subscribe, we will send you our startup news newsletter. You can unsubscribe at any
          time using the link in every email.
        </p>
      </section>

      <section>
        <h2>8. Links to other websites</h2>
        <p>
          Our site may link to other websites. We do not control them and are not responsible for
          their content or practices.
        </p>
      </section>

      <section>
        <h2>9. Limitation of liability</h2>
        <p>
          The site is provided "as is". We do not promise that it will always be available,
          error-free or free of viruses. To the extent the law allows, Startup Newsroom is not
          liable for any loss or damage that arises from using the site or relying on its content.
        </p>
      </section>

      <section>
        <h2>10. Changes</h2>
        <p>
          We may update these terms from time to time. The "Last updated" date at the top shows when
          they last changed. Continuing to use the site means you accept the updated terms.
        </p>
      </section>

      <section>
        <h2>11. Governing law</h2>
        <p>
          These terms are governed by the laws of India. Any dispute will be handled by the courts
          in Bengaluru, Karnataka.
        </p>
      </section>

      <section>
        <h2>12. Contact and grievances</h2>
        <p>
          For questions about these terms, email{" "}
          <a className="underline" href="mailto:editor@startupnewsroom.in">
            editor@startupnewsroom.in
          </a>
          .
        </p>
        <p>
          Under the Information Technology (Intermediary Guidelines and Digital Media Ethics Code)
          Rules, 2021, complaints about our content can be sent to our Grievance Officer:
        </p>
        <p>
          The Editor, Startup Newsroom
          <br />
          Email:{" "}
          <a className="underline" href="mailto:editor@startupnewsroom.in">
            editor@startupnewsroom.in
          </a>
          <br />
          Address: HSR Layout, Bengaluru
        </p>
        <p>
          We will acknowledge your complaint within 24 hours and aim to resolve it within 15 days.
        </p>
      </section>
    </Legal>
  );
};
