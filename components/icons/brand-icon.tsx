import React from "react";
import { cn } from "@/lib/utils";

interface BrandIconProps {
  className?: string;
  size?: number | string;
  color?: "primary" | "secondary" | "accent" | "current";
}

/**
 * RationSmart Brand Icon - A vector icon representing cattle feed formulation
 * Can be used as favicon, app icon, or brand mark throughout the application
 */
export function BrandIcon({
  className,
  size = 24,
  color = "primary",
}: BrandIconProps) {
  const colorClass =
    color === "primary"
      ? "text-primary"
      : color === "secondary"
      ? "text-secondary"
      : color === "accent"
      ? "text-accent"
      : "text-current";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(colorClass, className)}
      aria-label="RationSmart Logo"
    >
      {/* Cattle Head - Main Brand Element */}
      <path
        d="M12 2C8.5 2 6 4.5 6 8c0 2 1 3.5 2 4.5v2c0 1.5 1 2.5 2.5 2.5h3c1.5 0 2.5-1 2.5-2.5v-2c1-1 2-2.5 2-4.5 0-3.5-2.5-6-6-6z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      {/* Left Horn */}
      <path
        d="M8 6c-1 0-1.5 1-1.5 2v1c0 0.5 0.5 1 1 1h1v-2c0-1-0.5-2-0.5-2z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      {/* Right Horn */}
      <path
        d="M16 6c1 0 1.5 1 1.5 2v1c0 0.5-0.5 1-1 1h-1v-2c0-1 0.5-2 0.5-2z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      {/* Feed/Grain Symbol Below */}
      <circle
        cx="12"
        cy="18"
        r="3"
        fill="currentColor"
        fillOpacity="0.7"
      />
      <circle cx="10" cy="17" r="1" fill="white" fillOpacity="0.6" />
      <circle cx="14" cy="17" r="1" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

