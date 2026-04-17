import { ButtonHTMLAttributes, FC, ReactNode } from "react";

export const baseVariants = {
  shape: {
    rounded: "rounded-lg px-4",
    square: "rounded-none px-4",
    pill: "rounded-full px-4",
    icon: "justify-center",
  },
  size: {
    xs: "h-8 text-xs",
    sm: "h-9 text-sm",
    base: "h-12 text-base",
    md: "h-14 text-base",
    lg: "h-16 text-lg",
  },
};

export const equalSizes = {
  xs: "h-8 w-8",
  sm: "h-9 w-9",
  base: "h-12 w-12",
  md: "h-14 w-14",
  lg: "h-16 w-16",
};

export const loaderSizes = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  base: "h-5 w-5",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

export type BaseButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  shape?: "rounded" | "square" | "pill" | "icon";
  size?: "xs" | "sm" | "base" | "md" | "lg";
};

const BaseButton: FC<BaseButtonProps> = ({
  children,
  leftIcon,
  rightIcon,
  isLoading,
  disabled,
  className = "",
  shape = "pill",
  size = "base",
  ...props
}) => {
  const isDisabled = isLoading || disabled;
  const shapeClassName = baseVariants.shape[shape];
  const sizeClassName =
    shape === "icon" ? equalSizes[size] : baseVariants.size[size];
  const loaderSizeClassName = loaderSizes[size];

  return (
    <button
      aria-busy={isLoading}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      type="button"
      {...props}
    >
      <div
        className={`flex items-center justify-center gap-2 ${shapeClassName} ${sizeClassName} ${className}`}
      >
        {isLoading ? (
          <span
            aria-label="Loading"
            className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${loaderSizeClassName}`}
          />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </div>
    </button>
  );
};

export default BaseButton;
