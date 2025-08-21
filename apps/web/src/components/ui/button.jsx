import { createElement } from "@harvest/core";
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-gray-900 text-white hover:bg-gray-800",
        primary: "bg-primary text-white hover:bg-primary/90",
        secondary: "bg-secondary text-white hover:bg-secondary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline:
          "border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-100",
        ghost: "bg-transparent hover:bg-gray-100 text-gray-900",
      },
      size: {
        small: "h-8 px-3 text-sm",
        medium: "h-10 px-4",
        large: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "medium",
    },
  }
);

const Button = ({
  variant,
  size,
  className,
  disabled,
  children,
  icon,
  iconPosition = "left", // left | right
  ...props
}) => {
  const classes = buttonVariants({ variant, size, className });

  return createElement(
    "button",
    {
      className: classes,
      disabled,
      ...props,
    },
    <>
      {icon && iconPosition === "left" && (
        <span className="flex items-center">{icon}</span>
      )}
      <span>{children}</span>
      {icon && iconPosition === "right" && (
        <span className="flex items-center">{icon}</span>
      )}
    </>
  );
};

export default Button;
