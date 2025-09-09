import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#697565] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[#697565] text-[#ECDFCC] shadow hover:bg-[#697565]/90",
        destructive: "bg-red-500 text-[#ECDFCC] shadow-sm hover:bg-red-500/90",
        outline: "border border-[#3C3D37]/50 bg-[#1E201E] shadow-sm hover:bg-[#3C3D37]/80 hover:text-[#ECDFCC] text-[#ECDFCC] hover:border-[#697565]/30 transition-all duration-200",
        secondary: "bg-[#3C3D37] text-[#ECDFCC] shadow-sm hover:bg-[#3C3D37]/80",
        ghost: "hover:bg-[#3C3D37] hover:text-[#ECDFCC] text-[#ECDFCC]",
        link: "text-[#ECDFCC] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
