import * as React from "react"

import { cn } from "@/lib/utils";
import { motion, useAnimation } from "motion/react";
import { useEffect, useState, useCallback } from "react";

interface MagnetizeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    particleCount?: number;
    attractRadius?: number;
    children?: React.ReactNode;
}

interface Particle {
    id: number;
    x: number;
    y: number;
}

function MagnetizeButton({
    className,
    particleCount = 12,
    attractRadius = 50,
    children,
    onClick,
    ...props
}: MagnetizeButtonProps) {
    const [isAttracting, setIsAttracting] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const [particles, setParticles] = useState<Particle[]>([]);
    const particlesControl = useAnimation();

    useEffect(() => {
        const newParticles = Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 360 - 180,
            y: Math.random() * 360 - 180,
        }));
        setParticles(newParticles);
    }, [particleCount]);

    const handleInteractionStart = useCallback(async () => {
        setIsAttracting(true);
        await particlesControl.start({
            x: 0,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 50,
                damping: 10,
            },
        });
    }, [particlesControl]);

    const handleInteractionEnd = useCallback(async () => {
        if (isClicked) return;
        setIsAttracting(false);
        await particlesControl.start((i) => ({
            x: particles[i].x,
            y: particles[i].y,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15,
            },
        }));
    }, [particlesControl, particles, isClicked]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        setIsClicked(true);
        setIsAttracting(true);
        particlesControl.start({
            x: 0,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 80,
                damping: 8,
            },
        });
        onClick?.(e);
    }, [onClick, particlesControl]);

    return (
        <button
            className={cn(
                "min-w-40 relative touch-none inline-flex items-center justify-center",
                "rounded-[10px] px-9 py-3 text-sm font-normal tracking-wider",
                "transition-all duration-300 cursor-pointer",
                isClicked
                    ? "bg-[rgba(210,100,120,0.15)] border border-[rgba(210,100,120,0.3)] text-[rgba(210,100,120,0.9)]"
                    : "bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-[rgba(255,255,255,0.5)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[rgba(255,255,255,0.8)]",
                className
            )}
            onMouseEnter={handleInteractionStart}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleInteractionStart}
            onTouchEnd={handleInteractionEnd}
            onClick={handleClick}
            {...props}
        >
            {particles.map((_, index) => (
                <motion.div
                    key={index}
                    custom={index}
                    initial={{ x: particles[index]?.x ?? 0, y: particles[index]?.y ?? 0 }}
                    animate={particlesControl}
                    className={cn(
                        "absolute w-1.5 h-1.5 rounded-full",
                        "transition-all duration-300",
                        isClicked
                            ? "bg-[rgba(210,100,120,0.6)]"
                            : "bg-[rgba(255,255,255,0.25)]",
                        isAttracting ? "opacity-100" : "opacity-40"
                    )}
                />
            ))}
            <span className="relative w-full flex items-center justify-center font-['DM_Sans',sans-serif]">
                {children ?? "открыть"}
            </span>
        </button>
    );
}

export { MagnetizeButton }
