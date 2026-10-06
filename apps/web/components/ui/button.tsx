// apps/web/components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// shadcn/ui pattern: owned source, accessible native controls, and typed variants.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
  { variants: {
    variant: { default: "bg-primary text-primary-foreground hover:bg-primary/90", outline: "border border-border bg-background hover:bg-muted", ghost: "hover:bg-muted" },
    size: { default: "h-10 px-4", sm: "h-9 px-3", lg: "h-12 px-6" },
  }, defaultVariants: { variant: "default", size: "default" } },
);

type Props = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };
export function Button({ className, variant, size, asChild = false, ...props }: Props) {
  const Component = asChild ? Slot : "button";
  return <Component data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
