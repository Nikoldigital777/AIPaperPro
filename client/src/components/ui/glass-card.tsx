import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div 
      className={cn(
        "glass-card rounded-xl",
        hover && "hover:glass-card",
        className
      )}
    >
      {children}
    </div>
  );
}
