"use client";

import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo, type Variants } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

interface PanelProps {
  isOpen: boolean;
  /** Called by a swipe, a tap on the backdrop or Escape. Buttons inside close it too. */
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}

/** 1 leaves downward, -1 upward. */
type Direction = 1 | -1;

// A swipe closes the card when it is dragged past this share of its height,
// or flicked faster than this, in either direction. Anything less springs back.
const CLOSE_DISTANCE = 0.25;
const CLOSE_VELOCITY = 600;

// Far enough to clear any screen, so the card always leaves (and arrives) fully.
// Read when the animation starts, never at import: there is no window on the server.
function offscreen(direction: Direction): number {
  return direction * window.innerHeight;
}

const VARIANTS: Variants = {
  hidden: () => ({ y: offscreen(1) }),
  shown: { y: 0, transition: { type: "spring", damping: 32, stiffness: 300 } },
  // The spring picks up the swipe's velocity, so a flick keeps its speed.
  gone: (direction: Direction) => ({ y: offscreen(direction), transition: { type: "spring", bounce: 0, duration: 0.35 } }),
};

/**
 * Cream card that pops up over the screen for results and errors, with the
 * screen behind it dimmed. Swipe it up or down to close it.
 *
 * It never scrolls: children get exactly the card and must fit it. It is a
 * size container, so children can size themselves with cqh units. Nothing
 * inside scrolls, so the whole card can be the drag handle.
 */
export function Panel({ isOpen, onClose, labelledBy, children }: PanelProps): React.JSX.Element {
  const [direction, setDirection] = useState<Direction>(1);
  const cardRef = useRef<HTMLElement>(null);
  const y = useMotionValue(0);
  // The dimmed backdrop lightens as the card is dragged away.
  const dim = useTransform(y, (value) => 1 - Math.min(1, Math.abs(value) / 400));

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      setDirection(1);
      onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  function close(towards: Direction): void {
    setDirection(towards);
    onClose();
  }

  function onDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, { offset, velocity }: PanInfo): void {
    const height = cardRef.current?.clientHeight ?? window.innerHeight;
    if (Math.abs(offset.y) > height * CLOSE_DISTANCE || Math.abs(velocity.y) > CLOSE_VELOCITY) {
      // A fast flick wins over distance, so a short flick back the other way still counts.
      const towards = Math.abs(velocity.y) > CLOSE_VELOCITY ? velocity.y : offset.y;
      close(towards < 0 ? -1 : 1);
    }
  }

  return (
    // AnimatePresence's `custom` reaches the card after it is removed, so it
    // still knows which way it was swiped and leaves that way.
    <AnimatePresence custom={direction} onExitComplete={() => setDirection(1)}>
      {isOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30"
        >
          <motion.div
            aria-hidden="true"
            onClick={() => close(1)}
            style={{ opacity: dim }}
            className="absolute inset-0 bg-moss-night/70 backdrop-blur-[2px]"
          />
        </motion.div>
      )}
      {isOpen && (
        <motion.section
          key="card"
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          custom={direction}
          variants={VARIANTS}
          initial="hidden"
          animate="shown"
          exit="gone"
          drag="y"
          dragSnapToOrigin
          dragElastic={1}
          onDragEnd={onDragEnd}
          style={{ y }}
          // Inset from every edge (clear of the notch and home bar) so it reads as a card over the screen.
          className="absolute inset-x-[clamp(8px,3cqw,16px)] top-[calc(var(--safe-top)+clamp(10px,3cqh,28px))] bottom-[calc(var(--safe-bottom)+clamp(10px,2.5cqh,24px))] z-30 mx-auto max-w-md overflow-clip rounded-[28px] bg-cream bg-[radial-gradient(circle_at_90%_15%,color-mix(in_srgb,var(--glimmer)_15%,transparent),transparent_18%)] px-4 pb-[clamp(10px,2cqh,16px)] text-ink shadow-[0_24px_60px_-12px_color-mix(in_srgb,var(--moss-night)_80%,transparent)] [container-type:size]"
        >
          {/* Grab handle: shows the card can be swiped away. */}
          <div aria-hidden="true" className="flex h-[clamp(16px,3cqh,22px)] cursor-grab items-center justify-center active:cursor-grabbing">
            <span className="h-1 w-10 rounded-full bg-ink/20" />
          </div>
          <div className="h-[calc(100%-clamp(16px,3cqh,22px))]">{children}</div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
