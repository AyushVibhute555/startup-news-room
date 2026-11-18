import type { KeyFact } from "@/types/story";

interface KeyFactsEditorProps {
  id: string;
  title: string;
  labelText: string;
  valueText: string;
  addText: string;
  removeText: string;
  facts: KeyFact[];
  onChange: (facts: KeyFact[]) => void;
  error?: string | undefined;
}

export function KeyFactsEditor({
  id,
  title,
  labelText,
  valueText,
  addText,
  removeText,
  facts,
  onChange,
  error,
}: KeyFactsEditorProps) {
  function update(index: number, key: keyof KeyFact, value: string) {
    onChange(facts.map((fact, factIndex) => (
      factIndex === index ? { ...fact, [key]: value } : fact
    )));
  }

  return (
    <fieldset className="space-y-3 rounded border border-border p-4">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {facts.map((fact, index) => (
        <div key={`${id}-${index}`} className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]">
          <label htmlFor={`${id}-${index}-label`} className="text-xs font-medium">
            {labelText}
            <input
              id={`${id}-${index}-label`}
              value={fact.label}
              maxLength={80}
              onChange={(event) => update(index, "label", event.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label htmlFor={`${id}-${index}-value`} className="text-xs font-medium">
            {valueText}
            <input
              id={`${id}-${index}-value`}
              value={fact.value}
              maxLength={300}
              onChange={(event) => update(index, "value", event.target.value)}
              className="mt-1 w-full rounded border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => onChange(facts.filter((_, factIndex) => factIndex !== index))}
            className="self-end rounded border border-border px-3 py-2 text-xs"
          >
            {removeText}
          </button>
        </div>
      ))}
      {error && <p role="alert" className="text-xs text-signal">{error}</p>}
      {facts.length < 8 && (
        <button
          type="button"
          onClick={() => onChange([...facts, { label: "", value: "" }])}
          className="rounded border border-border px-3 py-2 text-sm"
        >
          {addText}
        </button>
      )}
    </fieldset>
  );
}
