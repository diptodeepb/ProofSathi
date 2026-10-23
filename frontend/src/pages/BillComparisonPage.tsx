import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { BillComparisonResponse, DocumentAnalysisResponse } from "../lib/api";
import { AudioPlayer } from "../components/AudioPlayer";
import { BigButton } from "../components/BigButton";
import { PaymentGatewayModal } from "../components/PaymentGatewayModal";
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
  CreditCard,
} from "lucide-react";

export const BillComparisonPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const comparison: BillComparisonResponse | undefined = location.state?.comparison;
  const currentDoc: DocumentAnalysisResponse | undefined = location.state?.currentDoc;
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  if (!comparison) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-slate-300 text-lg font-bold">No comparison data found.</p>
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
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-base font-black bg-rose-950 text-rose-200 border-2 border-rose-600 shadow-md">
          <TrendingUp className="w-5 h-5 text-rose-400" />
          <span>{t("increased")} (+₹{Math.abs(amount.difference || 0).toFixed(2)})</span>
        </span>
      );
    }
    if (amount.status === "decreased") {
      return (
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-base font-black bg-emerald-950 text-emerald-200 border-2 border-emerald-600 shadow-md">
          <TrendingDown className="w-5 h-5 text-emerald-400" />
          <span>{t("decreased")} (-₹{Math.abs(amount.difference || 0).toFixed(2)})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-base font-black bg-slate-800 text-slate-200 border-2 border-slate-600 shadow-md">
        <Minus className="w-5 h-5 text-slate-400" />
        <span>{t("unchanged")}</span>
      </span>
    );
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="tap-target px-4 py-2 text-slate-300 hover:text-white rounded-2xl flex items-center gap-2 transition-colors cursor-pointer bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5 text-sky-400" />
          <span className="text-base font-bold">{t("back")}</span>
        </button>

        <span className="text-xs font-black uppercase tracking-wider text-sky-300 bg-sky-950 px-3.5 py-1.5 rounded-full border-2 border-sky-700/80 shadow-sm flex items-center gap-1.5">
          <GitCompare className="w-4 h-4 text-sky-400" />
          {t("billComparisonTitle")}
        </span>
      </div>

      {/* Audio Explanation */}
      <AudioPlayer textToSpeak={interpretation} />

      {/* Grounded Interpretation Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border-2 border-indigo-500/60 shadow-2xl space-y-3">
        <h3 className="text-xl font-black text-white flex items-center gap-2">
          <span>What the comparison shows</span>
        </h3>
        <p className="text-lg font-medium text-slate-100 leading-relaxed break-words">
          {interpretation}
        </p>
      </div>

      {/* Amount Difference Card */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm font-black uppercase tracking-wider text-slate-300">
            {t("amountDifference")}
          </span>
          {renderAmountStatusBadge()}
        </div>

        <div className="grid grid-cols-2 gap-3.5 pt-1">
          <div className="p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 shadow-inner">
            <span className="text-sm text-slate-400 font-bold block mb-1">Earlier Bill</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-200">
              ₹{amount.previous !== null ? amount.previous.toFixed(2) : "—"}
            </span>
          </div>

          <div className="p-4 bg-slate-950 rounded-2xl border-2 border-indigo-600/70 shadow-inner">
            <span className="text-sm text-indigo-300 font-bold block mb-1">Current Bill</span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              ₹{amount.current !== null ? amount.current.toFixed(2) : "—"}
            </span>
          </div>
        </div>

        {amount.percentage_change !== null && (
          <p className="text-sm text-slate-300 text-center font-mono font-bold pt-1">
            Net Percentage Change: {amount.percentage_change > 0 ? "+" : ""}
            {amount.percentage_change.toFixed(2)}%
          </p>
        )}
      </div>

      {/* Consumption Comparison */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-3.5 shadow-xl">
        <div className="flex items-center gap-2.5 text-slate-200">
          <Zap className="w-5 h-5 text-amber-400" />
          <h4 className="text-base font-extrabold uppercase tracking-wider text-slate-300">
            {t("consumptionDifference")}
          </h4>
        </div>

        {consumption.comparable ? (
          <div className="grid grid-cols-2 gap-3.5 pt-1">
            <div className="p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 shadow-inner">
              <span className="text-sm text-slate-400 font-bold block mb-1">Earlier Usage</span>
              <span className="text-2xl font-black text-slate-200">
                {consumption.previous} {consumption.unit}
              </span>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 shadow-inner">
              <span className="text-sm text-slate-400 font-bold block mb-1">Current Usage</span>
              <span className="text-2xl font-black text-white">
                {consumption.current} {consumption.unit}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">
            Usage figures were not directly comparable across these two documents.
          </p>
        )}
      </div>

      {/* Due Date Change */}
      <div className="p-5 rounded-2xl bg-slate-900 border-2 border-slate-800 flex items-center justify-between text-base shadow-md">
        <span className="text-slate-300 flex items-center gap-2.5 font-bold">
          <Calendar className="w-5 h-5 text-sky-400" />
          {t("dueDateComparison")}:
        </span>
        <div className="flex items-center gap-2 font-mono text-sm font-bold">
          <span className="text-slate-400">{due_date.previous || "—"}</span>
          <ArrowRight className="w-4 h-4 text-slate-500" />
          <span className="text-white font-black">{due_date.current || "—"}</span>
        </div>
      </div>

      {/* Line Item Diff List */}
      {line_item_diffs.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-3.5 shadow-xl">
          <h4 className="text-base font-extrabold uppercase tracking-wider text-slate-300">
            Line Items Comparison
          </h4>
          <div className="divide-y divide-slate-800 text-base">
            {line_item_diffs.map((diff, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <span className="text-slate-200 font-medium">{diff.label}</span>
                <div className="flex items-center gap-2 text-sm font-mono font-bold">
                  {diff.status === "added" ? (
                    <span className="text-emerald-300 bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-800">
                      Appears on current: ₹{diff.current_amount}
                    </span>
                  ) : diff.status === "removed" ? (
                    <span className="text-slate-400 line-through">
                      Was ₹{diff.previous_amount}
                    </span>
                  ) : diff.current_amount !== diff.previous_amount ? (
                    <span className="text-sky-300">
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
        <div className="p-5 rounded-2xl bg-amber-950/80 border-2 border-amber-600/70 text-amber-100 text-sm space-y-1.5 shadow-lg">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Continue to Payment Call to Action for Current Bill */}
      {currentDoc && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950/80 border-2 border-emerald-500/80 shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span>Review & Pay Current Bill</span>
            </span>
            <span className="text-xl font-black text-white">
              ₹{amount.current ? amount.current.toFixed(2) : "1,240.00"}
            </span>
          </div>

          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            Ready to settle this bill after reviewing changes? Continue to simulated payment gateway.
          </p>

          <BigButton
            variant="success"
            size="lg"
            icon={<CreditCard className="w-6 h-6" />}
            onClick={() => setShowPaymentModal(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400/60 shadow-xl cursor-pointer"
          >
            {t("continueToPayment")} (₹{amount.current ? amount.current.toFixed(2) : "1,240.00"})
          </BigButton>
        </div>
      )}

      {/* Honest Boundary Disclaimer */}
      <div className="flex items-start gap-3.5 p-4.5 rounded-2xl bg-slate-900 border-2 border-slate-800 text-sm text-slate-300 font-medium leading-relaxed">
        <ShieldAlert className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
        <p>{t("comparisonDisclaimer")}</p>
      </div>

      {/* Payment Gateway Modal */}
      {currentDoc && (
        <PaymentGatewayModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          document={currentDoc}
        />
      )}
    </div>
  );
};
