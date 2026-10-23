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

  return (
    <div className="bg-slate-800/80 border-2 border-indigo-500/40 rounded-2xl p-4 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <Volume2 className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-lg font-bold text-white flex items-center gap-2">
              {isPlaying ? t("playing") : t("listen")}
              {isPlaying && (
                <span className="flex items-end gap-1 h-5 px-1 pb-0.5">
                  <span className="w-1 bg-sky-400 rounded-full animate-soundwave-1" />
                  <span className="w-1 bg-indigo-400 rounded-full animate-soundwave-2" />
                  <span className="w-1 bg-sky-300 rounded-full animate-soundwave-3" />
                  <span className="w-1 bg-indigo-300 rounded-full animate-soundwave-4" />
                </span>
              )}
            </span>
            <span className="block text-xs text-slate-400">
              Spoken explanation in {language.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              disabled={isLoading}
              className="tap-target px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-all"
              aria-label={t("listen")}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
              <span>{t("listen")}</span>
            </button>
          ) : (
            <>
              <button
                onClick={handlePause}
                className="tap-target px-4 py-2 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-medium rounded-xl flex items-center gap-1.5 transition-all"
                aria-label={t("pause")}
              >
                <Pause className="w-5 h-5" />
                <span>{t("pause")}</span>
              </button>
              <button
                onClick={handleStop}
                className="tap-target px-4 py-2 bg-rose-700/80 hover:bg-rose-600 active:scale-95 text-white font-medium rounded-xl flex items-center gap-1.5 transition-all"
                aria-label={t("stopAudio")}
              >
                <Square className="w-4 h-4 fill-current" />
                <span>{t("stopAudio")}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 text-amber-300 bg-amber-950/40 border border-amber-800/50 p-2.5 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
