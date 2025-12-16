import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon" | "text";
  showText?: boolean;
}

const sizeMap = {
  sm: { icon: 20, text: "text-sm" },
  md: { icon: 24, text: "text-base" },
  lg: { icon: 32, text: "text-lg" },
  xl: { icon: 40, text: "text-xl" },
};

export function Logo({
  className,
  size = "md",
  variant = "full",
  showText = true,
}: LogoProps) {
  const iconSize = sizeMap[size].icon;
  const textSize = sizeMap[size].text;

  const LogoIcon = () => (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
    >
      {/* Cattle/Bull Head Silhouette */}
      <path
        d="M12 2C8.5 2 6 4.5 6 8c0 2 1 3.5 2 4.5v2c0 1.5 1 2.5 2.5 2.5h3c1.5 0 2.5-1 2.5-2.5v-2c1-1 2-2.5 2-4.5 0-3.5-2.5-6-6-6z"
        fill="currentColor"
        className="opacity-90"
      />
      {/* Horns */}
      <path
        d="M8 6c-1 0-1.5 1-1.5 2v1c0 0.5 0.5 1 1 1h1v-2c0-1-0.5-2-0.5-2zM16 6c1 0 1.5 1 1.5 2v1c0 0.5-0.5 1-1 1h-1v-2c0-1 0.5-2 0.5-2z"
        fill="currentColor"
        className="opacity-80"
      />
      {/* Feed/Grain Symbol */}
      <circle cx="12" cy="18" r="3" fill="currentColor" className="opacity-70" />
      <circle cx="10" cy="17" r="1" fill="white" className="opacity-60" />
      <circle cx="14" cy="17" r="1" fill="white" className="opacity-60" />
    </svg>
  );

  if (variant === "icon") {
    return <LogoIcon />;
  }

  if (variant === "text") {
    return (
      <span className={cn("font-semibold text-primary", textSize, className)}>
        RationSmart
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LogoIcon />
      {showText && (
        <span className={cn("font-semibold text-primary", textSize)}>
          RationSmart
        </span>
      )}
    </div>
  );
}

