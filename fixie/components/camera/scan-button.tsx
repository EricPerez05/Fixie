"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";

interface ScanButtonProps {
  onScan: () => void;
  isBusy: boolean;
}

const SPARKS = [0, 60, 120, 180, 240, 300];

/**
 * The shutter on the live camera, styled as the start screen's gold orb.
 * Each press sends out a ring and a burst of sparks, which also covers the
 * beat before the loading state appears.
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
                className="absolute top-1/2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-glimmer-bright shadow-[0_0_8px_2px_var(--glimmer-bright)]"
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
        className="h-24 w-24 rounded-full border border-glimmer/50 bg-lichen/10 p-2 backdrop-blur-sm disabled:opacity-60"
      >
        <span className="grid h-full w-full place-items-center rounded-full bg-glimmer text-moss-deep">
          <Icon name="camera" size={32} />
        </span>
      </motion.button>
    </div>
  );
}
