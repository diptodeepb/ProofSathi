import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { api, DocumentListItem } from "../lib/api";
import { DemoSpecimenSelector } from "../components/DemoSpecimenSelector";
import { Receipt, FileText, ArrowRight, Clock, ShieldCheck, ChevronRight } from "lucide-react";

export const HomePage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [recentDocs, setRecentDocs] = useState<DocumentListItem[]>([]);

  useEffect(() => {
    api
      .listDocuments()
      .then((res) => setRecentDocs(res.items.slice(0, 3)))
      .catch(() => {});
  }, []);

  const handleSelectDemo = (blob: Blob, workflow: "bill" | "document") => {
    // Navigate to scan page with preloaded blob in state
    navigate("/scan", { state: { preloadedBlob: blob, workflow } });
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-7">
      {/* Welcome Hero */}
      <div className="space-y-2">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {t("appName")}
        </h2>
        <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
          {t("tagline")}
        </p>
      </div>

      {/* Two Core Workflow Cards */}
      <div className="space-y-4">
        {/* BillSaathi Card */}
        <button
          onClick={() => navigate("/scan?workflow=bill")}
          className="w-full text-left p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950/70 border-2 border-indigo-500/50 hover:border-indigo-400 active:scale-[0.98] transition-all shadow-lg shadow-indigo-950/30 group cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/40 shrink-0 mt-0.5">
                <Receipt className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  {t("billSaathi")}
                </span>
                <h3 className="text-2xl font-bold text-white group-hover:text-indigo-200 transition-colors">
                  {t("understandBill")}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {t("understandBillDesc")}
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-indigo-600 flex items-center justify-center shrink-0 transition-all mt-2">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </button>

        {/* ProofPath Card */}
        <button
          onClick={() => navigate("/scan?workflow=document")}
          className="w-full text-left p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-sky-950/70 border-2 border-sky-500/50 hover:border-sky-400 active:scale-[0.98] transition-all shadow-lg shadow-sky-950/30 group cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-600/30 text-sky-400 flex items-center justify-center border border-sky-500/40 shrink-0 mt-0.5">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                  {t("proofPath")}
                </span>
                <h3 className="text-2xl font-bold text-white group-hover:text-sky-200 transition-colors">
                  {t("understandDocument")}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {t("understandDocumentDesc")}
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-sky-600 flex items-center justify-center shrink-0 transition-all mt-2">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </button>
      </div>

      {/* Demo Specimen Selector */}
      <DemoSpecimenSelector onSelectFixture={handleSelectDemo} />

      {/* Recent Records */}
      {recentDocs.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              {t("recentDocuments")}
            </h4>
            <button
              onClick={() => navigate("/history")}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
            >
              {t("viewAllHistory")}
            </button>
          </div>

          <div className="space-y-2">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(doc.workflow === "bill" ? `/billsaathi/${doc.id}` : `/proofpath/${doc.id}`)}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="min-w-0 pr-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-0.5">
                    {doc.workflow === "bill" ? t("billSaathi") : t("proofPath")}
                  </span>
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {doc.summary || doc.document_type}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trust & Transparency Note */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
        <p>
          Calculations are performed deterministically by code. Evidence snippets are preserved from original documents.
        </p>
      </div>
    </div>
  );
};
