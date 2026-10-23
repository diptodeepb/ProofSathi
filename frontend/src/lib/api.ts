/** Client API client with session management. */
import type { AppLanguage } from "../i18n/messages";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

function getSessionId(): string {
  let sid = localStorage.getItem("proofsathi_session_id");
  if (!sid) {
    sid = "sess_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem("proofsathi_session_id", sid);
  }
  return sid;
}

export interface DocumentField {
  key: string;
  label: string;
  value: string;
  normalized_value?: any;
  unit?: string | null;
  source_text: string;
  extraction_status: "high" | "medium" | "low";
  needs_confirmation: boolean;
}

export interface DocumentAnalysisResponse {
  document_id: string;
  workflow: "bill" | "document";
  document_type: string;
  language: AppLanguage;
  summary: string;
  fields: DocumentField[];
  warnings: string[];
  actions: any[];
  created_at: string;
}

export interface AmountComparison {
  previous: number | null;
  current: number | null;
  difference: number | null;
  percentage_change: number | null;
  status: string;
  currency: string;
}

export interface ConsumptionComparison {
  previous: number | null;
  current: number | null;
  difference: number | null;
  unit: string | null;
  status: string;
  comparable: boolean;
  warnings: string[];
}

export interface DueDateComparison {
  previous: string | null;
  current: string | null;
  status: string;
}

export interface LineItemDiff {
  label: string;
  current_amount: number | null;
  previous_amount: number | null;
  status: string;
}

export interface BillComparisonResponse {
  comparison_id: string;
  current_document_id: string;
  previous_document_id: string;
  amount: AmountComparison;
  consumption: ConsumptionComparison;
  due_date: DueDateComparison;
  line_item_diffs: LineItemDiff[];
  interpretation: string;
  warnings: string[];
  created_at: string;
}

export interface ActionItem {
  id: string;
  document_id?: string;
  title: string;
  description?: string;
  due_date?: string | null;
  status: "pending" | "completed" | "needs_confirmation";
  source_text: string;
  needs_confirmation: boolean;
  created_at: string;
  updated_at: string;
}

export interface DemoFixture {
  id: string;
  title: string;
  workflow: "bill" | "document";
  document_type: string;
  description: string;
  image_url: string;
  is_blurry: boolean;
}

export interface DocumentListItem {
  id: string;
  workflow: "bill" | "document";
  document_type: string;
  language: AppLanguage;
  summary: string;
  created_at: string;
  field_count: number;
  warnings: string[];
}

export interface PaymentReceipt {
  payment_id: string;
  transaction_id: string;
  biller_reference: string;
  document_id: string;
  amount: number;
  currency: string;
  biller_name: string;
  consumer_id: string;
  consumer_name: string;
  payment_method: string;
  status: string;
  paid_at: string;
  due_date?: string | null;
  period_or_description?: string | null;
  gateway_note?: string;
}

export interface SimulatePaymentPayload {
  document_id: string;
  amount: number;
  currency?: string;
  biller_name: string;
  consumer_id: string;
  consumer_name?: string;
  payment_method: string;
  due_date?: string | null;
  period_or_description?: string | null;
  breakdown_items?: Array<{ label: string; amount: number; formatted_amount?: string }>;
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const sid = getSessionId();
  const headers = new Headers(options.headers || {});
  headers.set("X-Session-ID", sid);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errJson;
    try {
      errJson = await res.json();
    } catch {
      errJson = { error: { message: `Request failed with status ${res.status}` } };
    }
    const msg =
      errJson?.detail?.message ||
      errJson?.error?.message ||
      (typeof errJson?.detail === "string" ? errJson.detail : null) ||
      `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  // Handle binary responses (like audio)
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("audio/") || contentType.includes("image/")) {
    return res.blob();
  }

  return res.json();
}

export const api = {
  async getPreferences(): Promise<{ language: AppLanguage }> {
    return request("/preferences");
  },

  async setPreferences(language: AppLanguage): Promise<{ language: AppLanguage }> {
    return request("/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    });
  },

  async analyzeDocument(
    file: File | Blob,
    workflow: "bill" | "document",
    language: AppLanguage
  ): Promise<DocumentAnalysisResponse> {
    const formData = new FormData();
    formData.append("file", file, (file as File).name || "scan.jpg");
    formData.append("workflow", workflow);
    formData.append("language", language);
    formData.append("consent_to_ai_processing", "true");

    return request("/documents/analyze", {
      method: "POST",
      body: formData,
    });
  },

  async compareBills(
    currentDocumentId: string,
    previousDocumentId: string,
    language: AppLanguage
  ): Promise<BillComparisonResponse> {
    return request("/bills/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        current_document_id: currentDocumentId,
        previous_document_id: previousDocumentId,
        language,
      }),
    });
  },

  async listDocuments(workflow?: string): Promise<{ items: DocumentListItem[]; total: number }> {
    const q = workflow ? `?workflow=${workflow}` : "";
    return request(`/documents${q}`);
  },

  async getDocument(documentId: string): Promise<DocumentAnalysisResponse> {
    return request(`/documents/${documentId}`);
  },

  async deleteDocument(documentId: string): Promise<void> {
    return request(`/documents/${documentId}`, { method: "DELETE" });
  },

  async listActions(documentId?: string): Promise<ActionItem[]> {
    const q = documentId ? `?document_id=${documentId}` : "";
    return request(`/actions${q}`);
  },

  async createAction(payload: {
    title: string;
    description?: string;
    due_date?: string;
    document_id?: string;
  }): Promise<ActionItem> {
    return request("/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  async updateAction(actionId: string, patch: Partial<ActionItem>): Promise<ActionItem> {
    return request(`/actions/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  },

  async deleteAction(actionId: string): Promise<void> {
    return request(`/actions/${actionId}`, { method: "DELETE" });
  },

  async synthesizeSpeech(text: string, language: AppLanguage): Promise<Blob> {
    return request("/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language, purpose: "document_summary" }),
    });
  },

  async listDemoFixtures(): Promise<{ fixtures: DemoFixture[] }> {
    return request("/demo/fixtures");
  },

  async getFixtureBlob(fixtureId: string): Promise<Blob> {
    const res = await fetch(`${API_BASE}/demo/fixtures/${fixtureId}/image`);
    if (!res.ok) throw new Error("Could not load fixture image.");
    return res.blob();
  },

  async simulatePayment(payload: SimulatePaymentPayload): Promise<PaymentReceipt> {
    const receipt = await request("/payments/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    try {
      localStorage.setItem(`proofsathi_payment_${payload.document_id}`, JSON.stringify(receipt));
    } catch {}
    return receipt;
  },

  async getPaymentReceipt(documentId: string): Promise<PaymentReceipt | null> {
    try {
      const res = await request(`/payments/${documentId}`);
      if (res && res.payment_id) {
        try {
          localStorage.setItem(`proofsathi_payment_${documentId}`, JSON.stringify(res));
        } catch {}
        return res;
      }
    } catch {}
    const cached = localStorage.getItem(`proofsathi_payment_${documentId}`);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return null;
  },
};
