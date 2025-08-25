import { createElement } from "@harvest/core";
import { cva } from "class-variance-authority";

const inputVariants = cva(
  "flex w-full items-center rounded-md border border-gray-300 bg-white " +
    "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 " +
    "disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        small: "h-8 text-xs",
        medium: "h-10 text-sm",
        large: "h-12 text-base",
      },
      error: {
        true: "border-red-500 focus-within:ring-red-500",
        false: "",
      },
    },
    defaultVariants: {
      size: "medium",
      error: false,
    },
  }
);

const Input = ({
  className,
  size,
  error,
  iconLeft,
  iconRight,
  buttonRight,
  ...props
}) => {
  const classes = inputVariants({ size, error });

  return createElement(
    "div",
    {
      className: [classes, className, "relative flex items-center px-2 gap-2"]
        .filter(Boolean)
        .join(" "),
    },
    // Icono izquierdo
    iconLeft &&
      createElement("span", {
        className: "text-gray-400 dark:text-gray-500 pointer-events-none",
        children: iconLeft,
      }),

    // input real
    createElement("input", {
      className:
        "flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 px-1",
      ...props,
    }),

    // Icono derecho (decorativo)
    iconRight &&
      createElement("span", {
        className: "text-gray-400 dark:text-gray-500 pointer-events-none",
        children: iconRight,
      }),

    // Botón derecho (ej: limpiar, buscar, etc.)
    buttonRight &&
      createElement(
        "button",
        {
          type: "button",
          className:
            "text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors",
          onClick: buttonRight.onClick,
        },
        buttonRight.icon
      )
  );
};

export default Input;
