import * as Dialog from "@radix-ui/react-dialog";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components/Container";
import { btnPrimary } from "@/components/Buttons";

export function SearchOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Content
          data-lenis-prevent
          className="fixed inset-0 z-[60] overflow-y-auto bg-background data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        >
          <Container className="pt-6">
            <div className="flex justify-end">
              <Dialog.Close
                aria-label="Close search"
                className="inline-flex h-11 w-11 items-center justify-center rounded-[4px] hover:text-signal"
              >
                <X className="h-6 w-6" />
              </Dialog.Close>
            </div>
            <Dialog.Title className="font-label mt-12 text-sm text-muted-foreground">
              Search the newsroom
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Type a keyword and press enter to search stories.
            </Dialog.Description>
            <form
              role="search"
              className="mt-4 flex flex-col gap-4 border-b-2 border-foreground pb-4 sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                const term = q.trim();
                if (!term) return;
                onOpenChange(false);
                navigate(`/search?q=${encodeURIComponent(term)}`);
              }}
            >
              <Search className="hidden h-7 w-7 shrink-0 sm:block" aria-hidden />
              <label htmlFor="site-search" className="sr-only">
                Search stories
              </label>
              <input
                id="site-search"
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Funding, AI, a company..."
                className="headline min-w-0 flex-1 bg-transparent text-3xl outline-none placeholder:text-muted-foreground sm:text-5xl"
              />
              <button type="submit" className={btnPrimary()}>
                Search
              </button>
            </form>
          </Container>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
