import type Lenis from "lenis";

let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};

export function scrollToTop() {
  if (instance) instance.scrollTo(0, { immediate: true });
  else if (typeof window !== "undefined") window.scrollTo(0, 0);
}
