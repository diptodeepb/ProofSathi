import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { CheckCircle2, AlertTriangle, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";

interface EvidenceSnippetProps {
  sourceText?: string;
  status?: "high" | "medium" | "low";
  needsConfirmation?: boolean;
}

export const EvidenceSnippet: React.FC<EvidenceSnippetProps> = ({
  sourceText,
  status = "medium",
  needsConfirmation = false,
}) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  if (!sourceText) return null;

  const getStatusBadge = () => {
    if (needsConfirmation || status === "low") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-700/50">
          <AlertTriangle className="w-3.5 h-3.5" />
          {t("statusCheck")}
        </span>
      );
    }
    if (status === "high") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {t("statusClear")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
        <HelpCircle className="w-3.5 h-3.5" />
        {t("statusCheck")}
      </span>
    );
  };

  return (
    <div className="mt-2 text-left">
      <div className="flex items-center justify-between gap-2">
        {getStatusBadge()}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="tap-target text-xs text-sky-400 hover:text-sky-300 underline font-medium flex items-center gap-1 cursor-pointer py-1"
          aria-expanded={isOpen}
        >
          <span>{t("evidence")}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-2 p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-300 leading-relaxed font-mono">
          <span className="text-slate-500 block mb-1 uppercase tracking-wider text-[10px]">
            &quot;{t("evidence")}&quot;:
          </span>
          <p className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 text-slate-200">
            {sourceText}
          </p>
        </div>
      )}
    </div>
  );
};
