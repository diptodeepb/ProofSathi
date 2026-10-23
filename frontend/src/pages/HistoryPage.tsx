import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { api, DocumentListItem } from "../lib/api";
import { BigButton } from "../components/BigButton";
import {
  History,
  Receipt,
  FileText,
  Trash2,
  ChevronRight,
  Clock,
  AlertTriangle,
} from "lucide-react";

export const HistoryPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [items, setItems] = useState<DocumentListItem[]>([]);
  const [filter, setFilter] = useState<"all" | "bill" | "document">("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const loadDocuments = () => {
    setIsLoading(true);
    api
      .listDocuments(filter === "all" ? undefined : filter)
      .then((res) => setItems(res.items))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadDocuments();
  }, [filter]);

  const handleDelete = async (docId: string) => {
    try {
      await api.deleteDocument(docId);
      setItems((prev) => prev.filter((i) => i.id !== docId));
      setDeleteTargetId(null);
    } catch (e: any) {
      alert(e.message || "Failed to delete record.");
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div className="space-y-1">
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-3">
          <History className="w-8 h-8 text-sky-400" />
          <span>{t("history")}</span>
        </h2>
        <p className="text-base text-slate-300 font-medium">
          Analysis results saved on this phone
        </p>
      </div>

      {/* Filter Tabs (Elderly friendly large buttons) */}
      <div className="flex gap-2 p-1.5 bg-slate-900 border-2 border-slate-800 rounded-2xl shadow-md" role="tablist">
        {(
          [
            { id: "all", label: t("filterAll") },
            { id: "bill", label: t("filterBills") },
            { id: "document", label: t("filterDocuments") },
          ] as const
        ).map((tab) => {
          const isActive = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`tap-target flex-1 py-3 rounded-xl text-base font-bold transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md border-2 border-indigo-400/50"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-300">
          <div className="w-10 h-10 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-base font-bold text-white">Loading records...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center bg-slate-900 border-2 border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <Clock className="w-14 h-14 text-slate-500 mx-auto" />
          <p className="text-base text-slate-300 max-w-xs mx-auto leading-relaxed font-medium">
            {t("noRecords")}
          </p>
          <BigButton variant="primary" size="md" onClick={() => navigate("/")}>
            {t("home")}
          </BigButton>
        </div>
      ) : (
        <div className="space-y-3.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4.5 rounded-2xl bg-slate-900 border-2 border-slate-800 hover:border-slate-600 transition-all flex items-center justify-between gap-3.5 shadow-md"
            >
              <div
                onClick={() =>
                  navigate(item.workflow === "bill" ? `/billsaathi/${item.id}` : `/proofpath/${item.id}`)
                }
                className="flex items-start gap-4 min-w-0 flex-1 cursor-pointer"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 border-2 ${
                    item.workflow === "bill"
                      ? "bg-indigo-950 text-indigo-300 border-indigo-700/80"
                      : "bg-sky-950 text-sky-300 border-sky-700/80"
                  }`}
                >
                  {item.workflow === "bill" ? <Receipt className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-0.5">
                    {item.workflow === "bill" ? t("billSaathi") : t("proofPath")}
                  </span>
                  <p className="text-base font-bold text-white line-clamp-2 break-words leading-relaxed">
                    {item.summary || item.document_type}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400 font-mono">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                    </span>
                    {Boolean(localStorage.getItem(`proofsathi_payment_${item.id}`)) && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded-md border border-emerald-600/70">
                        ✓ {t("billPaidBanner")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(item.id)}
                  className="tap-target w-11 h-11 text-slate-400 hover:text-rose-400 rounded-xl transition-colors cursor-pointer flex items-center justify-center bg-slate-800/80 border border-slate-700 hover:border-rose-700"
                  aria-label="Delete document"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(item.workflow === "bill" ? `/billsaathi/${item.id}` : `/proofpath/${item.id}`)
                  }
                  className="tap-target w-11 h-11 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer flex items-center justify-center bg-slate-800/80 border border-slate-700 hover:border-sky-500"
                  aria-label="View document"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl animate-in fade-in duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-950 text-rose-400 flex items-center justify-center mx-auto border-2 border-rose-700">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-center text-white">
              {t("confirmDelete")}
            </h3>
            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <BigButton variant="outline" size="md" onClick={() => setDeleteTargetId(null)}>
                {t("cancel")}
              </BigButton>
              <BigButton variant="danger" size="md" onClick={() => handleDelete(deleteTargetId)}>
                {t("delete")}
              </BigButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
