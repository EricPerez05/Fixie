"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ScanButtonProps {
  onScan: () => void;
  isBusy: boolean;
}

const SPARKS = [0, 60, 120, 180, 240, 300];

/**
 * The big round shutter. Each press sends out a ring and a burst of sparks,
 * which also covers the beat before the loading state appears.
 */
export function ScanButton({ onScan, isBusy }: ScanButtonProps): React.JSX.Element {
  const [pressCount, setPressCount] = useState(0);

  function handlePress(): void {
    setPressCount((count) => count + 1);
    onScan();
  }

  return (
    <div className="relative grid h-24 w-24 place-items-center">
      <AnimatePresence>
        {pressCount > 0 && (
          <motion.span
            key={pressCount}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="absolute inset-0 rounded-full border-4 border-glimmer"
              initial={{ scale: 0.8, opacity: 1 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
            {SPARKS.map((angle) => (
              <motion.span
                key={angle}
                className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-glimmer-soft"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((angle * Math.PI) / 180) * 64,
                  y: Math.sin((angle * Math.PI) / 180) * 64,
                  opacity: 0,
                }}
                transition={{ duration: 0.55, ease: "easeOut" }}
              />
            ))}
          </motion.span>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={handlePress}
        disabled={isBusy}
        aria-label="Scan item"
        whileTap={{ scale: 0.9 }}
        className="relative grid h-21 w-21 place-items-center rounded-full border-4 border-lichen bg-glimmer shadow-[0_0_0_6px_var(--moss-deep)] disabled:opacity-60"
      >
        <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true" className="fill-moss-deep">
          <path d="M12 2 l2.2 6.8 L21 11 l-6.8 2.2 L12 20 l-2.2-6.8 L3 11 l6.8-2.2 Z" />
        </svg>
      </motion.button>
    </div>
  );
}
