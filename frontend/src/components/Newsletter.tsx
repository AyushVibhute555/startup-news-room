import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";

const schema = z.object({
  email: z.string().trim().email("Please enter a valid email address").max(255),
});
type Values = z.infer<typeof schema>;

export function Newsletter() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (_values: Values) => {
    // TODO: POST to Express API /api/newsletter
    await new Promise((r) => setTimeout(r, 400));
    toast.success("You're subscribed. Look out for tomorrow's briefing.");
    reset();
  };

  return (
    <section id="newsletter" className="section-y scroll-mt-24 bg-inverse text-inverse-foreground">
      <Container>
        <div className="newsletter-inner">
          <div className="newsletter-inner__content">
            <Reveal className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-end lg:gap-6">
              <div>
                <p className="font-label text-sm text-inverse-muted">Daily newsletter</p>
                <h2 className="headline mt-3 text-[clamp(1.875rem,3.6vw,3rem)]">
                  The day's startup
                  <br />
                  news, delivered to
                  <br />
                  your inbox.
                </h2>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <label htmlFor="nl-email" className="sr-only">
                  Email address
                </label>
                <div className="flex items-end gap-3">
                  <input
                    id="nl-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@company.com"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "nl-error" : undefined}
                    {...register("email")}
                    className="min-h-[48px] min-w-0 flex-1 rounded-[4px] border border-inverse-border bg-transparent px-4 text-inverse-foreground outline-none placeholder:text-inverse-muted focus-visible:border-inverse-foreground"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-[4px] bg-inverse-foreground px-6 text-sm font-semibold text-inverse transition-colors duration-200 hover:bg-signal hover:text-signal-foreground active:scale-[0.98] disabled:opacity-60"
                  >
                    {isSubmitting ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>
                {errors.email && (
                  <p id="nl-error" className="mt-2 text-sm text-signal">
                    {errors.email.message}
                  </p>
                )}
                <p className="mt-3 text-[0.8125rem] text-inverse-muted">
                  One email a day. Unsubscribe any time.
                </p>
              </form>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
