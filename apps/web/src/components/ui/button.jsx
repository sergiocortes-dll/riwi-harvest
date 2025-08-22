import { createElement } from "@harvest/core";
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center gap-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-white text-black hover:bg-gray-100 data-[active=true]:bg-gray-200 data-[active=true]:text-black",
        primary:
          "bg-primary text-white hover:bg-primary/90 data-[active=true]:bg-primary/80",
        secondary:
          "bg-secondary text-white hover:bg-secondary/90 data-[active=true]:bg-secondary/80",
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
      fullWidth: {
        true: "w-full",
        false: "",
      },
      align: {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "medium",
      fullWidth: false,
      align: "center",
    },
  }
);

const Button = ({
  component: Component = "button",
  children,
  className,
  icon,
  active,
  align,
  variant,
  size,
  fullWidth,
  ...props
}) => {
  // Pass the extracted props to buttonVariants
  const classes = buttonVariants({
    variant,
    size,
    fullWidth,
    align,
  });

  // Add data-active attribute if active is true
  const elementProps = {
    className: [className, classes].filter(Boolean).join(" "),
    ...(active && { "data-active": "true" }),
    ...props,
  };

  // Create content with icon
  const content = (
    <>
      {icon && icon}
      {children}
    </>
  );

  if (Component) {
    return createElement(Component, elementProps, content);
  }

  return createElement("button", elementProps, content);
};

export default Button;
