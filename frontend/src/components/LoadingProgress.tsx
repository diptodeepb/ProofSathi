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
      className="p-8 sm:p-12 text-center bg-slate-900 border-2 border-indigo-500/60 rounded-3xl space-y-6 shadow-2xl"
      aria-live="polite"
      role="status"
    >
      <div className="w-18 h-18 rounded-2xl bg-indigo-600/30 text-indigo-400 mx-auto flex items-center justify-center border-2 border-indigo-500/50 shadow-inner">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>

      <div className="space-y-2.5">
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
          {getStageMessage()}
        </h3>
        <p className="text-base text-slate-300 font-medium max-w-sm mx-auto leading-relaxed">
          Please keep this window open while we process your document safely.
        </p>
      </div>

      {/* Visual step indicators */}
      <div className="flex justify-center items-center gap-3 pt-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-3.5 rounded-full transition-all duration-300 ${
              stage >= step ? "w-10 bg-indigo-500 border border-indigo-300 shadow-sm" : "w-3.5 bg-slate-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
