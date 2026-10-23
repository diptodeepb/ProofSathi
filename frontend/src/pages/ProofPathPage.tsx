import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { api, DocumentAnalysisResponse, ActionItem } from "../lib/api";
import { AudioPlayer } from "../components/AudioPlayer";
import { EvidenceSnippet } from "../components/EvidenceSnippet";
import { BigButton } from "../components/BigButton";
import {
  ArrowLeft,
  Calendar,
  FileCheck,
  CheckCircle,
  Circle,
  HelpCircle,
  Plus,
  ShieldCheck,
  Clock,
  Layers,
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

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center text-slate-400">
        <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p>Loading document details...</p>
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
          onClick={() => navigate("/")}
          className="tap-target px-3 py-1.5 text-slate-400 hover:text-white rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">{t("home")}</span>
        </button>

        <span className="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-950/80 px-3 py-1 rounded-full border border-sky-700/60">
          {t("proofPath")}
        </span>
      </div>

      {/* Spoken Summary Audio */}
      <AudioPlayer textToSpeak={document.summary} />

      {/* Document Summary Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border-2 border-sky-500/50 shadow-xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-400 block">
          {t("documentSummary")}
        </span>
        <p className="text-lg font-medium text-white leading-relaxed">
          {document.summary}
        </p>
      </div>

      {/* Important Dates Section */}
      {importantDates.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold">{t("importantDates")}</h3>
          </div>

          <div className="space-y-2.5">
            {importantDates.map((d) => (
              <div key={d.key} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">{d.label}</span>
                  <span className="text-sm font-bold font-mono text-sky-300">{d.value}</span>
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
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-slate-300">
            <Layers className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold">{t("requiredDocuments")}</h3>
          </div>

          <div className="space-y-2">
            {requiredDocs.map((rd) => (
              <div key={rd.key} className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-sm font-medium text-slate-200 block">{rd.value}</span>
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

      {/* Action Checklist */}
      <div className="p-5 rounded-3xl bg-slate-900 border-2 border-indigo-500/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-200">
            <FileCheck className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold">{t("actionChecklist")}</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {actions.filter((a) => a.status === "completed").length} / {actions.length} done
          </span>
        </div>

        {/* Task Items */}
        <div className="space-y-2.5">
          {actions.map((act) => {
            const isDone = act.status === "completed";
            return (
              <div
                key={act.id}
                onClick={() => toggleTaskStatus(act)}
                className={`tap-target w-full p-4 rounded-2xl border transition-all text-left flex items-start gap-3.5 cursor-pointer active:scale-[0.99] ${
                  isDone
                    ? "bg-slate-950/60 border-emerald-900/40 text-slate-400"
                    : "bg-slate-950 border-slate-700/80 text-white hover:border-slate-600"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle className="w-6 h-6 text-emerald-400 fill-emerald-950/80" />
                  ) : act.needs_confirmation ? (
                    <HelpCircle className="w-6 h-6 text-amber-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-500" />
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <span
                    className={`block text-base font-semibold ${
                      isDone ? "line-through text-slate-400" : "text-white"
                    }`}
                  >
                    {act.title}
                  </span>
                  {act.description && (
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {act.description}
                    </p>
                  )}
                  {act.due_date && (
                    <span className="inline-flex items-center gap-1 text-xs text-sky-300 font-mono">
                      <Clock className="w-3 h-3" /> Due: {act.due_date}
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
        <form onSubmit={handleAddCustomTask} className="pt-2 flex gap-2">
          <input
            type="text"
            value={newActionTitle}
            onChange={(e) => setNewActionTitle(e.target.value)}
            placeholder={t("taskPlaceholder")}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-400"
            disabled={isAddingAction}
          />
          <button
            type="submit"
            disabled={!newActionTitle.trim() || isAddingAction}
            className="tap-target px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs">Add</span>
          </button>
        </form>
      </div>

      {/* Safety Note */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <p>
          Always confirm consequential instructions and deadlines directly with the issuing department or service office.
        </p>
      </div>
    </div>
  );
};
