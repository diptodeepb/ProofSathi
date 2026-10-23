import React, { useRef, useState, useEffect, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import { BigButton } from "./BigButton";
import {
  Camera,
  Upload,
  RefreshCw,
  Check,
  ShieldAlert,
  SwitchCamera,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface DocumentCaptureProps {
  onCapture: (file: File) => void;
  isLoading?: boolean;
}

export const DocumentCapture: React.FC<DocumentCaptureProps> = ({ onCapture, isLoading = false }) => {
  const { t } = useLanguage();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live Camera / Webcam State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Cleanup media tracks on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [stopCameraStream, previewUrl]);

  // Start webcam / camera with requested facingMode
  const startCamera = async (mode: "environment" | "user" = facingMode) => {
    setErrorMsg(null);
    setIsCameraLoading(true);

    // Stop any existing stream before requesting new one
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg(t("cameraPermissionError"));
      setIsCameraLoading(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraActive(true);

      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("Camera access failed or denied:", err);
      setErrorMsg(t("cameraPermissionError"));
      setIsCameraActive(false);
      stopCameraStream();
    } finally {
      setIsCameraLoading(false);
    }
  };

  // Re-attach video stream if element becomes available after state change
  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isCameraActive]);

  // Flip camera (environment <-> user)
  const handleToggleCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture current frame from live webcam video
  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    const canvas = document.createElement("canvas");
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw full-resolution current video frame
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `scan_${Date.now()}.jpg`, { type: "image/jpeg" });
        setSelectedFile(file);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);

        // Turn off camera once photo is snapped
        stopCameraStream();
        setIsCameraActive(false);
      },
      "image/jpeg",
      0.92
    );
  };

  // Close camera viewfinder without capturing
  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraActive(false);
    setIsCameraLoading(false);
  };

  // Handle traditional file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorMsg("Please upload a JPEG, PNG, or WebP photo.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg("The photo is larger than 8 MB. Please choose a smaller file.");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setErrorMsg(null);
    // Re-open camera directly for rapid retake
    startCamera(facingMode);
  };

  const handleConfirm = () => {
    if (selectedFile) {
      onCapture(selectedFile);
    }
  };

  return (
    <div className="w-full">
      {/* Hidden file input for file upload fallback */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload document file"
      />

      {/* 1. Live Camera / Viewfinder Mode */}
      {isCameraActive ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="relative rounded-3xl overflow-hidden border-2 border-sky-500 bg-black aspect-[3/4] max-h-[520px] flex items-center justify-center shadow-2xl">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Document Reticle / Viewfinder Corner Brackets */}
            <div className="viewfinder-corner-tl" />
            <div className="viewfinder-corner-tr" />
            <div className="viewfinder-corner-bl" />
            <div className="viewfinder-corner-br" />

            {/* Framing Guide Header Overlay */}
            <div className="absolute top-4 left-4 right-4 bg-slate-950/75 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-center pointer-events-none">
              <span className="text-xs text-sky-300 font-semibold tracking-wide">
                Align document corners inside the frame
              </span>
            </div>

            {/* Camera Floating Controls: Flip Camera & Cancel */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              <button
                type="button"
                onClick={handleToggleCamera}
                className="tap-target w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-md backdrop-blur-md active:scale-95 transition-transform"
                title={t("flipCamera")}
                aria-label={t("flipCamera")}
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleCloseCamera}
                className="tap-target w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-md backdrop-blur-md active:scale-95 transition-transform"
                title={t("cancelCamera")}
                aria-label={t("cancelCamera")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bottom Shutter Controls Bar */}
            <div className="absolute bottom-5 inset-x-0 flex items-center justify-center gap-6 z-10">
              <button
                type="button"
                onClick={handleCaptureFrame}
                className="w-20 h-20 rounded-full bg-white/20 p-1.5 backdrop-blur-md border-2 border-white/50 active:scale-90 transition-transform shadow-2xl flex items-center justify-center group cursor-pointer"
                aria-label={t("captureShutter")}
              >
                <div className="w-full h-full rounded-full bg-white group-hover:bg-slate-100 flex items-center justify-center shadow-inner">
                  <Camera className="w-7 h-7 text-indigo-900" />
                </div>
              </button>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleCloseCamera}
              className="text-sm font-semibold text-slate-400 hover:text-white py-2 tap-target"
            >
              {t("cancelCamera")}
            </button>
          </div>
        </div>
      ) : !previewUrl ? (
        /* 2. Standby / Framing Guidance Mode */
        <div className="space-y-4">
          {/* Framing Guide Box */}
          <div className="border-2 border-dashed border-sky-500/50 bg-sky-950/20 rounded-3xl p-6 text-center relative overflow-hidden">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
                <Camera className="w-8 h-8" />
              </div>
            </div>

            <p className="text-base sm:text-lg font-medium text-slate-200 mb-2">
              {t("framingGuide")}
            </p>
            <span className="text-xs text-sky-300 font-mono block">
              Supported formats: Live Camera, JPG, PNG, WebP (Max 8 MB)
            </span>
          </div>

          {/* Action Buttons: Live Camera & File Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <BigButton
              variant="primary"
              size="lg"
              icon={
                isCameraLoading ? (
                  <Loader2 className="w-7 h-7 animate-spin" />
                ) : (
                  <Camera className="w-7 h-7" />
                )
              }
              onClick={() => startCamera("environment")}
              disabled={isCameraLoading}
            >
              {isCameraLoading ? t("cameraStarting") : t("takePhoto")}
            </BigButton>

            <BigButton
              variant="secondary"
              size="lg"
              icon={<Upload className="w-7 h-7" />}
              onClick={() => fileInputRef.current?.click()}
            >
              {t("chooseFile")}
            </BigButton>
          </div>

          {/* Privacy Note */}
          <div className="flex items-start gap-3 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-slate-400">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{t("uploadPrivacy")}</p>
          </div>
        </div>
      ) : (
        /* 3. Preview & Confirmation State */
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="relative rounded-3xl overflow-hidden border-2 border-indigo-500/60 bg-black max-h-[460px] flex items-center justify-center shadow-xl">
            <img
              src={previewUrl}
              alt="Document preview"
              className="max-h-[460px] w-auto object-contain"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <BigButton
              variant="outline"
              size="lg"
              icon={<RefreshCw className="w-6 h-6" />}
              onClick={handleRetake}
              disabled={isLoading}
            >
              {t("retake")}
            </BigButton>

            <BigButton
              variant="success"
              size="lg"
              icon={<Check className="w-6 h-6" />}
              onClick={handleConfirm}
              loading={isLoading}
            >
              {t("confirmUpload")}
            </BigButton>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 p-4 bg-rose-950/60 border border-rose-800/60 text-rose-200 rounded-2xl text-sm font-medium flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p>{errorMsg}</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-sky-400 underline font-semibold cursor-pointer"
            >
              {t("chooseFile")} instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
