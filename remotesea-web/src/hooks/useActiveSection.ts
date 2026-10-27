import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const SCROLL_SPY_ROOT_MARGIN = "-25% 0px -60% 0px";

/**
 * Tracks which of the given section ids is currently in view, for scroll-spy
 * navigation. Returns a `useState`-shaped tuple so callers can also set the
 * active id optimistically (e.g. on a nav click, before the observer catches up).
 */
export const useActiveSection = (ids: string[]): [string, Dispatch<SetStateAction<string>>] => {
  const [activeId, setActiveId] = useState(ids[0] ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];

        if (hit) {
          setActiveId(hit.target.id);
        }
      },
      {
        rootMargin: SCROLL_SPY_ROOT_MARGIN,
        threshold: 0,
      }
    );

    ids.forEach((id) => {
      const element = document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [activeId, setActiveId];
};
