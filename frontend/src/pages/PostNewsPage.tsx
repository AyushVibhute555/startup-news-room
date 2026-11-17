import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { btnPrimary } from "@/components/Buttons";
import { Container } from "@/components/Container";
import { PageTitle } from "@/pages/ListingPages";
import { ApiError, getCategories, submitNewsStory } from "@/lib/api";
import type { Category } from "@/types/story";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface SubmissionFields {
  submitterName: string;
  submitterEmail: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  imageCredit: string;
  category: string;
  publishedAt: string;
}

const emptyFields: SubmissionFields = {
  submitterName: "",
  submitterEmail: "",
  title: "",
  summary: "",
  content: "",
  author: "",
  imageCredit: "",
  category: "",
  publishedAt: "",
};

const inputClass =
  "mt-2 w-full min-h-[48px] rounded-[4px] border border-border bg-background px-4 py-3 outline-none transition-colors focus-visible:border-foreground";
const textAreaClass =
  "mt-2 w-full rounded-[4px] border border-border bg-background px-4 py-3 outline-none transition-colors focus-visible:border-foreground";

function FormField({
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

export function PostNewsPage() {
  const { t } = useTranslation();
  const [fields, setFields] = useState(emptyFields);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesError, setCategoriesError] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof SubmissionFields | "image", string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const loadCategories = useCallback(async () => {
    setCategoriesError(false);
    try {
      setCategories(await getCategories());
    } catch {
      setCategoriesError(true);
      toast.error(t("postNews.categoryLoadError"));
    }
  }, [t]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  function update<K extends keyof SubmissionFields>(key: K, value: SubmissionFields[K]) {
    setFields((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function chooseImage(file: File | undefined) {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImage(null);
      setErrors((current) => ({ ...current, image: t("postNews.imageTypeError") }));
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImage(null);
      setErrors((current) => ({ ...current, image: t("postNews.imageSizeError") }));
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setImage(file);
    setErrors((current) => {
      const next = { ...current };
      delete next.image;
      return next;
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (fields.submitterName.trim().length < 2) nextErrors.submitterName = t("postNews.nameError");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.submitterEmail.trim())) {
      nextErrors.submitterEmail = t("postNews.emailError");
    }
    if (fields.title.trim().length < 10) nextErrors.title = t("postNews.titleError");
    if (fields.summary.trim().length < 40) nextErrors.summary = t("postNews.subheadingError");
    if (fields.summary.trim().length > 500) nextErrors.summary = t("postNews.subheadingLengthError");
    if (!fields.content.trim()) nextErrors.content = t("postNews.articleError");
    if (!fields.category) nextErrors.category = t("postNews.categoryError");
    const newsDate = fields.publishedAt ? new Date(fields.publishedAt) : null;
    if (newsDate && Number.isNaN(newsDate.getTime())) nextErrors.publishedAt = t("postNews.newsDateError");
    if (!image) nextErrors.image = t("postNews.imageRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t("postNews.fixFields"));
      return;
    }
    if (!image) return;

    setSubmitting(true);
    try {
      await submitNewsStory(
        {
          submitterName: fields.submitterName.trim(),
          submitterEmail: fields.submitterEmail.trim(),
          title: fields.title.trim(),
          summary: fields.summary.trim(),
          content: fields.content.trim(),
          author: fields.author.trim(),
          imageCredit: fields.imageCredit.trim(),
          category: fields.category,
          ...(newsDate ? { publishedAt: newsDate.toISOString() } : {}),
        },
        image,
      );
      setFields(emptyFields);
      setImage(null);
      if (fileInput.current) fileInput.current.value = "";
      setErrors({});
      setSubmitted(true);
      toast.success(t("postNews.successTitle"));
    } catch (error) {
      const message =
        error instanceof ApiError && error.status === 413
          ? t("postNews.imageSizeError")
          : error instanceof ApiError
            ? error.message
            : t("postNews.submitError");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container className="section-y !pt-12">
      <PageTitle eyebrow={t("postNews.eyebrow")} title={t("postNews.title")}>
        {t("postNews.intro")}
      </PageTitle>

      {submitted ? (
        <div className="mt-10 max-w-2xl rounded border border-border bg-muted/20 p-6">
          <h2 className="font-label text-2xl">{t("postNews.successTitle")}</h2>
          <p className="mt-3 text-muted-foreground">{t("postNews.successBody")}</p>
          <button type="button" className={`${btnPrimary()} mt-6`} onClick={() => setSubmitted(false)}>
            {t("postNews.submitAnother")}
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]">
          <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField id="submitterName" label={t("postNews.name")} error={errors.submitterName}>
                <input
                  id="submitterName"
                  autoComplete="name"
                  required
                  maxLength={120}
                  className={inputClass}
                  value={fields.submitterName}
                  onChange={(event) => update("submitterName", event.target.value)}
                />
              </FormField>
              <FormField id="submitterEmail" label={t("postNews.email")} error={errors.submitterEmail}>
                <input
                  id="submitterEmail"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  className={inputClass}
                  value={fields.submitterEmail}
                  onChange={(event) => update("submitterEmail", event.target.value)}
                />
              </FormField>
            </div>

            <FormField id="storyTitle" label={t("postNews.headline")} error={errors.title}>
              <input
                id="storyTitle"
                required
                minLength={10}
                maxLength={180}
                className={inputClass}
                value={fields.title}
                onChange={(event) => update("title", event.target.value)}
              />
            </FormField>

            <FormField id="storySummary" label={t("postNews.subheading")} error={errors.summary}>
              <textarea
                id="storySummary"
                required
                minLength={40}
                maxLength={500}
                rows={3}
                className={textAreaClass}
                value={fields.summary}
                onChange={(event) => update("summary", event.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">{fields.summary.length} / 500</p>
            </FormField>

            <FormField id="storyContent" label={t("postNews.article")} error={errors.content}>
              <textarea
                id="storyContent"
                required
                maxLength={50000}
                rows={12}
                className={textAreaClass}
                value={fields.content}
                onChange={(event) => update("content", event.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t("postNews.articleHint")}</p>
            </FormField>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField id="storyAuthor" label={t("postNews.author")}>
                <input
                  id="storyAuthor"
                  maxLength={120}
                  className={inputClass}
                  value={fields.author}
                  onChange={(event) => update("author", event.target.value)}
                />
              </FormField>
              <FormField id="storyCategory" label={t("postNews.category")} error={errors.category}>
                <select
                  id="storyCategory"
                  required
                  disabled={categoriesError || categories.length === 0}
                  className={inputClass}
                  value={fields.category}
                  onChange={(event) => update("category", event.target.value)}
                >
                  <option value="">{t("postNews.chooseCategory")}</option>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categoriesError && (
                  <button
                    type="button"
                    className="mt-2 text-sm underline"
                    onClick={() => void loadCategories()}
                  >
                    {t("common.retry")}
                  </button>
                )}
              </FormField>
              <FormField id="newsDate" label={t("postNews.newsDate")} error={errors.publishedAt}>
                <input
                  id="newsDate"
                  type="datetime-local"
                  className={inputClass}
                  value={fields.publishedAt}
                  onChange={(event) => update("publishedAt", event.target.value)}
                />
              </FormField>
            </div>

            <FormField id="storyImage" label={t("postNews.image")} error={errors.image}>
              <input
                ref={fileInput}
                id="storyImage"
                type="file"
                required={!image}
                accept="image/jpeg,image/png,image/webp"
                className={`${inputClass} file:mr-4 file:rounded file:border-0 file:bg-foreground file:px-3 file:py-2 file:text-sm file:text-background`}
                onChange={(event) => chooseImage(event.target.files?.[0])}
              />
              <p className="mt-1 text-xs text-muted-foreground">{t("postNews.imageHint")}</p>
              {imagePreview && <img src={imagePreview} alt="" className="mt-4 max-h-64 rounded object-contain" />}
            </FormField>

            <FormField id="storyImageCredit" label={t("postNews.imageCredit")}>
              <input
                id="storyImageCredit"
                maxLength={200}
                className={inputClass}
                value={fields.imageCredit}
                onChange={(event) => update("imageCredit", event.target.value)}
              />
            </FormField>

            <button type="submit" disabled={submitting || categoriesError || categories.length === 0} className={btnPrimary()}>
              {submitting ? t("postNews.submitting") : t("postNews.submit")}
            </button>
          </div>

          <aside className="h-fit border-t border-foreground pt-5 text-sm text-muted-foreground lg:sticky lg:top-8">
            <h2 className="font-label text-lg text-foreground">{t("postNews.reviewTitle")}</h2>
            <p className="mt-3">{t("postNews.reviewBody")}</p>
            <p className="mt-4">{t("postNews.privacyNote")}</p>
          </aside>
        </form>
      )}
    </Container>
  );
}
