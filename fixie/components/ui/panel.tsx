"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  labelledBy: string;
  /** Pinned above the scrolling content. */
  header: ReactNode;
}

/**
 * Full-screen cream page that rises over the camera for results and errors.
 * Mount it inside <AnimatePresence> so it can slide away again.
 */
export function Panel({ children, labelledBy, header }: PanelProps): React.JSX.Element {
  return (
    <motion.section
      role="region"
      aria-labelledby={labelledBy}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 300 }}
      className="absolute inset-0 z-20 flex flex-col bg-cream bg-[radial-gradient(circle_at_90%_15%,color-mix(in_srgb,var(--glimmer)_15%,transparent),transparent_18%)] text-ink"
    >
      {header}
      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-[max(2rem,var(--safe-bottom))]">
        <div className="mx-auto max-w-md">{children}</div>
      </div>
    </motion.section>
  );
}
