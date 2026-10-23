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
        <h2 className="text-3xl font-extrabold text-white flex items-center gap-2.5">
          <History className="w-8 h-8 text-sky-400" />
          {t("history")}
        </h2>
        <p className="text-sm text-slate-400">
          Analysis results saved on this phone
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl" role="tablist">
        {(
          [
            { id: "all", label: t("filterAll") },
            { id: "bill", label: t("filterBills") },
            { id: "document", label: t("filterDocuments") },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`tap-target flex-1 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              filter === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Document List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm">Loading records...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center bg-slate-900/50 border border-slate-800 rounded-3xl space-y-4">
          <Clock className="w-12 h-12 text-slate-600 mx-auto" />
          <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
            {t("noRecords")}
          </p>
          <BigButton variant="primary" size="md" onClick={() => navigate("/")}>
            {t("home")}
          </BigButton>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
            >
              <div
                onClick={() =>
                  navigate(item.workflow === "bill" ? `/billsaathi/${item.id}` : `/proofpath/${item.id}`)
                }
                className="flex items-start gap-3.5 min-w-0 flex-1 cursor-pointer"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                    item.workflow === "bill"
                      ? "bg-indigo-950/80 text-indigo-400 border-indigo-800/60"
                      : "bg-sky-950/80 text-sky-400 border-sky-800/60"
                  }`}
                >
                  {item.workflow === "bill" ? <Receipt className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    {item.workflow === "bill" ? t("billSaathi") : t("proofPath")}
                  </span>
                  <p className="text-sm font-semibold text-white truncate mt-0.5">
                    {item.summary || item.document_type}
                  </p>
                  <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : ""}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(item.id)}
                  className="tap-target p-2 text-slate-500 hover:text-rose-400 rounded-xl transition-colors cursor-pointer"
                  aria-label="Delete document"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(item.workflow === "bill" ? `/billsaathi/${item.id}` : `/proofpath/${item.id}`)
                  }
                  className="tap-target p-2 text-slate-500 hover:text-white rounded-xl transition-colors cursor-pointer"
                  aria-label="View document"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 animate-in fade-in duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/80 text-rose-400 flex items-center justify-center mx-auto border border-rose-800">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-white">
              {t("confirmDelete")}
            </h3>
            <div className="grid grid-cols-2 gap-3 pt-2">
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
