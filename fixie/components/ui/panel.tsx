"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PanelProps {
  children: ReactNode;
  labelledBy: string;
}

/**
 * Full-screen cream page that rises over the camera for results and errors.
 * Mount it inside <AnimatePresence> so it can slide away again.
 *
 * It never scrolls: children get exactly the screen and must fit it. It is a
 * size container, so children can size themselves with cqh units.
 */
export function Panel({ children, labelledBy }: PanelProps): React.JSX.Element {
  return (
    <motion.section
      role="region"
      aria-labelledby={labelledBy}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 300 }}
      className="absolute inset-0 z-20 overflow-clip bg-cream bg-[radial-gradient(circle_at_90%_15%,color-mix(in_srgb,var(--glimmer)_15%,transparent),transparent_18%)] px-5 pt-[calc(var(--safe-top)+clamp(12px,2.5cqh,24px))] pb-[max(1rem,var(--safe-bottom))] text-ink [container-type:size]"
    >
      <div className="mx-auto h-full max-w-md">{children}</div>
    </motion.section>
  );
}
