import { createElement } from "@harvest/core";
import { cva } from "class-variance-authority";

const dividerVariants = cva("shrink-0 bg-gray-300", {
  variants: {
    orientation: {
      horizontal: "w-full h-px my-4",
      vertical: "h-full w-px mx-4",
    },
    margin: {
      none: "!m-0",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

const Divider = ({
  orientation = "horizontal",
  margin,
  className,
  ...props
}) => {
  const classes = dividerVariants({ orientation, margin });

  return createElement("div", {
    role: "separator",
    "aria-orientation": orientation,
    className: [className, classes].filter(Boolean).join(" "),
    ...props,
  });
};

export default Divider;
