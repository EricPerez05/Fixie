"use client";

import { motion } from "framer-motion";

const MOTES = [
  { left: "18%", top: "38%", delay: 0 },
  { left: "72%", top: "30%", delay: 0.4 },
  { left: "40%", top: "58%", delay: 0.8 },
  { left: "64%", top: "64%", delay: 0.2 },
  { left: "28%", top: "24%", delay: 1.1 },
  { left: "82%", top: "50%", delay: 0.6 },
];

/**
 * Loading state over the frozen frame. A 3–10s vision call feels broken
 * without something visibly happening.
 */
export function InspectingOverlay(): React.JSX.Element {
  return (
    <div className="absolute inset-0 z-10 bg-moss-deep/45">
      {MOTES.map((mote) => (
        <motion.span
          key={`${mote.left}-${mote.top}`}
          aria-hidden="true"
          className="absolute h-2.5 w-2.5 rotate-45 bg-glimmer-soft shadow-[0_0_12px_var(--glimmer)]"
          style={{ left: mote.left, top: mote.top }}
          animate={{ y: [0, -18, 0], opacity: [0.2, 1, 0.2], scale: [0.6, 1.1, 0.6] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: mote.delay, ease: "easeInOut" }}
        />
      ))}
      <p className="absolute inset-x-0 bottom-[calc(9rem+env(safe-area-inset-bottom))] text-center font-display text-xl text-lichen">
        The fairies are inspecting…
      </p>
    </div>
  );
}
