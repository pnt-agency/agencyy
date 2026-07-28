import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 cursor-pointer";

    // Primary carries the brand accent — black on gold is 9.42:1. Secondary
    // stays black so a page with two actions still has a clear hierarchy;
    // making both gold would leave neither looking primary.
    const variants = {
      primary:   "bg-gold text-black hover:bg-gold/90 hover:scale-105 shadow-lg shadow-gold/25",
      secondary: "bg-black text-white hover:bg-black/85 hover:scale-105 shadow-lg shadow-black/15",
      outline:   "border-2 border-gold text-black bg-transparent hover:bg-gold hover:text-black",
      ghost:     "text-black hover:bg-gold/10 border border-transparent hover:border-gold/30",
    };

    const sizes = {
      sm: "h-9  px-4  text-sm",
      md: "h-11 px-6  text-base",
      lg: "h-14 px-8  text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
