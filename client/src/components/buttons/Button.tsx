import { FC } from "react";
import BaseButton, { BaseButtonProps } from "./BaseButton";
import variants from "./variants";

export type ButtonProps = BaseButtonProps & {
  intent?: "solid" | "outline" | "ghost";
  variant?: "primary" | "danger" | "warning" | "secondary";
};

const Button: FC<ButtonProps> = ({
  intent = "solid",
  variant = "primary",
  className = "",
  disabled,
  ...props
}) => {
  const state = disabled ? "disabled" : "enabled";
  const buttonClassName = variants[variant][intent][state].button;

  return (
    <BaseButton
      className={`w-full transition-all hover:opacity-95 active:scale-95 ${buttonClassName} ${className} ${disabled ? "!opacity-70" : "!opacity-100"}`}
      disabled={disabled}
      {...props}
    />
  );
};

export default Button;
