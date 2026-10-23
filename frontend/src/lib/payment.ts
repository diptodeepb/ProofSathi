import { DocumentAnalysisResponse } from "./api";

export interface PaymentBreakdownItem {
  label: string;
  amount: number;
  formattedAmount: string;
}

export interface PaymentDetails {
  documentId: string;
  workflow: "bill" | "document";
  documentType: string;
  billerName: string;
  billerCategory: string;
  consumerId: string;
  consumerName: string;
  amount: number;
  formattedAmount: string;
  dueDate: string;
  dueDateDaysRemaining?: number | null;
  dueDateStatus: "on_time" | "due_soon" | "overdue" | "no_date";
  billingPeriod?: string | null;
  periodOrDescription: string;
  breakdownItems: PaymentBreakdownItem[];
  convenienceFee: number;
  totalPayable: number;
  formattedTotalPayable: string;
  isSimulated: boolean;
  sourceVerified: boolean;
}

function parseCurrencyAmount(rawStr?: string | null): number {
  if (!rawStr) return 0;
  // Strip currency symbols, commas, spaces
  const cleaned = rawStr.replace(/[^0-9.]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

function calculateDaysRemaining(dueDateStr?: string | null): {
  days: number | null;
  status: "on_time" | "due_soon" | "overdue" | "no_date";
} {
  if (!dueDateStr) return { days: null, status: "no_date" };
  try {
    const due = new Date(dueDateStr);
    if (isNaN(due.getTime())) return { days: null, status: "no_date" };
    const now = new Date();
    // Normalize to midnight
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { days: diffDays, status: "overdue" };
    if (diffDays <= 5) return { days: diffDays, status: "due_soon" };
    return { days: diffDays, status: "on_time" };
  } catch {
    return { days: null, status: "no_date" };
  }
}

export function extractPaymentDetails(doc: DocumentAnalysisResponse): PaymentDetails {
  const getField = (key: string) => doc.fields.find((f) => f.key === key);

  if (doc.workflow === "bill") {
    // 1. BILL WORKFLOW (Electricity, Water, Gas, etc.)
    const amountField = getField("amount_due");
    const dueDateField = getField("due_date");
    const periodField = getField("billing_period");
    const providerField = getField("provider_name");
    const consumerIdField = getField("consumer_id");

    let numAmount = 0;
    if (amountField?.normalized_value && typeof amountField.normalized_value === "number") {
      numAmount = amountField.normalized_value;
    } else {
      numAmount = parseCurrencyAmount(amountField?.value) || 1240.0;
    }

    const billerName = providerField?.value || "State Electricity Distribution Co. Ltd.";
    const consumerId = consumerIdField?.value || "****4321";
    const dueDate = dueDateField?.value || "12/11/2026";
    const { days, status } = calculateDaysRemaining(dueDate);

    // Extract line items if present
    const lineItemFields = doc.fields.filter((f) => f.key.startsWith("line_item_"));
    const breakdownItems: PaymentBreakdownItem[] = [];

    if (lineItemFields.length > 0) {
      for (const item of lineItemFields) {
        let val = 0;
        if (typeof item.normalized_value === "number") {
          val = item.normalized_value;
        } else {
          val = parseCurrencyAmount(item.value);
        }
        breakdownItems.push({
          label: item.label,
          amount: val,
          formattedAmount: item.value.startsWith("₹") ? item.value : `₹${val.toFixed(2)}`,
        });
      }
    } else {
      // Default standard utility bill breakdown if not granular
      breakdownItems.push(
        { label: "Energy Charges", amount: numAmount * 0.65, formattedAmount: `₹${(numAmount * 0.65).toFixed(2)}` },
        { label: "Fixed Demand Charges", amount: numAmount * 0.20, formattedAmount: `₹${(numAmount * 0.20).toFixed(2)}` },
        { label: "Electricity Duty & Surcharges", amount: numAmount * 0.15, formattedAmount: `₹${(numAmount * 0.15).toFixed(2)}` }
      );
    }

    return {
      documentId: doc.document_id,
      workflow: "bill",
      documentType: doc.document_type || "electricity_bill",
      billerName,
      billerCategory: "Electricity & Utility",
      consumerId,
      consumerName: "Demo Consumer",
      amount: numAmount,
      formattedAmount: `₹${numAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      dueDate,
      dueDateDaysRemaining: days,
      dueDateStatus: status,
      billingPeriod: periodField?.value || "01 Sep 2026 to 30 Sep 2026",
      periodOrDescription: periodField?.value ? `Billing Period: ${periodField.value}` : "Current Electricity Cycle",
      breakdownItems,
      convenienceFee: 0,
      totalPayable: numAmount,
      formattedTotalPayable: `₹${numAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isSimulated: true,
      sourceVerified: !amountField?.needs_confirmation,
    };
  }

  // 2. DOCUMENT WORKFLOW (Pension notice, Hospital follow-up, Challan, Form notice)
  const isPension =
    doc.document_type.includes("pension") ||
    doc.summary.toLowerCase().includes("pension") ||
    doc.summary.toLowerCase().includes("life certificate");

  const isHospital =
    doc.document_type.includes("hospital") ||
    doc.summary.toLowerCase().includes("hospital") ||
    doc.summary.toLowerCase().includes("patient");

  // Check if any field has an explicit fee or amount
  const feeField = doc.fields.find(
    (f) =>
      f.key.includes("fee") ||
      f.key.includes("amount") ||
      f.key.includes("challan") ||
      f.label.toLowerCase().includes("fee") ||
      f.label.toLowerCase().includes("amount")
  );

  const firstDate = doc.fields.find((f) => f.key.startsWith("important_date_"))?.value || "30/11/2026";
  const { days, status } = calculateDaysRemaining(firstDate);

  if (isPension) {
    const feeAmount = feeField ? parseCurrencyAmount(feeField.value) : 50.0;
    return {
      documentId: doc.document_id,
      workflow: "document",
      documentType: "pension_notice",
      billerName: "Central Pension Disbursing Agency (CPAO)",
      billerCategory: "Pension & Social Security Services",
      consumerId: "PPO Ref: CPAO/VERIF/2026/8941",
      consumerName: "Senior Citizen Pensioner",
      amount: feeAmount,
      formattedAmount: `₹${feeAmount.toFixed(2)}`,
      dueDate: firstDate,
      dueDateDaysRemaining: days,
      dueDateStatus: status,
      billingPeriod: "Financial Year 2026-2027",
      periodOrDescription: "Annual Life Certificate (Jeevan Pramaan) Digital Processing & Verification Fee",
      breakdownItems: [
        { label: "Biometric & Aadhaar Verification Service", amount: 42.37, formattedAmount: "₹42.37" },
        { label: "Central Portal GST (18%)", amount: 7.63, formattedAmount: "₹7.63" },
      ],
      convenienceFee: 0,
      totalPayable: feeAmount,
      formattedTotalPayable: `₹${feeAmount.toFixed(2)}`,
      isSimulated: true,
      sourceVerified: true,
    };
  }

  if (isHospital) {
    const feeAmount = feeField ? parseCurrencyAmount(feeField.value) : 250.0;
    return {
      documentId: doc.document_id,
      workflow: "document",
      documentType: "hospital_document",
      billerName: "City General Hospital — Geriatric Care",
      billerCategory: "Healthcare & Hospital Services",
      consumerId: "OPD Ref: CGH-2026-4B72",
      consumerName: "Demo Elder (Patient 72y)",
      amount: feeAmount,
      formattedAmount: `₹${feeAmount.toFixed(2)}`,
      dueDate: firstDate,
      dueDateDaysRemaining: days,
      dueDateStatus: status,
      billingPeriod: "Outpatient Review Consultation",
      periodOrDescription: "Senior Citizen Follow-up Appointment & Clinical Review Token",
      breakdownItems: [
        { label: "Senior Specialist Consultation (Room 204)", amount: 200.0, formattedAmount: "₹200.00" },
        { label: "Clinical Registration & BP Record Log", amount: 50.0, formattedAmount: "₹50.00" },
      ],
      convenienceFee: 0,
      totalPayable: feeAmount,
      formattedTotalPayable: `₹${feeAmount.toFixed(2)}`,
      isSimulated: true,
      sourceVerified: true,
    };
  }

  // General Notice / Official Document
  const docFee = feeField ? parseCurrencyAmount(feeField.value) : 100.0;
  return {
    documentId: doc.document_id,
    workflow: "document",
    documentType: doc.document_type || "official_notice",
    billerName: "Citizen Services Portal / Municipal Department",
    billerCategory: "Government & Citizen Services",
    consumerId: `REF-${doc.document_id.slice(-6).toUpperCase()}`,
    consumerName: "Applicant / Beneficiary",
    amount: docFee,
    formattedAmount: `₹${docFee.toFixed(2)}`,
    dueDate: firstDate,
    dueDateDaysRemaining: days,
    dueDateStatus: status,
    billingPeriod: "Official Notice Verification",
    periodOrDescription: doc.summary.slice(0, 80) + (doc.summary.length > 80 ? "..." : ""),
    breakdownItems: [
      { label: "Document Processing & Verification Fee", amount: docFee * 0.85, formattedAmount: `₹${(docFee * 0.85).toFixed(2)}` },
      { label: "Statutory Filing Surcharge", amount: docFee * 0.15, formattedAmount: `₹${(docFee * 0.15).toFixed(2)}` },
    ],
    convenienceFee: 0,
    totalPayable: docFee,
    formattedTotalPayable: `₹${docFee.toFixed(2)}`,
    isSimulated: true,
    sourceVerified: true,
  };
}
