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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-xl mx-auto px-4 h-18 flex items-center justify-between">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-3.5 focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-xl p-1"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-md">
            <FileCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-none">
              {t("appName")}
            </h1>
            <span className="text-xs text-sky-400 font-medium">ProofSathi</span>
          </div>
        </Link>

        {/* Language Switcher Bar */}
        <div
          className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800"
          role="group"
          aria-label="Language selection"
        >
          {(
            [
              { code: "en", label: "EN" },
              { code: "hi", label: "हि" },
              { code: "bn", label: "বাং" },
            ] as const
          ).map((item) => (
            <button
              key={item.code}
              onClick={() => setLanguage(item.code as AppLanguage)}
              className={`tap-target px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                language === item.code
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              aria-pressed={language === item.code}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 py-1.5 md:hidden"
        aria-label="Primary navigation"
      >
        <div className="max-w-xl mx-auto grid grid-cols-3 gap-1 px-3">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`tap-target flex-col gap-1 py-1 px-2 rounded-xl transition-colors ${
                  isActive
                    ? "text-sky-400 font-bold bg-slate-800/80"
                    : "text-slate-400 hover:text-slate-200 font-medium"
                }`}
              >
                {item.icon}
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
