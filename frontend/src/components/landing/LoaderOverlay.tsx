import { useEffect, useRef, useState } from "react";
import { PenguinIcon } from "@/components/ui/PenguinIcon";

interface LoaderOverlayProps {
  onDone: () => void;
}

const MIN_VISIBLE_MS = 1400;
const EXIT_MS = 850;

export const LoaderOverlay = ({ onDone }: LoaderOverlayProps) => {
  const [exiting, setExiting] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [wordmarkVisible, setWordmarkVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Reduced motion preference
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minMs = prefersReduced ? 200 : MIN_VISIBLE_MS;
    const exitMs = prefersReduced ? 0 : EXIT_MS;

    // Animate wordmark in shortly after mount
    const wm = setTimeout(() => setWordmarkVisible(true), 80);

    const triggerExit = () => {
      setExiting(true);
      onDone();
      timerRef.current = setTimeout(() => setRemoved(true), exitMs);
    };

    if (document.readyState === "complete") {
      timerRef.current = setTimeout(triggerExit, minMs);
    } else {
      const onLoad = () => {
        timerRef.current = setTimeout(triggerExit, minMs);
      };
      window.addEventListener("load", onLoad, { once: true });
      // Fallback: max visible
      const max = setTimeout(triggerExit, prefersReduced ? 200 : 2600);
      return () => {
        clearTimeout(wm);
        clearTimeout(max);
        window.removeEventListener("load", onLoad);
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    return () => {
      clearTimeout(wm);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDone]);

  if (removed) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-8"
      style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)",
        animation: exiting
          ? `loaderSlideUp ${EXIT_MS}ms cubic-bezier(0.645,0.045,0.355,1) forwards`
          : "none",
      }}
    >
      {/* Wordmark */}
      <div
        className="flex items-center gap-3"
        style={{
          opacity: wordmarkVisible ? 1 : 0,
          transform: wordmarkVisible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <div className="w-7 h-7 rounded-xl bg-white/15 flex items-center justify-center">
          <PenguinIcon className="w-4 h-4 text-white" />
        </div>
        <span
          className="text-white text-2xl font-medium uppercase tracking-[0.2em]"
          style={{ fontFamily: "'Onest', system-ui, sans-serif" }}
        >
          NexusChat
        </span>
      </div>

      {/* Progress track */}
      <div
        className="w-40 h-px rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.2)" }}
      >
        <div
          className="h-full bg-white loader-progress"
        />
      </div>
    </div>
  );
};
