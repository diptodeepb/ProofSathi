import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { AppLanguage } from "../i18n/messages";
import { BigButton } from "../components/BigButton";
import {
  Settings,
  Languages,
  Trash2,
  ShieldCheck,
  Check,
  AlertTriangle,
} from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [clearedMsg, setClearedMsg] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const languagesList: { code: AppLanguage; label: string; sub: string }[] = [
    { code: "en", label: "English", sub: "English interface" },
    { code: "hi", label: "हिंदी", sub: "हिंदी इंटरफ़ेस" },
    { code: "bn", label: "বাংলা", sub: "বাংলা ইন্টারফেস" },
  ];

  const handleClearHistory = () => {
    localStorage.removeItem("proofsathi_session_id");
    // Generate fresh session
    const sid = "sess_" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("proofsathi_session_id", sid);
    setShowClearConfirm(false);
    setClearedMsg(t("allHistoryCleared"));
    setTimeout(() => setClearedMsg(null), 3000);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-7">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-sky-400" />
          <span>{t("settingsTitle")}</span>
        </h2>
        <p className="text-base text-slate-300 font-medium">
          Preferences and safety boundaries
        </p>
      </div>

      {/* Language Section (Elderly friendly large tiles) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border-2 border-slate-800 space-y-4 shadow-xl">
        <div className="flex items-center gap-3 text-white">
          <Languages className="w-6 h-6 text-indigo-400" />
          <h3 className="text-xl font-extrabold">{t("appLanguageTitle")}</h3>
        </div>

        <div className="space-y-3">
          {languagesList.map((langItem) => {
            const isSelected = language === langItem.code;
            return (
              <button
                key={langItem.code}
                type="button"
                onClick={() => setLanguage(langItem.code)}
                className={`tap-target w-full p-4.5 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer shadow-md ${
                  isSelected
                    ? "bg-indigo-950 border-indigo-400 text-white shadow-indigo-950/60"
                    : "bg-slate-950 border-slate-700 text-slate-200 hover:border-slate-500"
                }`}
              >
                <div>
                  <span className="block text-xl font-black">{langItem.label}</span>
                  <span className="block text-sm text-slate-300 font-medium mt-0.5">{langItem.sub}</span>
                </div>
                {isSelected && <Check className="w-7 h-7 text-indigo-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Clear Data Section */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border-2 border-slate-800 space-y-3.5 shadow-xl">
        <div className="flex items-center gap-3 text-white">
          <Trash2 className="w-6 h-6 text-rose-400" />
          <h3 className="text-xl font-extrabold">{t("clearHistoryTitle")}</h3>
        </div>
        <p className="text-base text-slate-300 font-medium leading-relaxed">
          {t("clearHistoryDesc")}
        </p>

        <BigButton
          variant="outline"
          size="md"
          onClick={() => setShowClearConfirm(true)}
          className="border-slate-600 text-slate-200 hover:border-rose-500 hover:text-white"
        >
          {t("clearAll")}
        </BigButton>

        {clearedMsg && (
          <p className="text-sm text-emerald-400 font-bold pt-1">
            ✓ {clearedMsg}
          </p>
        )}
      </div>

      {/* AI Safety and Boundaries */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border-2 border-slate-800 space-y-3.5 shadow-xl">
        <div className="flex items-center gap-3 text-white">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <h3 className="text-xl font-extrabold">{t("aiBoundariesTitle")}</h3>
        </div>
        <p className="text-base text-slate-300 font-medium leading-relaxed">
          {t("aiBoundariesDesc")}
        </p>
        <div className="pt-2 text-xs sm:text-sm text-slate-400 space-y-1 font-mono">
          <p>Product: ProofSathi v0.1.0</p>
          <p>AI Engine: Gemma 4 26B A4B (Gemini API)</p>
          <p>Voice: ElevenLabs Multilingual TTS</p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl animate-in fade-in duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-950 text-rose-400 flex items-center justify-center mx-auto border-2 border-rose-700">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-center text-white">
              {t("confirmDelete")}
            </h3>
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <BigButton variant="outline" size="md" onClick={() => setShowClearConfirm(false)}>
                {t("cancel")}
              </BigButton>
              <BigButton variant="danger" size="md" onClick={handleClearHistory}>
                {t("clearAll")}
              </BigButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
