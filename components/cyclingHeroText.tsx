"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_PHRASES = [
  "Your AI's edit looked fine, until it wasn't.",
  "Merge policies that catch what code review misses.",
  "Blast radius, before you hit merge.",
];

interface CyclingHeroTextProps {
  phrases?: string[];
  typingSpeedMs?: number;
  deletingSpeedMs?: number;
  holdMs?: number;
  className?: string;
}

export default function CyclingHeroText({
  phrases = DEFAULT_PHRASES,
  typingSpeedMs = 35,
  deletingSpeedMs = 20,
  holdMs = 1800,
  className = "",
}: CyclingHeroTextProps) {
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion.current) {
      const random = Math.floor(Math.random() * phrases.length);
      setDisplayText(phrases[random]);
      return;
    }

    const current = phrases[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayText.length < current.length) {
      timeout = setTimeout(() => {
        setDisplayText(current.slice(0, displayText.length + 1));
      }, typingSpeedMs);
    } else if (!isDeleting && displayText.length === current.length) {

      timeout = setTimeout(() => setIsDeleting(true), holdMs);
    } else if (isDeleting && displayText.length > 0) {
   
      timeout = setTimeout(() => {
        setDisplayText(current.slice(0, displayText.length - 1));
      }, deletingSpeedMs);
    } else if (isDeleting && displayText.length === 0) {
    
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }

    return () => clearTimeout(timeout);
  }, [
    displayText,
    isDeleting,
    phraseIndex,
    phrases,
    typingSpeedMs,
    deletingSpeedMs,
    holdMs,
  ]);

  return (
    <p
      className={className}
      aria-live="polite"
    >
      {displayText}
    </p>
  );
}