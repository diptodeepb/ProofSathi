import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { BillComparisonResponse, DocumentAnalysisResponse } from "../lib/api";
import { AudioPlayer } from "../components/AudioPlayer";
import { BigButton } from "../components/BigButton";
import {
  ArrowLeft,
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Zap,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export const BillComparisonPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const comparison: BillComparisonResponse | undefined = location.state?.comparison;
  const currentDoc: DocumentAnalysisResponse | undefined = location.state?.currentDoc;
  const previousDoc: DocumentAnalysisResponse | undefined = location.state?.previousDoc;

  if (!comparison) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-400">No comparison data found.</p>
        <BigButton variant="primary" onClick={() => navigate("/")}>
          {t("home")}
        </BigButton>
      </div>
    );
  }

  const { amount, consumption, due_date, line_item_diffs, interpretation, warnings } = comparison;

  const renderAmountStatusBadge = () => {
    if (amount.status === "increased") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-rose-950/70 text-rose-300 border border-rose-800">
          <TrendingUp className="w-4 h-4" />
          {t("increased")} (+₹{Math.abs(amount.difference || 0).toFixed(2)})
        </span>
      );
    }
    if (amount.status === "decreased") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-800">
          <TrendingDown className="w-4 h-4" />
          {t("decreased")} (-₹{Math.abs(amount.difference || 0).toFixed(2)})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold bg-slate-800 text-slate-300 border border-slate-700">
        <Minus className="w-4 h-4" />
        {t("unchanged")}
      </span>
    );
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="tap-target px-3 py-1.5 text-slate-400 hover:text-white rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">{t("back")}</span>
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-3 py-1 rounded-full border border-sky-700/60 flex items-center gap-1.5">
          <GitCompare className="w-3.5 h-3.5" />
          {t("billComparisonTitle")}
        </span>
      </div>

      {/* Audio Explanation */}
      <AudioPlayer textToSpeak={interpretation} />

      {/* Grounded Interpretation Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border-2 border-indigo-500/50 shadow-xl space-y-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>What the comparison shows</span>
        </h3>
        <p className="text-base text-slate-200 leading-relaxed font-medium">
          {interpretation}
        </p>
      </div>

      {/* Amount Difference Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t("amountDifference")}
          </span>
          {renderAmountStatusBadge()}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Earlier Bill</span>
            <span className="text-2xl font-bold text-slate-200">
              ₹{amount.previous !== null ? amount.previous.toFixed(2) : "—"}
            </span>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-indigo-900/60">
            <span className="text-xs text-indigo-300 block mb-1">Current Bill</span>
            <span className="text-2xl font-bold text-white">
              ₹{amount.current !== null ? amount.current.toFixed(2) : "—"}
            </span>
          </div>
        </div>

        {amount.percentage_change !== null && (
          <p className="text-xs text-slate-400 text-center font-mono">
            Net Percentage Change: {amount.percentage_change > 0 ? "+" : ""}
            {amount.percentage_change.toFixed(2)}%
          </p>
        )}
      </div>

      {/* Consumption Comparison */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Zap className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            {t("consumptionDifference")}
          </h4>
        </div>

        {consumption.comparable ? (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Earlier Usage</span>
              <span className="text-xl font-bold text-slate-200">
                {consumption.previous} {consumption.unit}
              </span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Current Usage</span>
              <span className="text-xl font-bold text-white">
                {consumption.current} {consumption.unit}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Usage figures were not directly comparable across these two documents.
          </p>
        )}
      </div>

      {/* Due Date Change */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-sm">
        <span className="text-slate-400 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-400" />
          {t("dueDateComparison")}:
        </span>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">{due_date.previous || "—"}</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-bold text-white">{due_date.current || "—"}</span>
        </div>
      </div>

      {/* Line Item Diff List */}
      {line_item_diffs.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Line Items Comparison
          </h4>
          <div className="divide-y divide-slate-800 text-sm">
            {line_item_diffs.map((diff, i) => (
              <div key={i} className="py-2.5 flex items-center justify-between">
                <span className="text-slate-200">{diff.label}</span>
                <div className="flex items-center gap-2 text-xs font-mono">
                  {diff.status === "added" ? (
                    <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded">
                      Appears on current: ₹{diff.current_amount}
                    </span>
                  ) : diff.status === "removed" ? (
                    <span className="text-slate-400 line-through">
                      Was ₹{diff.previous_amount}
                    </span>
                  ) : diff.current_amount !== diff.previous_amount ? (
                    <span className="text-sky-300 font-semibold">
                      ₹{diff.previous_amount} → ₹{diff.current_amount}
                    </span>
                  ) : (
                    <span className="text-slate-400">Same: ₹{diff.current_amount}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings & Non-comparable notes */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-xs space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Honest Boundary Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400">
        <ShieldAlert className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{t("comparisonDisclaimer")}</p>
      </div>
    </div>
  );
};
