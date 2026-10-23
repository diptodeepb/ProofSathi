import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { api, DocumentListItem } from "../lib/api";
import { DemoSpecimenSelector } from "../components/DemoSpecimenSelector";
import {
  Receipt,
  FileText,
  ArrowRight,
  Clock,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

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
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
          {t("appName")}
        </h2>
        <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
          {t("tagline")}
        </p>
      </div>

      {/* Two Core Workflow Cards Side by Side on Mobile with Clean Flush-Left Alignment */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* BillSaathi Card */}
        <button
          type="button"
          onClick={() => navigate("/scan?workflow=bill")}
          className="w-full text-left p-4 sm:p-5 rounded-3xl bg-slate-900 border-2 border-slate-700/80 hover:border-indigo-400 active:scale-[0.98] transition-all shadow-xl group cursor-pointer flex flex-col justify-between"
        >
          <div>
            {/* Header: Icon on Left, Arrow on Right */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border-2 border-indigo-500/50 shadow-inner shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 group-hover:text-white group-hover:bg-indigo-600 flex items-center justify-center transition-all border border-slate-700 shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Content: Clean Flush-Left Alignment */}
            <div className="mt-3.5 space-y-1">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-indigo-400 block">
                {t("billSaathi")}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-indigo-300 transition-colors leading-tight break-words">
                {t("understandBill")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed mt-1.5 break-words">
                {t("understandBillDesc")}
              </p>
            </div>
          </div>
        </button>

        {/* ProofPath Card */}
        <button
          type="button"
          onClick={() => navigate("/scan?workflow=document")}
          className="w-full text-left p-4 sm:p-5 rounded-3xl bg-slate-900 border-2 border-slate-700/80 hover:border-sky-400 active:scale-[0.98] transition-all shadow-xl group cursor-pointer flex flex-col justify-between"
        >
          <div>
            {/* Header: Icon on Left, Arrow on Right */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-sky-600/30 text-sky-400 flex items-center justify-center border-2 border-sky-500/50 shadow-inner shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 group-hover:text-white group-hover:bg-sky-600 flex items-center justify-center transition-all border border-slate-700 shrink-0">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Content: Clean Flush-Left Alignment */}
            <div className="mt-3.5 space-y-1">
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-sky-400 block">
                {t("proofPath")}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-sky-300 transition-colors leading-tight break-words">
                {t("understandDocument")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed mt-1.5 break-words">
                {t("understandDocumentDesc")}
              </p>
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
            <h4 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-slate-400" />
              <span>{t("recentDocuments")}</span>
            </h4>
            <button
              type="button"
              onClick={() => navigate("/history")}
              className="text-sm text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer py-1"
            >
              {t("viewAllHistory")}
            </button>
          </div>

          <div className="space-y-2.5">
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() =>
                  navigate(
                    doc.workflow === "bill"
                      ? `/billsaathi/${doc.id}`
                      : `/proofpath/${doc.id}`,
                  )
                }
                className="p-4.5 rounded-2xl bg-slate-900 border-2 border-slate-800 hover:border-slate-700 active:scale-[0.99] transition-all flex items-center justify-between cursor-pointer shadow-md"
              >
                <div className="min-w-0 pr-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-400 block mb-0.5">
                    {doc.workflow === "bill" ? t("billSaathi") : t("proofPath")}
                  </span>
                  <p className="text-base font-bold text-slate-100 line-clamp-2 break-words leading-relaxed">
                    {doc.summary || doc.document_type}
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-400 shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trust & Transparency Note */}
      <div className="flex items-start gap-3.5 p-4.5 rounded-2xl bg-slate-900 border-2 border-slate-800 text-sm text-slate-300 font-medium leading-relaxed">
        <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          Calculations are performed deterministically by code. Evidence
          snippets are preserved from original documents.
        </p>
      </div>
    </div>
  );
};
