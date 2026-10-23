import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { DocumentAnalysisResponse, PaymentReceipt, api } from "../lib/api";
import { extractPaymentDetails, PaymentDetails } from "../lib/payment";
import { BigButton } from "./BigButton";
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  Zap,
  CheckCircle2,
  Printer,
  X,
  Volume2,
  VolumeX,
  Lock,
  Calendar,
  Clock,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Receipt,
  AlertCircle,
  Smartphone,
} from "lucide-react";

interface PaymentGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentAnalysisResponse;
  onPaymentSuccess?: (receipt: PaymentReceipt) => void;
  initialReceipt?: PaymentReceipt | null;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  isOpen,
  onClose,
  document,
  onPaymentSuccess,
  initialReceipt = null,
}) => {
  const { t, language } = useLanguage();
  const paymentDetails: PaymentDetails = extractPaymentDetails(document);

  const [selectedMethod, setSelectedMethod] = useState<"upi" | "card" | "netbanking" | "one_tap">("upi");
  const [upiId, setUpiId] = useState<string>("elder.citizen@oksbi");
  const [selectedBank, setSelectedBank] = useState<string>("SBI");
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  // Flow states: review -> processing -> receipt
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<number>(1);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(initialReceipt);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    if (initialReceipt) {
      setReceipt(initialReceipt);
    }
  }, [initialReceipt]);

  // Audio summary for elderly users
  const handleToggleSpeech = () => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let speechText = "";
    if (language === "hi") {
      speechText = `${paymentDetails.billerName} के लिए कुल देय राशि ${paymentDetails.formattedTotalPayable} है। भुगतान की अंतिम तिथि ${paymentDetails.dueDate} है। यह भारत बिलपे का सुरक्षित सिमुलेशन है।`;
    } else if (language === "bn") {
      speechText = `${paymentDetails.billerName}-এর জন্য মোট প্রদেয় টাকা ${paymentDetails.formattedTotalPayable}। টাকা জমা দেওয়ার শেষ তারিখ ${paymentDetails.dueDate}। এটি ভারত বিলপে-এর নিরাপদ সিমুলেশন।`;
    } else {
      speechText = `Payment review for ${paymentDetails.billerName}. Total amount payable is ${paymentDetails.formattedTotalPayable}, due on ${paymentDetails.dueDate}. This is a secure Bharat BillPay simulation.`;
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = language === "hi" ? "hi-IN" : language === "bn" ? "bn-IN" : "en-IN";
    utterance.rate = 0.9; // Slightly slower, calm cadence for elders

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Stop speaking when modal closes
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isOpen) return null;

  const handlePayNow = async () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsProcessing(true);
    setProcessingStep(1);

    // Simulated 3-stage banking handshake
    setTimeout(() => {
      setProcessingStep(2);
    }, 900);

    setTimeout(() => {
      setProcessingStep(3);
    }, 1800);

    setTimeout(async () => {
      try {
        const res = await api.simulatePayment({
          document_id: paymentDetails.documentId,
          amount: paymentDetails.totalPayable,
          currency: "INR",
          biller_name: paymentDetails.billerName,
          consumer_id: paymentDetails.consumerId,
          consumer_name: paymentDetails.consumerName,
          payment_method: selectedMethod,
          due_date: paymentDetails.dueDate,
          period_or_description: paymentDetails.periodOrDescription,
          breakdown_items: paymentDetails.breakdownItems.map((b) => ({
            label: b.label,
            amount: b.amount,
            formatted_amount: b.formattedAmount,
          })),
        });

        setReceipt(res);
        if (onPaymentSuccess) {
          onPaymentSuccess(res);
        }
      } catch (e: any) {
        console.error("Payment error:", e);
        // Fallback local receipt if API fails
        const fallbackReceipt: PaymentReceipt = {
          payment_id: "pay_sim_" + Date.now().toString(36),
          transaction_id: "BBPS-2026-TXN-" + Math.floor(10000000 + Math.random() * 90000000),
          biller_reference: "REF-" + Math.floor(100000 + Math.random() * 900000),
          document_id: paymentDetails.documentId,
          amount: paymentDetails.totalPayable,
          currency: "INR",
          biller_name: paymentDetails.billerName,
          consumer_id: paymentDetails.consumerId,
          consumer_name: paymentDetails.consumerName,
          payment_method: selectedMethod,
          status: "success",
          paid_at: new Date().toISOString(),
          due_date: paymentDetails.dueDate,
          period_or_description: paymentDetails.periodOrDescription,
          gateway_note: "Authorized by Bharat BillPay (BBPS) Simulation Switch",
        };
        setReceipt(fallbackReceipt);
        if (onPaymentSuccess) onPaymentSuccess(fallbackReceipt);
      } finally {
        setIsProcessing(false);
      }
    }, 2600);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md overflow-y-auto"
    >
      <div className="w-full max-w-xl bg-slate-900 border-2 border-emerald-500/80 rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top BBPS & NPCI Trust Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-4 sm:p-5 border-b-2 border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shadow-inner shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700/60">
                  BBPS • NPCI
                </span>
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> 256-Bit SSL
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5">
                {t("paymentGatewayTitle")}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Assistance Button for Elders */}
            <button
              type="button"
              onClick={handleToggleSpeech}
              title={isSpeaking ? "Stop voice assistant" : "Listen to payment summary"}
              className={`tap-target w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                isSpeaking
                  ? "bg-emerald-600 text-white border-emerald-400 animate-pulse"
                  : "bg-slate-800 text-slate-300 hover:text-white border-slate-700"
              }`}
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="tap-target w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Either Processing, Receipt, or Review/Pay */}
        <div className="p-4 sm:p-6 space-y-5">
          {isProcessing ? (
            /* PROCESSING STATE */
            <div className="py-12 px-4 text-center space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 animate-ping" />
                <div className="w-20 h-20 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin flex items-center justify-center bg-slate-900 shadow-xl" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Lock className="w-8 h-8 text-emerald-400" />
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white leading-tight">
                  {t("processingTitle")}
                </h4>
                <p className="text-base text-slate-300 font-medium">
                  {processingStep === 1 && t("stepConnecting")}
                  {processingStep === 2 && t("stepVerifying")}
                  {processingStep === 3 && t("stepAuthorizing")}
                </p>
              </div>

              {/* Step indicator pills */}
              <div className="flex justify-center gap-2 max-w-xs mx-auto">
                <div
                  className={`h-2 flex-1 rounded-full transition-all ${
                    processingStep >= 1 ? "bg-emerald-500" : "bg-slate-800"
                  }`}
                />
                <div
                  className={`h-2 flex-1 rounded-full transition-all ${
                    processingStep >= 2 ? "bg-emerald-500" : "bg-slate-800"
                  }`}
                />
                <div
                  className={`h-2 flex-1 rounded-full transition-all ${
                    processingStep >= 3 ? "bg-emerald-500" : "bg-slate-800"
                  }`}
                />
              </div>

              <p className="text-xs text-slate-400 font-bold">
                RBI / BBPS Authorized • Simulation Gateway
              </p>
            </div>
          ) : receipt ? (
            /* OFFICIAL DIGITAL RECEIPT SCREEN */
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Success Badge */}
              <div className="p-5 rounded-3xl bg-emerald-950/80 border-2 border-emerald-500/80 text-center space-y-2 shadow-xl">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {t("paymentSuccessTitle")}
                </h4>
                <p className="text-sm sm:text-base text-emerald-200 font-medium max-w-md mx-auto leading-relaxed">
                  {t("paymentSuccessSubtitle")}
                </p>
              </div>

              {/* Printable Official Receipt Card */}
              <div
                id="payment-receipt-print-area"
                className="p-5 sm:p-6 rounded-3xl bg-slate-950 border-2 border-slate-700 space-y-4 shadow-2xl relative"
              >
                {/* Watermark style badge */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">
                      BHARAT BILLPAY RECEIPT
                    </span>
                    <span className="text-lg font-black text-white">{receipt.biller_name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full border border-emerald-700/60">
                    PAID / SUCCESS
                  </span>
                </div>

                {/* Amount Paid - Extra large for elders */}
                <div className="py-2 text-center bg-slate-900/90 rounded-2xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Amount Paid
                  </span>
                  <span className="text-4xl sm:text-5xl font-black text-emerald-400 tracking-tight">
                    ₹{receipt.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Receipt Details Table */}
                <div className="space-y-2.5 text-sm sm:text-base">
                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">{t("transactionReference")}:</span>
                    <span className="font-mono font-bold text-white text-right select-all">
                      {receipt.transaction_id}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">{t("billerAckReference")}:</span>
                    <span className="font-mono font-bold text-white text-right">
                      {receipt.biller_reference}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">{t("consumerNumber")}:</span>
                    <span className="font-bold text-white text-right">{receipt.consumer_id}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                    <span className="text-slate-400">{t("paidVia")}:</span>
                    <span className="font-bold text-white text-right uppercase">
                      {receipt.payment_method === "upi"
                        ? "UPI Instant Pay"
                        : receipt.payment_method === "card"
                        ? "RuPay Debit Card"
                        : receipt.payment_method === "netbanking"
                        ? "Net Banking (SBI)"
                        : "Senior 1-Tap Quick Pay"}
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">{t("paymentDate")}:</span>
                    <span className="font-mono text-slate-200 text-right">
                      {new Date(receipt.paid_at).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Simulation note footer */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Simulated transaction recorded in your local ProofSathi history. No real bank debits made.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <BigButton
                  variant="secondary"
                  size="md"
                  icon={<Printer className="w-5 h-5 text-sky-400" />}
                  onClick={handlePrintReceipt}
                  className="w-full"
                >
                  {t("printReceipt")}
                </BigButton>

                <BigButton
                  variant="primary"
                  size="md"
                  onClick={onClose}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 border-emerald-400/50"
                >
                  {t("backToBill")}
                </BigButton>
              </div>
            </div>
          ) : (
            /* STEP 1 & 2: REVIEW & SELECT PAYMENT METHOD */
            <div className="space-y-5">
              {/* Verified Pre-filled Notification Banner */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-between text-xs sm:text-sm text-emerald-200">
                <div className="flex items-center gap-2.5 font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{t("prefilledNotice")}</span>
                </div>
                <span className="bg-emerald-900/80 px-2.5 py-0.5 rounded-full font-mono text-xs text-emerald-300 font-bold border border-emerald-600/50">
                  100% Accurate
                </span>
              </div>

              {/* Pre-filled Bill Overview Card */}
              <div className="p-5 rounded-3xl bg-slate-950 border-2 border-slate-700/80 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 block mb-0.5">
                      {paymentDetails.billerCategory}
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {paymentDetails.billerName}
                    </h4>
                    <span className="text-xs sm:text-sm text-slate-300 font-mono font-medium block mt-1">
                      {t("consumerNumber")}: <span className="font-bold text-white">{paymentDetails.consumerId}</span>
                    </span>
                  </div>

                  {/* Due Date Status Badge */}
                  <div className="flex flex-col items-end">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700">
                      <Calendar className="w-3.5 h-3.5" />
                      Due: {paymentDetails.dueDate}
                    </span>
                    {paymentDetails.dueDateDaysRemaining !== null && (
                      <span className="text-xs text-slate-400 mt-1 font-medium">
                        {paymentDetails.dueDateDaysRemaining > 0
                          ? `${paymentDetails.dueDateDaysRemaining} days remaining`
                          : "Pay promptly"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Big Total Payable Amount for Elders */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-300 block">
                      {t("paymentDue")}
                    </span>
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-none text-emerald-400 block mt-1">
                      {paymentDetails.formattedTotalPayable}
                    </span>
                  </div>

                  {/* Toggle Itemized Breakdown */}
                  <button
                    type="button"
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="tap-target px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-colors"
                  >
                    <span>Itemized Breakdown</span>
                    {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Collapsible Itemized Breakdown */}
                {showBreakdown && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-sm animate-in fade-in duration-150">
                    {paymentDetails.breakdownItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-1 text-slate-300">
                        <span>{item.label}</span>
                        <span className="font-bold text-white">{item.formattedAmount}</span>
                      </div>
                    ))}

                    <div className="flex justify-between py-1 text-emerald-300 border-t border-slate-800/60 pt-2 font-medium">
                      <span>{t("convenienceFee")} (BBPS)</span>
                      <span className="font-bold">{t("seniorCitizenDiscount")}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Methods Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                    <span>{t("selectPaymentMethod")}</span>
                  </h5>
                  <span className="text-xs text-slate-400 font-medium">Safe 1-Tap Select</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Method 1: UPI / QR Code */}
                  <div
                    onClick={() => setSelectedMethod("upi")}
                    className={`tap-target p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 shadow-md ${
                      selectedMethod === "upi"
                        ? "bg-indigo-950/70 border-indigo-500 text-white shadow-indigo-950/50"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-extrabold text-white block">
                          {t("methodUpi")}
                        </span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedMethod === "upi"}
                          onChange={() => setSelectedMethod("upi")}
                          className="w-4 h-4 text-indigo-600 cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-medium block mt-0.5">
                        {t("methodUpiDesc")}
                      </span>
                    </div>
                  </div>

                  {/* Method 2: Senior Citizen Debit Card */}
                  <div
                    onClick={() => setSelectedMethod("card")}
                    className={`tap-target p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 shadow-md ${
                      selectedMethod === "card"
                        ? "bg-indigo-950/70 border-indigo-500 text-white shadow-indigo-950/50"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-extrabold text-white block">
                          {t("methodCard")}
                        </span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedMethod === "card"}
                          onChange={() => setSelectedMethod("card")}
                          className="w-4 h-4 text-indigo-600 cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-medium block mt-0.5">
                        {t("methodCardDesc")}
                      </span>
                    </div>
                  </div>

                  {/* Method 3: Net Banking */}
                  <div
                    onClick={() => setSelectedMethod("netbanking")}
                    className={`tap-target p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 shadow-md ${
                      selectedMethod === "netbanking"
                        ? "bg-indigo-950/70 border-indigo-500 text-white shadow-indigo-950/50"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-extrabold text-white block">
                          {t("methodNetBanking")}
                        </span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedMethod === "netbanking"}
                          onChange={() => setSelectedMethod("netbanking")}
                          className="w-4 h-4 text-indigo-600 cursor-pointer accent-indigo-500"
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-medium block mt-0.5">
                        {t("methodNetBankingDesc")}
                      </span>
                    </div>
                  </div>

                  {/* Method 4: Senior 1-Tap Quick Pay */}
                  <div
                    onClick={() => setSelectedMethod("one_tap")}
                    className={`tap-target p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 shadow-md ${
                      selectedMethod === "one_tap"
                        ? "bg-emerald-950/70 border-emerald-500 text-white shadow-emerald-950/50"
                        : "bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-base font-extrabold text-white block">
                          {t("methodOneTap")}
                        </span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={selectedMethod === "one_tap"}
                          onChange={() => setSelectedMethod("one_tap")}
                          className="w-4 h-4 text-emerald-500 cursor-pointer accent-emerald-500"
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-medium block mt-0.5">
                        {t("methodOneTapDesc")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Configuration per method */}
                {selectedMethod === "upi" && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300">UPI Virtual Payment Address</span>
                      <button
                        type="button"
                        onClick={() => setShowQrCode(!showQrCode)}
                        className="text-sky-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{showQrCode ? "Hide QR Code" : "Show QR Code"}</span>
                      </button>
                    </div>

                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-indigo-400"
                      placeholder="username@bank"
                    />

                    {showQrCode && (
                      <div className="p-4 bg-white rounded-2xl text-center space-y-2 max-w-[220px] mx-auto shadow-xl">
                        <div className="w-36 h-36 mx-auto bg-slate-900 rounded-xl p-2.5 flex items-center justify-center">
                          <QrCode className="w-28 h-28 text-white" />
                        </div>
                        <span className="text-xs font-black text-slate-900 block font-mono">
                          SCAN TO PAY {paymentDetails.formattedTotalPayable}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {selectedMethod === "card" && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                      <span>RuPay Senior Citizen Debit Card (Pre-filled)</span>
                      <span className="text-emerald-400">Verified</span>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-xl border border-slate-700 text-white font-mono space-y-2">
                      <div className="text-xs text-amber-400 font-bold">RuPay PLATINUM</div>
                      <div className="text-lg tracking-widest font-black">•••• •••• •••• 5678</div>
                      <div className="flex justify-between text-xs text-slate-300 font-sans">
                        <span>CARDHOLDER: DEMO SENIOR</span>
                        <span className="font-mono">EXP: 08/29</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === "netbanking" && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">Select Primary Bank</span>
                    <div className="grid grid-cols-2 gap-2">
                      {["SBI", "HDFC Bank", "ICICI Bank", "Punjab National Bank"].map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`p-2.5 rounded-xl text-sm font-bold border text-left cursor-pointer transition-all ${
                            selectedBank === bank
                              ? "bg-sky-950 border-sky-400 text-white"
                              : "bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* The Big Pay Button */}
              <div className="space-y-2 pt-2">
                <BigButton
                  variant="success"
                  size="lg"
                  icon={<Lock className="w-6 h-6" />}
                  onClick={handlePayNow}
                  className="w-full text-xl py-4.5 bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400/60 shadow-xl shadow-emerald-950/60 cursor-pointer"
                >
                  {t("payNowButton")} ({paymentDetails.formattedTotalPayable})
                </BigButton>

                <p className="text-center text-xs text-slate-400 font-medium">
                  {t("simulationNote")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
