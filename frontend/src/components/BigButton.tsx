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
    "tap-target font-bold rounded-2xl transition-all duration-150 flex items-center justify-center gap-3 select-none active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-md text-center";

  const sizeStyles =
    size === "lg"
      ? "py-4 px-6 text-lg sm:text-xl min-h-[58px]"
      : "py-3.5 px-5 text-base sm:text-lg min-h-[52px]";

  const variantStyles = {
    primary:
      "bg-indigo-600 hover:bg-indigo-500 text-white border-2 border-indigo-400/50 shadow-indigo-950/60 active:translate-y-0.5",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-slate-100 border-2 border-slate-600/80 shadow-slate-950/60 active:translate-y-0.5",
    outline:
      "bg-slate-900/60 hover:bg-slate-800 text-slate-100 border-2 border-slate-500 active:translate-y-0.5",
    danger:
      "bg-rose-700 hover:bg-rose-600 text-white border-2 border-rose-500/50 shadow-rose-950/60 active:translate-y-0.5",
    success:
      "bg-emerald-700 hover:bg-emerald-600 text-white border-2 border-emerald-500/50 shadow-emerald-950/60 active:translate-y-0.5",
  }[variant];

  return (
    <button
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        icon && <span className="text-2xl shrink-0 flex items-center">{icon}</span>
      )}
      <span className="leading-snug">{children}</span>
    </button>
  );
};
