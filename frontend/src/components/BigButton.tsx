import React from "react";

interface BigButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "success";
  size?: "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
}

export const BigButton: React.FC<BigButtonProps> = ({
  children,
  variant = "primary",
  size = "lg",
  icon,
  loading = false,
  disabled,
  className = "",
  ...props
}) => {
  const baseStyles =
    "tap-target font-semibold rounded-2xl transition-all duration-150 flex items-center justify-center gap-3 select-none active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-sm";

  const sizeStyles = size === "lg" ? "py-4 px-6 text-xl min-h-[56px]" : "py-3 px-5 text-lg min-h-[48px]";

  const variantStyles = {
    primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700",
    outline: "bg-transparent hover:bg-slate-800/60 text-slate-200 border-2 border-slate-600",
    danger: "bg-rose-700 hover:bg-rose-600 text-white shadow-rose-900/30",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30",
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="text-2xl shrink-0">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
};
