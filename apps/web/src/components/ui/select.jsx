/** @jsx h */
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const selectVariants = cva(
  "flex items-center gap-2 px-3 py-2 border border-divider rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring",
  {
    variants: {
      size: {
        sm: "h-8 text-xs",
        md: "h-10 text-sm",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export default function Select({
  options = [],
  value,
  onChange,
  size,
  icon,
  className,
  ...props
}) {
  const handleChange = (e) => {
    console.log("Select handleChange ejecutado:", e.target.value);
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        onChange={handleChange}
        className={cn(
          selectVariants({ size }),
          "appearance-none pr-8",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Icono al lado derecho */}
      {icon && (
        <span className="absolute right-2 pointer-events-none">{icon}</span>
      )}
    </div>
  );
}
