"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface SheetProps {
  children: ReactNode;
  labelledBy: string;
}

/**
 * Bottom sheet that rises over the camera. Mount it inside <AnimatePresence>
 * so it can slide out again.
 */
export function Sheet({ children, labelledBy }: SheetProps): React.JSX.Element {
  return (
    <motion.section
      role="region"
      aria-labelledby={labelledBy}
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-x-0 bottom-0 z-20 max-h-[88dvh] overflow-y-auto rounded-t-[28px] bg-lichen px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-ink shadow-[0_-8px_32px_var(--moss-deep)]"
    >
      <div aria-hidden="true" className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-ink/20" />
      <div className="mx-auto max-w-md">{children}</div>
    </motion.section>
  );
}
