import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { AppLanguage } from "../i18n/messages";
import { Languages, CheckCircle2 } from "lucide-react";

export const OnboardingModal: React.FC = () => {
  const { hasOnboarded, completeOnboarding } = useLanguage();

  if (hasOnboarded) return null;

  const options: { code: AppLanguage; label: string; sublabel: string }[] = [
    { code: "en", label: "English", sublabel: "I prefer English" },
    { code: "hi", label: "हिंदी", sublabel: "मैं हिंदी में पढ़ना और सुनना पसंद करता हूँ" },
    { code: "bn", label: "বাংলা", sublabel: "আমি বাংলায় পড়তে ও শুনতে স্বচ্ছন্দ" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div
        className="w-full max-w-md bg-slate-900 border-2 border-indigo-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80 text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="onboarding-title"
        aria-modal="true"
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/30 text-indigo-400 mx-auto mb-5 border-2 border-indigo-500/50">
          <Languages className="w-9 h-9" />
        </div>

        <h2
          id="onboarding-title"
          className="text-2xl sm:text-3xl font-extrabold text-center text-white mb-2 leading-snug"
        >
          Choose Your Language
        </h2>
        <p className="text-center text-slate-300 mb-6 text-base font-medium leading-relaxed">
          अपनी भाषा चुनें / আপনার ভাষা পছন্দ করুন
        </p>

        <div className="space-y-4 mb-6">
          {options.map((opt) => (
            <button
              key={opt.code}
              type="button"
              onClick={() => completeOnboarding(opt.code)}
              className="w-full tap-target p-5 rounded-2xl border-2 border-slate-700 bg-slate-800 hover:bg-slate-750 hover:border-sky-400 text-left transition-all flex items-center justify-between group active:scale-[0.98] cursor-pointer shadow-md"
            >
              <div>
                <span className="block text-2xl sm:text-3xl font-black text-white group-hover:text-sky-300">
                  {opt.label}
                </span>
                <span className="block text-sm text-slate-300 group-hover:text-white mt-1 font-medium leading-snug">
                  {opt.sublabel}
                </span>
              </div>
              <CheckCircle2 className="w-8 h-8 text-slate-500 group-hover:text-sky-400 shrink-0 transition-colors ml-3" />
            </button>
          ))}
        </div>

        <p className="text-sm text-center text-slate-400 font-medium">
          You can change this anytime from Settings. No registration needed.
        </p>
      </div>
    </div>
  );
};
