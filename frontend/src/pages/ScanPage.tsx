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
          type="button"
          onClick={() => navigate(-1)}
          className="tap-target px-4 py-2 text-slate-300 hover:text-white rounded-2xl flex items-center gap-2 transition-colors cursor-pointer bg-slate-900 border border-slate-800"
        >
          <ArrowLeft className="w-5 h-5 text-sky-400" />
          <span className="text-base font-bold">{t("back")}</span>
        </button>

        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-950 text-indigo-300 border-2 border-indigo-700/80 shadow-sm">
          {workflow === "bill" ? <Receipt className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          <span>{workflow === "bill" ? t("billSaathi") : t("proofPath")}</span>
        </span>
      </div>

      <div className="space-y-1.5">
        <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
          {workflow === "bill" ? t("understandBill") : t("understandDocument")}
        </h2>
        <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
          {t("scanDocument")}
        </p>
      </div>

      {isLoading ? (
        <LoadingProgress />
      ) : (
        <div className="space-y-4">
          <DocumentCapture onCapture={handleAnalyze} isLoading={isLoading} />

          {error && (
            <div className="p-5 bg-rose-950/80 border-2 border-rose-700 rounded-3xl flex items-start gap-3.5 text-rose-100 shadow-xl">
              <AlertCircle className="w-7 h-7 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-3">
                <p className="text-base font-bold leading-relaxed">{error}</p>
                <BigButton
                  variant="outline"
                  size="md"
                  onClick={() => setError(null)}
                  className="text-base py-2.5 px-5 border-rose-600 text-rose-200 hover:bg-rose-900/50"
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
