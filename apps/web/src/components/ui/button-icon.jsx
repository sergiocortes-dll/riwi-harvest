import { createElement, useState } from "@harvest/core";
import { cva } from "class-variance-authority";

const buttonIconVariants = cva(
  "relative inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-black/5",
        primary: "bg-primary text-white hover:bg-primary/90",
        secondary: "bg-secondary text-white hover:bg-secondary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        outline:
          "border border-gray-300 bg-transparent text-gray-900 hover:bg-gray-100",
        ghost: "bg-transparent hover:bg-gray-100 text-gray-900",
      },
      size: {
        small: "h-8 w-8 text-sm",
        medium: "h-10 w-10",
        large: "h-12 w-12 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "medium",
    },
  }
);

const ButtonIcon = ({
  variant,
  size,
  className,
  disabled,
  children,
  label,
  ...props
}) => {
  const [hovered, setHovered] = useState(false);
  const classes = buttonIconVariants({ variant, size, className });

  return createElement("div", { className: "relative inline-block" }, [
    createElement(
      "button",
      {
        key: "button",
        className: classes,
        disabled,
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        "aria-label": label,
        ...props,
      },
      children
    ),
    label &&
      hovered &&
      createElement(
        "div",
        {
          key: "tooltip",
          className:
            "absolute z-10 px-2 py-1 text-xs text-white bg-gray-900 rounded-md -top-8 left-1/2 -translate-x-1/2 shadow-md whitespace-nowrap",
        },
        label
      ),
  ]);
};

export default ButtonIcon;
