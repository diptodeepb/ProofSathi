import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { api } from "../lib/api";
import { Volume2, Pause, Square, AlertCircle, Loader2 } from "lucide-react";

interface AudioPlayerProps {
  textToSpeak: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ textToSpeak }) => {
  const { language, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Cleanup on unmount or text change
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [textToSpeak]);

  const handlePlay = async () => {
    setError(null);

    // If audio element already exists and is paused, resume
    if (audioRef.current && audioRef.current.paused) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      } catch (e) {
        // Continue to re-fetch if failed
      }
    }

    setIsLoading(true);
    try {
      const audioBlob = await api.synthesizeSpeech(textToSpeak, language);
      const url = URL.createObjectURL(audioBlob);
      audioUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setError(t("audioUnavailable"));
      };

      await audio.play();
      setIsPlaying(true);
    } catch (err: any) {
      setError(err?.message || t("audioUnavailable"));
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const languageDisplayName =
    language === "hi" ? "हिंदी" : language === "bn" ? "বাংলা" : "English";

  return (
    <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-5 shadow-xl space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border-2 border-amber-500/40 flex items-center justify-center shrink-0 shadow-inner">
            <Volume2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-extrabold text-white">
                {isPlaying ? t("playing") : t("listen")}
              </span>
              {isPlaying && (
                <span className="flex items-end gap-1 h-5 px-1.5 pb-0.5" aria-hidden="true">
                  <span className="w-1.5 bg-amber-400 rounded-full animate-soundwave-1" />
                  <span className="w-1.5 bg-amber-300 rounded-full animate-soundwave-2" />
                  <span className="w-1.5 bg-amber-400 rounded-full animate-soundwave-3" />
                  <span className="w-1.5 bg-amber-300 rounded-full animate-soundwave-4" />
                </span>
              )}
            </div>
            <span className="block text-sm text-slate-300 font-medium">
              Spoken explanation in <strong className="text-amber-300">{languageDisplayName}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {!isPlaying ? (
            <button
              type="button"
              onClick={handlePlay}
              disabled={isLoading}
              className="tap-target px-6 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-base sm:text-lg rounded-2xl flex items-center gap-2.5 shadow-lg border-2 border-amber-300/60 transition-all cursor-pointer disabled:opacity-50"
              aria-label={`${t("listen")} in ${languageDisplayName}`}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
              ) : (
                <Volume2 className="w-6 h-6 text-slate-950" />
              )}
              <span>{t("listen")}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePause}
                className="tap-target px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-base rounded-2xl border-2 border-slate-600 flex items-center gap-2 transition-all cursor-pointer"
                aria-label={t("pause")}
              >
                <Pause className="w-5 h-5 text-amber-300" />
                <span>{t("pause")}</span>
              </button>
              <button
                type="button"
                onClick={handleStop}
                className="tap-target px-5 py-2.5 bg-rose-900/80 hover:bg-rose-800 active:scale-95 text-white font-bold text-base rounded-2xl border-2 border-rose-600/70 flex items-center gap-2 transition-all cursor-pointer"
                aria-label={t("stopAudio")}
              >
                <Square className="w-4 h-4 fill-current text-rose-300" />
                <span>{t("stopAudio")}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-amber-950/70 border-2 border-amber-700/80 rounded-2xl text-sm font-medium text-amber-200 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
