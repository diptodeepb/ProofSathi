import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { api, DocumentAnalysisResponse, PaymentReceipt } from "../lib/api";
import { AudioPlayer } from "../components/AudioPlayer";
import { EvidenceSnippet } from "../components/EvidenceSnippet";
import { BigButton } from "../components/BigButton";
import { PaymentGatewayModal } from "../components/PaymentGatewayModal";
import {
  ArrowLeft,
  Calendar,
  Zap,
  IndianRupee,
  Layers,
  GitCompare,
  Building,
  UserCheck,
  AlertTriangle,
  Upload,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

export const BillSaathiPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [document, setDocument] = useState<DocumentAnalysisResponse | null>(
    location.state?.document || null
  );
  const [isLoading, setIsLoading] = useState<boolean>(!document);
  const [error, setError] = useState<string | null>(null);

  // Compare previous modal state
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const [isComparing, setIsComparing] = useState<boolean>(false);

  // Payment gateway simulation state
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

  // Check if document has already been paid
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
        <div className="w-12 h-12 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-lg font-bold text-white">Loading bill details...</p>
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

  const getField = (key: string) => document.fields.find((f) => f.key === key);

  const amountField = getField("amount_due");
  const dueDateField = getField("due_date");
  const periodField = getField("billing_period");
  const consumptionField = getField("consumption");
  const providerField = getField("provider_name");
  const consumerIdField = getField("consumer_id");

  const lineItemFields = document.fields.filter((f) => f.key.startsWith("line_item_"));

  // Handler for uploading/comparing previous bill
  const handlePreviousBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    setIsComparing(true);
    try {
      const prevRes = await api.analyzeDocument(file, "bill", language);
      const compRes = await api.compareBills(id, prevRes.document_id, language);
      navigate("/compare", {
        state: {
          comparison: compRes,
          currentDoc: document,
          previousDoc: prevRes,
        },
      });
    } catch (err: any) {
      alert(err.message || "Could not compare with previous bill.");
    } finally {
      setIsComparing(false);
      setShowCompareModal(false);
    }
  };

  const handleSelectDemoPrevious = async () => {
    if (!id) return;
    setIsComparing(true);
    try {
      const blob = await api.getFixtureBlob("demo-electricity-previous");
      const prevRes = await api.analyzeDocument(blob, "bill", language);
      const compRes = await api.compareBills(id, prevRes.document_id, language);
      navigate("/compare", {
        state: {
          comparison: compRes,
          currentDoc: document,
          previousDoc: prevRes,
        },
      });
    } catch (err: any) {
      alert(err.message || "Could not compare with demo previous bill.");
    } finally {
      setIsComparing(false);
      setShowCompareModal(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="tap-target px-4 py-2 text-slate-300 hover:text-white rounded-2xl flex items-center gap-2 transition-colors cursor-pointer bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5 text-sky-400" />
          <span className="text-base font-bold">{t("home")}</span>
        </button>

        <span className="text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-950 px-3.5 py-1.5 rounded-full border-2 border-indigo-700/80 shadow-sm">
          {t("billSaathi")}
        </span>
      </div>

      {/* Summary Audio Player */}
      <AudioPlayer textToSpeak={document.summary} />

      {/* Primary Key Metric: Total Amount Due (Elderly-friendly Extra Large Font) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900 border-2 border-indigo-500/70 shadow-2xl space-y-3">
        <div className="flex items-center gap-2.5 text-indigo-300">
          <IndianRupee className="w-6 h-6" />
          <span className="text-base font-extrabold uppercase tracking-wider">
            {t("amountDue")}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-none">
            {amountField ? amountField.value : "—"}
          </span>
        </div>

        {amountField && (
          <EvidenceSnippet
            sourceText={amountField.source_text}
            status={amountField.extraction_status}
            needsConfirmation={amountField.needs_confirmation}
          />
        )}
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
                Paid ₹{paymentReceipt.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })} on{" "}
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
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-indigo-950/80 border-2 border-emerald-500/80 shadow-2xl space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <CreditCard className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-wider">
                Elder Easy-Review & Pay
              </span>
            </div>
            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
              Pre-filled from bill data
            </span>
          </div>

          <p className="text-sm text-slate-200 font-medium leading-relaxed">
            {t("simulatePaymentBanner")}
          </p>

          <BigButton
            variant="success"
            size="lg"
            icon={<CreditCard className="w-6 h-6" />}
            onClick={() => setShowPaymentModal(true)}
            className="w-full text-lg sm:text-xl py-4 bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400/60 shadow-xl cursor-pointer"
          >
            {t("continueToPayment")} ({amountField ? amountField.value : "₹1,240.00"})
          </BigButton>
        </div>
      )}

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Due Date */}
        <div className="p-5 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-2 shadow-md">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-5 h-5 text-sky-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              {t("dueDate")}
            </span>
          </div>
          <span className="block text-2xl font-black text-white leading-tight">
            {dueDateField ? dueDateField.value : "—"}
          </span>
          {dueDateField && (
            <EvidenceSnippet
              sourceText={dueDateField.source_text}
              status={dueDateField.extraction_status}
              needsConfirmation={dueDateField.needs_confirmation}
            />
          )}
        </div>

        {/* Consumption */}
        <div className="p-5 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-2 shadow-md">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider">
              {t("consumption")}
            </span>
          </div>
          <span className="block text-2xl font-black text-white leading-tight">
            {consumptionField ? consumptionField.value : "—"}
          </span>
          {consumptionField && (
            <EvidenceSnippet
              sourceText={consumptionField.source_text}
              status={consumptionField.extraction_status}
              needsConfirmation={consumptionField.needs_confirmation}
            />
          )}
        </div>
      </div>

      {/* Billing Period & Provider Details */}
      {(periodField || providerField || consumerIdField) && (
        <div className="p-5 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-3 text-base shadow-md">
          {providerField && (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-2 font-medium">
                <Building className="w-5 h-5 text-slate-400" />
                {t("provider")}:
              </span>
              <span className="font-bold text-white text-right">{providerField.value}</span>
            </div>
          )}

          {consumerIdField && (
            <div className="flex items-center justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-2 font-medium">
                <UserCheck className="w-5 h-5 text-slate-400" />
                {t("consumerId")}:
              </span>
              <span className="font-mono font-bold text-white text-right">{consumerIdField.value}</span>
            </div>
          )}

          {periodField && (
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-400 font-medium">{t("billingPeriod")}:</span>
              <span className="font-bold text-white text-right">{periodField.value}</span>
            </div>
          )}
        </div>
      )}

      {/* Line Items Breakdown */}
      {lineItemFields.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border-2 border-slate-800 space-y-3 shadow-md">
          <div className="flex items-center gap-2.5 text-slate-200">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h4 className="text-lg font-extrabold text-white">{t("lineItems")}</h4>
          </div>

          <div className="divide-y divide-slate-800">
            {lineItemFields.map((item) => (
              <div key={item.key} className="py-3 flex items-center justify-between text-base">
                <span className="text-slate-300 font-medium">{item.label}</span>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings if any */}
      {document.warnings.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-950/80 border-2 border-amber-600/70 text-amber-100 text-base space-y-2 shadow-lg">
          <div className="flex items-center gap-2.5 font-black text-amber-300 text-lg">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
            <span>Notice</span>
          </div>
          <ul className="list-disc list-inside space-y-1.5 text-sm text-amber-200 font-medium leading-relaxed">
            {document.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Compare with Earlier Bill Call to Action */}
      <div className="pt-2">
        <BigButton
          variant="primary"
          size="lg"
          icon={<GitCompare className="w-6 h-6" />}
          onClick={() => setShowCompareModal(true)}
          className="w-full"
        >
          {t("compareWithPrevious")}
        </BigButton>
      </div>

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in duration-150">
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white leading-tight">
                {t("comparingWith")}
              </h3>
              <p className="text-base text-slate-300 font-medium leading-relaxed">
                {t("uploadPreviousPrompt")}
              </p>
            </div>

            <div className="space-y-3.5">
              <label className="tap-target w-full p-4.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base sm:text-lg flex items-center justify-center gap-2.5 cursor-pointer active:scale-95 transition-all border-2 border-indigo-400/50 shadow-lg">
                <Upload className="w-6 h-6" />
                <span>{t("takePhoto")} / {t("chooseFile")}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePreviousBillUpload}
                  className="hidden"
                  disabled={isComparing}
                />
              </label>

              <button
                type="button"
                onClick={handleSelectDemoPrevious}
                disabled={isComparing}
                className="tap-target w-full p-4 rounded-2xl bg-slate-800 hover:bg-slate-750 border-2 border-slate-700 text-white font-bold text-base flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md"
              >
                <span>Use Sample Previous Bill (₹980)</span>
              </button>
            </div>

            {isComparing && (
              <p className="text-sm text-center text-sky-400 font-bold animate-pulse">
                Analyzing and comparing bills deterministically...
              </p>
            )}

            <button
              type="button"
              onClick={() => setShowCompareModal(false)}
              disabled={isComparing}
              className="w-full text-center text-base font-bold text-slate-400 hover:text-white pt-2 cursor-pointer"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      <PaymentGatewayModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        document={document}
        initialReceipt={paymentReceipt}
        onPaymentSuccess={(r) => setPaymentReceipt(r)}
      />
    </div>
  );
};
