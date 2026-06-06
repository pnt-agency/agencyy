import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:pointer-events-none disabled:opacity-40 cursor-pointer";

    const variants = {
      primary:   "bg-black text-white hover:bg-black/85 hover:scale-105 shadow-lg shadow-black/15",
      secondary: "bg-black text-white hover:bg-black/85 hover:scale-105 shadow-lg shadow-black/15",
      outline:   "border-2 border-black text-black bg-transparent hover:bg-black hover:text-white",
      ghost:     "text-black hover:bg-black/6 border border-transparent hover:border-black/10",
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
