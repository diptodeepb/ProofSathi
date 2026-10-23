import React, { useState, useEffect } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { api } from "../lib/api";
import { DocumentCapture } from "../components/DocumentCapture";
import { LoadingProgress } from "../components/LoadingProgress";
import { BigButton } from "../components/BigButton";
import { ArrowLeft, AlertCircle, Receipt, FileText } from "lucide-react";

export const ScanPage: React.FC = () => {
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const workflowParam = (searchParams.get("workflow") || "bill") as "bill" | "document";
  const [workflow] = useState<"bill" | "document">(
    location.state?.workflow || workflowParam
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // If preloadedBlob was passed from DemoSpecimenSelector
  useEffect(() => {
    if (location.state?.preloadedBlob) {
      handleAnalyze(location.state.preloadedBlob);
    }
  }, [location.state]);

  const handleAnalyze = async (fileOrBlob: File | Blob) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.analyzeDocument(fileOrBlob, workflow, language);
      if (res.workflow === "bill") {
        navigate(`/billsaathi/${res.document_id}`, { state: { document: res } });
      } else {
        navigate(`/proofpath/${res.document_id}`, { state: { document: res } });
      }
    } catch (err: any) {
      setError(err?.message || "Could not analyze the document. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Top bar with back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="tap-target px-3 py-1.5 text-slate-400 hover:text-white rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">{t("back")}</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
          {workflow === "bill" ? <Receipt className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
          {workflow === "bill" ? t("billSaathi") : t("proofPath")}
        </span>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          {workflow === "bill" ? t("understandBill") : t("understandDocument")}
        </h2>
        <p className="text-sm sm:text-base text-slate-300">
          {t("scanDocument")}
        </p>
      </div>

      {isLoading ? (
        <LoadingProgress />
      ) : (
        <div className="space-y-4">
          <DocumentCapture onCapture={handleAnalyze} isLoading={isLoading} />

          {error && (
            <div className="p-4 bg-rose-950/70 border border-rose-800 rounded-2xl flex items-start gap-3 text-rose-200">
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-semibold">{error}</p>
                <BigButton
                  variant="outline"
                  size="md"
                  onClick={() => setError(null)}
                  className="text-sm py-1.5 px-3 border-rose-700 text-rose-200 hover:bg-rose-900/50"
                >
                  {t("retry")}
                </BigButton>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
