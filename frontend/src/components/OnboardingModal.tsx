import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { AppLanguage } from "../i18n/messages";
import { Languages, CheckCircle2 } from "lucide-react";

export const OnboardingModal: React.FC = () => {
  const { hasOnboarded, completeOnboarding } = useLanguage();

  if (hasOnboarded) return null;

  const options: { code: AppLanguage; label: string; sublabel: string }[] = [
    { code: "en", label: "English", sublabel: "I prefer English" },
    { code: "hi", label: "हिंदी", sublabel: "मैं हिंदी में पढ़ना पसंद करता/करती हूँ" },
    { code: "bn", label: "বাংলা", sublabel: "আমি বাংলায় পড়তে স্বচ্ছন্দ" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div
        className="w-full max-w-md bg-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/30 text-indigo-400 mx-auto mb-5 border border-indigo-500/40">
          <Languages className="w-9 h-9" />
        </div>

        <h2 id="onboarding-title" className="text-2xl sm:text-3xl font-extrabold text-center text-white mb-2 leading-snug">
          Which language are you most comfortable with?
        </h2>
        <p className="text-center text-slate-400 mb-6 text-base">
          आप किस भाषा में सहज हैं? / আপনি কোন ভাষায় স্বচ্ছন্দ?
        </p>

        <div className="space-y-3.5 mb-6">
          {options.map((opt) => (
            <button
              key={opt.code}
              onClick={() => completeOnboarding(opt.code)}
              className="w-full tap-target p-4 rounded-2xl border-2 border-slate-700 bg-slate-800/80 hover:bg-indigo-950/60 hover:border-indigo-500 text-left transition-all flex items-center justify-between group active:scale-[0.98]"
            >
              <div>
                <span className="block text-2xl font-bold text-white group-hover:text-indigo-300">
                  {opt.label}
                </span>
                <span className="block text-sm text-slate-400 group-hover:text-slate-300">
                  {opt.sublabel}
                </span>
              </div>
              <CheckCircle2 className="w-7 h-7 text-slate-600 group-hover:text-indigo-400 transition-colors" />
            </button>
          ))}
        </div>

        <p className="text-xs text-center text-slate-500">
          You can change this anytime from Settings. No profile or registration needed.
        </p>
      </div>
    </div>
  );
};
