import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { api, DocumentAnalysisResponse, ActionItem, PaymentReceipt } from "../lib/api";
import { AudioPlayer } from "../components/AudioPlayer";
import { EvidenceSnippet } from "../components/EvidenceSnippet";
import { BigButton } from "../components/BigButton";
import { PaymentGatewayModal } from "../components/PaymentGatewayModal";
import { extractPaymentDetails } from "../lib/payment";
import {
  ArrowLeft,
  Calendar,
  FileCheck,
  CheckCircle,
  CheckCircle2,
  Circle,
  HelpCircle,
  Plus,
  ShieldCheck,
  Clock,
  Layers,
  CreditCard,
} from "lucide-react";

export const ProofPathPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [document, setDocument] = useState<DocumentAnalysisResponse | null>(
    location.state?.document || null
  );
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!document);
  const [error, setError] = useState<string | null>(null);

  // New action input
  const [newActionTitle, setNewActionTitle] = useState<string>("");
  const [isAddingAction, setIsAddingAction] = useState<boolean>(false);

  // Payment gateway modal state
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentReceipt | null>(null);

  useEffect(() => {
    if (!document && id) {
      api
        .getDocument(id)
        .then((doc) => setDocument(doc))
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [id, document]);

  // Load actions associated with this document or session
  useEffect(() => {
    if (id) {
      api
        .listActions(id)
        .then((items) => setActions(items))
        .catch(() => {});
    }
  }, [id]);

  // Check if document already has a payment receipt
  useEffect(() => {
    const docId = id || document?.document_id;
    if (docId) {
      api
        .getPaymentReceipt(docId)
        .then((r) => {
          if (r) setPaymentReceipt(r);
        })
        .catch(() => {});
    }
  }, [id, document?.document_id]);

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-slate-300">
        <div className="w-12 h-12 border-3 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-bold text-white">Loading document details...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-rose-300 font-bold text-lg">{error || "Document not found."}</p>
        <BigButton variant="secondary" onClick={() => navigate("/")}>
          {t("home")}
        </BigButton>
      </div>
    );
  }

  const importantDates = document.fields.filter((f) => f.key.startsWith("important_date_"));
  const requiredDocs = document.fields.filter((f) => f.key.startsWith("required_document_"));

  const toggleTaskStatus = async (action: ActionItem) => {
    const nextStatus = action.status === "completed" ? "pending" : "completed";
    try {
      const updated = await api.updateAction(action.id, { status: nextStatus });
      setActions((prev) => prev.map((a) => (a.id === action.id ? updated : a)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim() || !id) return;

    setIsAddingAction(true);
    try {
      const created = await api.createAction({
        title: newActionTitle.trim(),
        document_id: id,
      });
      setActions((prev) => [...prev, created]);
      setNewActionTitle("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingAction(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="tap-target px-4 py-2 text-slate-300 hover:text-white rounded-2xl flex items-center gap-2 transition-colors cursor-pointer bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5 text-sky-400" />
          <span className="text-base font-bold">{t("home")}</span>
        </button>

        <span className="text-xs font-black uppercase tracking-wider text-sky-300 bg-sky-950 px-3.5 py-1.5 rounded-full border-2 border-sky-700/80 shadow-sm">
          {t("proofPath")}
        </span>
      </div>

      {/* Spoken Summary Audio */}
      <AudioPlayer textToSpeak={document.summary} />

      {/* Document Summary Card */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border-2 border-sky-500/60 shadow-2xl space-y-3">
        <span className="text-xs font-black uppercase tracking-wider text-sky-400 block">
          {t("documentSummary")}
        </span>
        <p className="text-lg sm:text-xl font-bold text-white leading-relaxed break-words">
          {document.summary}
        </p>
      </div>

      {/* Senior-Citizen Optimized Payment Call-to-Action / Status Card */}
      {paymentReceipt ? (
        <div className="p-5 sm:p-6 rounded-3xl bg-emerald-950/80 border-2 border-emerald-500/90 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block mb-0.5">
                {t("billPaidBanner")}
              </span>
              <p className="text-base font-bold text-white truncate">
                Txn: {paymentReceipt.transaction_id}
              </p>
              <span className="text-xs text-emerald-300 font-mono">
                Paid ₹{paymentReceipt.amount.toFixed(2)} on{" "}
                {new Date(paymentReceipt.paid_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="tap-target px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-base border-2 border-emerald-400/60 shadow-md cursor-pointer transition-all active:scale-95"
          >
            {t("viewReceipt")}
          </button>
        </div>
      ) : (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-sky-950/90 via-slate-900 to-indigo-950/80 border-2 border-sky-500/80 shadow-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-400">
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">
                Official Fee & Portal Settlement
              </span>
            </div>
            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Pre-filled from notice
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">
                {extractPaymentDetails(document).periodOrDescription}
              </p>
              <span className="text-xs text-slate-400">
                {extractPaymentDetails(document).billerName}
              </span>
            </div>
            <span className="text-2xl font-black text-sky-300">
              {extractPaymentDetails(document).formattedTotalPayable}
            </span>
          </div>

          <BigButton
            variant="primary"
            size="lg"
            icon={<CreditCard className="w-6 h-6" />}
            onClick={() => setShowPaymentModal(true)}
            className="w-full text-lg sm:text-xl py-4 bg-sky-600 hover:bg-sky-500 text-white border-2 border-sky-400/60 shadow-xl cursor-pointer"
          >
            {t("continueToPayment")} ({extractPaymentDetails(document).formattedTotalPayable})
          </BigButton>
        </div>
      )}

      {/* Important Dates Section */}
      {importantDates.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-3.5 shadow-md">
          <div className="flex items-center gap-2.5 text-slate-200">
            <Calendar className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-extrabold text-white">{t("importantDates")}</h3>
          </div>

          <div className="space-y-3">
            {importantDates.map((d) => (
              <div key={d.key} className="p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-base font-bold text-slate-100">{d.label}</span>
                  <span className="text-base font-black font-mono text-sky-300">{d.value}</span>
                </div>
                <EvidenceSnippet
                  sourceText={d.source_text}
                  status={d.extraction_status}
                  needsConfirmation={d.needs_confirmation}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Required Documents Section */}
      {requiredDocs.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-3.5 shadow-md">
          <div className="flex items-center gap-2.5 text-slate-200">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-extrabold text-white">{t("requiredDocuments")}</h3>
          </div>

          <div className="space-y-3">
            {requiredDocs.map((rd) => (
              <div key={rd.key} className="p-4 bg-slate-950 rounded-2xl border-2 border-slate-800 space-y-1.5">
                <span className="text-base font-bold text-white block leading-snug">{rd.value}</span>
                <EvidenceSnippet
                  sourceText={rd.source_text}
                  status={rd.extraction_status}
                  needsConfirmation={rd.needs_confirmation}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Checklist (Elderly friendly big check items) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border-2 border-indigo-500/50 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-slate-200">
            <FileCheck className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-extrabold text-white">{t("actionChecklist")}</h3>
          </div>
          <span className="text-sm text-slate-300 font-bold bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {actions.filter((a) => a.status === "completed").length} / {actions.length} done
          </span>
        </div>

        {/* Task Items */}
        <div className="space-y-3">
          {actions.map((act) => {
            const isDone = act.status === "completed";
            return (
              <div
                key={act.id}
                onClick={() => toggleTaskStatus(act)}
                className={`tap-target w-full p-4.5 rounded-2xl border-2 transition-all text-left flex items-start gap-4 cursor-pointer active:scale-[0.99] shadow-md ${
                  isDone
                    ? "bg-slate-950/70 border-emerald-900/60 text-slate-400"
                    : "bg-slate-950 border-slate-700 text-white hover:border-slate-500"
                }`}
              >
                <div className="mt-1 shrink-0">
                  {isDone ? (
                    <CheckCircle className="w-7 h-7 text-emerald-400 fill-emerald-950/80" />
                  ) : act.needs_confirmation ? (
                    <HelpCircle className="w-7 h-7 text-amber-400" />
                  ) : (
                    <Circle className="w-7 h-7 text-slate-400 hover:text-white" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <span
                    className={`block text-lg font-bold leading-snug break-words ${
                      isDone ? "line-through text-slate-400" : "text-white"
                    }`}
                  >
                    {act.title}
                  </span>
                  {act.description && (
                    <p className="text-sm text-slate-300 leading-relaxed font-medium break-words">
                      {act.description}
                    </p>
                  )}
                  {act.due_date && (
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-sky-300 font-bold font-mono">
                      <Clock className="w-3.5 h-3.5" /> Due: {act.due_date}
                    </span>
                  )}
                  {act.source_text && (
                    <EvidenceSnippet
                      sourceText={act.source_text}
                      needsConfirmation={act.needs_confirmation}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add custom step form */}
        <form onSubmit={handleAddCustomTask} className="pt-2 flex gap-2.5">
          <input
            type="text"
            value={newActionTitle}
            onChange={(e) => setNewActionTitle(e.target.value)}
            placeholder={t("taskPlaceholder")}
            className="flex-1 bg-slate-950 border-2 border-slate-700 rounded-2xl px-4 py-3.5 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
            disabled={isAddingAction}
          />
          <button
            type="submit"
            disabled={!newActionTitle.trim() || isAddingAction}
            className="tap-target px-5 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-base rounded-2xl flex items-center gap-2 transition-all cursor-pointer border-2 border-indigo-400/50 shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>Add</span>
          </button>
        </form>
      </div>

      {/* Safety Note */}
      <div className="flex items-start gap-3.5 p-4.5 rounded-2xl bg-slate-900 border-2 border-slate-800 text-sm text-slate-300 font-medium leading-relaxed">
        <ShieldCheck className="w-6 h-6 text-sky-400 shrink-0 mt-0.5" />
        <p>
          Always confirm consequential instructions and deadlines directly with the issuing department or service office.
        </p>
      </div>

      {/* Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        document={document}
        initialReceipt={paymentReceipt}
        onPaymentSuccess={(r) => {
          setPaymentReceipt(r);
          setActions((prev) =>
            prev.map((a) => {
              const lower = (a.title + " " + (a.description || "")).toLowerCase();
              if (
                lower.includes("certificate") ||
                lower.includes("fee") ||
                lower.includes("appointment") ||
                lower.includes("submit") ||
                lower.includes("pay")
              ) {
                return { ...a, status: "completed" };
              }
              return a;
            })
          );
        }}
      />
    </div>
  );
};
