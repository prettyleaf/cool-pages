"use client";

import { cn } from "@/lib/utils";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";

function CountAnimation({
  number,
  className,
  duration = 2,
  onComplete,
}: {
  number: number;
  className: string;
  duration?: number;
  onComplete?: () => void;
}) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, Math.round);

  useEffect(() => {
    const animation = animate(count, number, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onComplete,
    });

    return animation.stop;
  }, []);

  return <motion.h1 className={cn(className)}>{rounded}</motion.h1>;
}

export { CountAnimation };
