import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateBatch } from "@/i18n/translate"; // Using your existing batch translator
import { cn } from "@/lib/utils";

export function TranslatedHtml({ html, className }: { html: string; className?: string }) {
    const { i18n } = useTranslation();
    const [content, setContent] = useState(html);

    useEffect(() => {
        if (i18n.language === "en" || !html) {
            setContent(html);
            return;
        }

        let alive = true;
        setContent(html); // Show English while translating

        // 1. Parse the HTML string into a virtual DOM
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // 2. Find all text nodes (the actual words, ignoring the tags)
        const textNodes: Node[] = [];
        const walk = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
        let node;
        while ((node = walk.nextNode())) {
            if (node.nodeValue && node.nodeValue.trim().length > 0) {
                textNodes.push(node);
            }
        }

        const originalTexts = textNodes.map((n) => n.nodeValue || "");

        // 3. Translate the text nodes using your batch API
        (async () => {
            try {
                const translatedTexts = await translateBatch(originalTexts, i18n.language);

                if (alive) {
                    textNodes.forEach((textNode, i) => {
                        // Preserve original whitespace around the text
                        const original = textNode.nodeValue || "";
                        const leadingSpace = original.match(/^\s*/)?.[0] || "";
                        const trailingSpace = original.match(/\s*$/)?.[0] || "";

                        // Put the translated text back into the DOM node
                        textNode.nodeValue = leadingSpace + translatedTexts[i] + trailingSpace;
                    });

                    // 4. Convert the virtual DOM back to an HTML string
                    setContent(doc.body.innerHTML);
                }
            } catch (err) {
                console.error("HTML translation failed", err);
            }
        })();

        return () => {
            alive = false;
        };
    }, [html, i18n.language]);

    return (
        <div
            className={cn(
                "story-content",
                className
            )}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
}