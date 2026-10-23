import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { Loader2 } from "lucide-react";

export const LoadingProgress: React.FC = () => {
  const { t } = useLanguage();
  const [stage, setStage] = useState<number>(1);

  useEffect(() => {
    const timer1 = setTimeout(() => setStage(2), 1200);
    const timer2 = setTimeout(() => setStage(3), 2600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const getStageMessage = () => {
    switch (stage) {
      case 1:
        return t("loadingChecking");
      case 2:
        return t("loadingReading");
      case 3:
      default:
        return t("loadingExplaining");
    }
  };

  return (
    <div
      className="p-8 sm:p-12 text-center bg-slate-900 border-2 border-indigo-500/40 rounded-3xl space-y-5 animate-pulse-subtle shadow-xl"
      aria-live="polite"
      role="status"
    >
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 text-indigo-400 mx-auto flex items-center justify-center border border-indigo-500/40">
        <Loader2 className="w-9 h-9 animate-spin" />
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-white tracking-tight">
          {getStageMessage()}
        </h3>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          Please keep this window open while we process your document safely.
        </p>
      </div>

      {/* Visual step indicators */}
      <div className="flex justify-center items-center gap-3 pt-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              stage >= step ? "w-8 bg-indigo-500" : "w-2.5 bg-slate-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
