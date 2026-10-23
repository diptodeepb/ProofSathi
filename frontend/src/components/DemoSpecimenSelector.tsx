import React, { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { api, DemoFixture } from "../lib/api";
import { Sparkles, FileText, Zap, HeartPulse, AlertCircle, Loader2 } from "lucide-react";

interface DemoSpecimenSelectorProps {
  onSelectFixture: (blob: Blob, workflow: "bill" | "document", fixtureTitle: string) => void;
}

export const DemoSpecimenSelector: React.FC<DemoSpecimenSelectorProps> = ({ onSelectFixture }) => {
  const { t } = useLanguage();
  const [fixtures, setFixtures] = useState<DemoFixture[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .listDemoFixtures()
      .then((res) => setFixtures(res.fixtures || []))
      .catch(() => {});
  }, []);

  if (fixtures.length === 0) return null;

  const handlePick = async (fixture: DemoFixture) => {
    setLoadingId(fixture.id);
    try {
      const blob = await api.getFixtureBlob(fixture.id);
      onSelectFixture(blob, fixture.workflow, fixture.title);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingId(null);
    }
  };

  const getIcon = (type: string, isBlurry: boolean) => {
    if (isBlurry) return <AlertCircle className="w-6 h-6 text-amber-400" />;
    if (type.includes("electricity") || type.includes("bill")) return <Zap className="w-6 h-6 text-sky-400" />;
    if (type.includes("hospital")) return <HeartPulse className="w-6 h-6 text-rose-400" />;
    return <FileText className="w-6 h-6 text-indigo-400" />;
  };

  return (
    <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
            {t("demoSpecimens")}
          </h4>
          <span className="text-xs sm:text-sm text-slate-400 font-medium">
            Tap any sample to try without uploading your own document
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {fixtures.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => handlePick(f)}
            disabled={loadingId !== null}
            className="tap-target p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-750 active:scale-[0.98] border-2 border-slate-700 hover:border-sky-500/60 text-left transition-all flex items-start gap-3.5 disabled:opacity-50 cursor-pointer shadow-md"
          >
            <div className="p-2.5 rounded-xl bg-slate-900 border-2 border-slate-700 shrink-0 mt-0.5">
              {loadingId === f.id ? (
                <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
              ) : (
                getIcon(f.document_type, f.is_blurry)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-base font-extrabold text-white leading-snug break-words">
                {f.title}
              </span>
              <span className="block text-sm text-slate-300 leading-relaxed mt-1 break-words font-medium">
                {f.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
