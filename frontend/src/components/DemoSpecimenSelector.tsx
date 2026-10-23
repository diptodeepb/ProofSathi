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
    if (isBlurry) return <AlertCircle className="w-5 h-5 text-amber-400" />;
    if (type.includes("electricity") || type.includes("bill")) return <Zap className="w-5 h-5 text-sky-400" />;
    if (type.includes("hospital")) return <HeartPulse className="w-5 h-5 text-rose-400" />;
    return <FileText className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
      <div className="flex items-center gap-2.5">
        <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
        <h4 className="text-base sm:text-lg font-bold text-white">
          {t("demoSpecimens")}
        </h4>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fixtures.map((f) => (
          <button
            key={f.id}
            onClick={() => handlePick(f)}
            disabled={loadingId !== null}
            className="tap-target p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 active:scale-[0.98] border border-slate-700 text-left transition-all flex items-start gap-3 disabled:opacity-50"
          >
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-700 shrink-0 mt-0.5">
              {loadingId === f.id ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
              ) : (
                getIcon(f.document_type, f.is_blurry)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white truncate">
                {f.title}
              </span>
              <span className="block text-xs text-slate-400 line-clamp-2 mt-0.5">
                {f.description}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
