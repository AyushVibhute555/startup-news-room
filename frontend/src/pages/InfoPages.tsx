import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { btnPrimary, btnSecondary } from "@/components/Buttons";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { PageTitle } from "@/pages/ListingPages";

function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mt-12 max-w-[680px] space-y-6 text-[1.0625rem] leading-[1.75] [&_h2]:headline [&_h2]:pt-6 [&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
      {children}
    </div>
  );
}

export function AboutPage() {
  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow="About" title="The startup story, every day.">
        Startup News Room is a daily digest of the headlines that matter to founders, operators and
        investors.
      </PageTitle>
      <Reveal>
        <Prose>
          <h2>Our mission</h2>
          <p>
            We save you time. Every day we read across publications, pick the stories worth knowing
            and summarise each in a few sentences, always linking to the original reporting.
          </p>
          <h2>What we cover</h2>
          <ul>
            <li>Funding rounds and investor activity</li>
            <li>Product launches and new companies</li>
            <li>AI, fintech and SaaS businesses</li>
            <li>Founders, markets and policy</li>
          </ul>
          <h2>How we pick stories</h2>
          <p>
            Editors prioritise significance over noise: news that changes a market, a sector or how
            companies are built. We avoid press-release rewrites and unverified rumours.
          </p>
          <h2>Editorial standards</h2>
          <p>
            Every summary credits its source and links to it. We correct errors quickly and
            transparently, and advertising never influences what we publish.
          </p>
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
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
  });
  const onSubmit = async (_v: ContactValues) => {
    // TODO: POST to Express API /api/contact
    await new Promise((r) => setTimeout(r, 400));
    toast.success("Thanks, your message has been sent.");
    reset();
  };
  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow="Contact" title="Get in touch">
        Questions, corrections or feedback. We read everything.
      </PageTitle>
      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-6">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6 lg:col-span-7">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Field id="c-name" label="Name" error={errors.name?.message}>
              <input id="c-name" autoComplete="name" className={fieldCls} {...register("name")} />
            </Field>
            <Field id="c-email" label="Email" error={errors.email?.message}>
              <input
                id="c-email"
                type="email"
                autoComplete="email"
                className={fieldCls}
                {...register("email")}
              />
            </Field>
          </div>
          <Field id="c-subject" label="Subject" error={errors.subject?.message}>
            <input id="c-subject" className={fieldCls} {...register("subject")} />
          </Field>
          <Field id="c-message" label="Message" error={errors.message?.message}>
            <textarea id="c-message" rows={6} className={fieldCls} {...register("message")} />
          </Field>
          <button type="submit" disabled={isSubmitting} className={btnPrimary()}>
            {isSubmitting ? "Sending..." : "Send message"}
          </button>
        </form>
        <aside className="border-t border-foreground pt-6 lg:col-span-4 lg:col-start-9">
          <h2 className="font-label text-xl">Submit a story or tip</h2>
          <p className="mt-3 text-muted-foreground">
            Raising a round, launching a product or know something we should cover? Send us the
            details and a link. We never publish a tip without verifying it.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Use the form and start your subject with{" "}
            <span className="font-semibold text-foreground">"Tip:"</span> so it reaches the editors
            directly.
          </p>
        </aside>
      </div>
    </Container>
  );
}

export function AdvertisePage() {
  const blocks = [
    {
      t: "Audience",
      b: "Founders, operators, investors and early employees who read the day's startup news every morning.",
    },
    {
      t: "Formats",
      b: "Newsletter sponsorships, a single native placement on the home page, and sponsored briefings on a chosen theme.",
    },
    {
      t: "Principles",
      b: "Every partnership is clearly labelled. Sponsors never influence editorial selection or summaries.",
    },
  ];
  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow="Partnerships" title="Advertise with us">
        Reach the people building the next generation of companies, in a calm, uncluttered setting.
      </PageTitle>
      <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 md:grid-cols-3">
        {blocks.map((x) => (
          <Reveal key={x.t} className="border-t border-foreground pt-4">
            <h2 className="font-label text-xl">{x.t}</h2>
            <p className="mt-3 text-muted-foreground">{x.b}</p>
          </Reveal>
        ))}
      </div>
      <div className="mt-16 flex flex-wrap gap-3">
        <Link to="/contact" className={btnPrimary()}>
          Contact partnerships
        </Link>
        <Link to="/about" className={btnSecondary()}>
          About the newsroom
        </Link>
      </div>
    </Container>
  );
}

function Legal({ title, sections }: { title: string; sections: [string, string][] }) {
  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow="Legal" title={title}>
        Last updated: 1 October 2026. Placeholder text for review by counsel.
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

export const PrivacyPage = () => (
  <Legal
    title="Privacy Policy"
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

export const TermsPage = () => (
  <Legal
    title="Terms of Use"
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
