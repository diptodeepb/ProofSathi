import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { AppLanguage } from "../i18n/messages";
import { Home, History, Settings, FileCheck } from "lucide-react";

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  const navLinks = [
    { to: "/", label: t("home"), icon: <Home className="w-6 h-6" /> },
    {
      to: "/history",
      label: t("history"),
      icon: <History className="w-6 h-6" />,
    },
    {
      to: "/settings",
      label: t("settings"),
      icon: <Settings className="w-6 h-6" />,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/98 backdrop-blur-md border-b-2 border-slate-800">
      <div className="max-w-xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-3 focus-visible:ring-3 focus-visible:ring-sky-400 rounded-2xl p-1.5 active:opacity-80 transition-opacity"
          aria-label="ProofSathi Home"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 border-2 border-indigo-400/40 flex items-center justify-center shadow-md shrink-0">
            <FileCheck className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
              {t("appName")}
            </h1>
            <span className="text-xs text-sky-400 font-semibold tracking-wide">
              ProofSathi
            </span>
          </div>
        </Link>

        {/* Accessible Language Switcher */}
        <div
          className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border-2 border-slate-800"
          role="group"
          aria-label="Language selection"
        >
          {(
            [
              { code: "en", label: "EN" },
              { code: "hi", label: "हि" },
              { code: "bn", label: "বাং" },
            ] as const
          ).map((item) => {
            const isActive = language === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code as AppLanguage)}
                className={`tap-target px-3.5 py-1.5 text-base font-bold rounded-xl transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md border border-indigo-400/60"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
                aria-pressed={isActive}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (min 56px height, high-contrast labels for seniors) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 backdrop-blur-md border-t-2 border-slate-800 py-2 md:hidden"
        aria-label="Primary navigation"
      >
        <div className="max-w-xl mx-auto grid grid-cols-3 gap-2 px-3">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`tap-target flex-col gap-1 py-1.5 px-2 rounded-2xl transition-colors ${
                  isActive
                    ? "text-sky-300 font-extrabold bg-slate-800 border-2 border-sky-500/50"
                    : "text-slate-300 hover:text-white font-semibold"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="text-xs sm:text-sm font-bold tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
