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
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold bg-amber-950/80 text-amber-200 border-2 border-amber-600/70 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{t("statusCheck")}</span>
        </span>
      );
    }
    if (status === "high") {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold bg-emerald-950/80 text-emerald-200 border-2 border-emerald-600/70 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{t("statusClear")}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold bg-slate-800 text-slate-200 border-2 border-slate-600 shadow-sm">
        <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />
        <span>{t("statusCheck")}</span>
      </span>
    );
  };

  return (
    <div className="mt-2.5 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {getStatusBadge()}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="tap-target text-sm text-sky-300 hover:text-white underline font-bold flex items-center gap-1.5 cursor-pointer py-1.5"
          aria-expanded={isOpen}
        >
          <span>{t("evidence")}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-2.5 p-3.5 bg-slate-900 border-2 border-slate-700 rounded-2xl text-sm text-slate-200 leading-relaxed space-y-1.5">
          <span className="text-slate-400 block uppercase tracking-wider text-xs font-bold">
            Original document text:
          </span>
          <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-white font-mono text-sm leading-relaxed select-text">
            {sourceText}
          </p>
        </div>
      )}
    </div>
  );
};
