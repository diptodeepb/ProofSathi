import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { api, DocumentAnalysisResponse } from "../lib/api";
import { AudioPlayer } from "../components/AudioPlayer";
import { EvidenceSnippet } from "../components/EvidenceSnippet";
import { BigButton } from "../components/BigButton";
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

  useEffect(() => {
    if (!document && id) {
      api
        .getDocument(id)
        .then((doc) => setDocument(doc))
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [id, document]);

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p>Loading bill details...</p>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-rose-300 font-medium">{error || "Document not found."}</p>
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
      // 1. Analyze previous bill
      const prevRes = await api.analyzeDocument(file, "bill", language);
      // 2. Run deterministic comparison
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
          onClick={() => navigate("/")}
          className="tap-target px-3 py-1.5 text-slate-400 hover:text-white rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">{t("home")}</span>
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-700/60">
          {t("billSaathi")}
        </span>
      </div>

      {/* Summary Audio Player */}
      <AudioPlayer textToSpeak={document.summary} />

      {/* Primary Key Metric: Total Amount Due */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border-2 border-indigo-500/60 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-indigo-300">
          <IndianRupee className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-wider">
            {t("amountDue")}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
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

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Due Date */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t("dueDate")}
            </span>
          </div>
          <span className="block text-xl font-bold text-white">
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
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t("consumption")}
            </span>
          </div>
          <span className="block text-xl font-bold text-white">
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
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-sm">
          {providerField && (
            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Building className="w-4 h-4" />
                {t("provider")}:
              </span>
              <span className="font-semibold text-slate-200">{providerField.value}</span>
            </div>
          )}

          {consumerIdField && (
            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                {t("consumerId")}:
              </span>
              <span className="font-mono font-semibold text-slate-200">{consumerIdField.value}</span>
            </div>
          )}

          {periodField && (
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">{t("billingPeriod")}:</span>
              <span className="font-semibold text-slate-200">{periodField.value}</span>
            </div>
          )}
        </div>
      )}

      {/* Line Items Breakdown */}
      {lineItemFields.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Layers className="w-4 h-4 text-indigo-400" />
            <h4 className="text-base font-bold">{t("lineItems")}</h4>
          </div>

          <div className="divide-y divide-slate-800">
            {lineItemFields.map((item) => (
              <div key={item.key} className="py-2.5 flex items-center justify-between text-sm">
                <span className="text-slate-300">{item.label}</span>
                <span className="font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings if any */}
      {document.warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/60 text-amber-200 text-sm space-y-1.5">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Notice</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-xs text-amber-300/90">
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
          className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500"
        >
          {t("compareWithPrevious")}
        </BigButton>
      </div>

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 animate-in fade-in duration-150">
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-white">
                {t("comparingWith")}
              </h3>
              <p className="text-sm text-slate-300">
                {t("uploadPreviousPrompt")}
              </p>
            </div>

            <div className="space-y-3">
              <label className="tap-target w-full p-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all">
                <Upload className="w-5 h-5" />
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
                onClick={handleSelectDemoPrevious}
                disabled={isComparing}
                className="tap-target w-full p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <span>Use Sample Previous Bill (₹980)</span>
              </button>
            </div>

            {isComparing && (
              <p className="text-xs text-center text-sky-400 font-medium animate-pulse">
                Analyzing and comparing bills deterministically...
              </p>
            )}

            <button
              onClick={() => setShowCompareModal(false)}
              disabled={isComparing}
              className="w-full text-center text-sm text-slate-400 hover:text-slate-200 pt-2"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
