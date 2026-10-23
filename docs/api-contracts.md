# ProofSathi — API Contracts (v1)

All endpoints reside under the `/api/v1` prefix. All timestamps are ISO 8601 UTC strings.

## 1. Health
`GET /api/v1/health`

### Response
```json
{
  "status": "ok",
  "service": "proofsathi-api",
  "version": "0.1.0"
}
```

---

## 2. Preferences
`GET /api/v1/preferences`  
`PUT /api/v1/preferences`

Headers: `X-Session-ID: sess_...`

### Request Body (`PUT`)
```json
{
  "language": "bn"
}
```

### Response
```json
{
  "language": "bn",
  "updated_at": "2026-10-23T10:00:00Z"
}
```

---

## 3. Documents Analysis
`POST /api/v1/documents/analyze`

Content-Type: `multipart/form-data`  
Headers: `X-Session-ID: sess_...`

### Form Fields
- `file`: JPEG, PNG, or WebP image (max 8 MB)
- `workflow`: `bill` or `document`
- `language`: `en`, `hi`, or `bn`
- `consent_to_ai_processing`: `true`

### Response
```json
{
  "document_id": "doc_a1b2c3d4",
  "workflow": "bill",
  "document_type": "electricity_bill",
  "language": "en",
  "summary": "The electricity bill shows a total amount due of ₹1,240 payable by 12 November 2026.",
  "fields": [
    {
      "key": "amount_due",
      "label": "Amount Due",
      "value": "₹1,240.00",
      "normalized_value": 1240.0,
      "unit": "INR",
      "source_text": "Total Amount Payable: ₹1,240.00",
      "extraction_status": "high",
      "needs_confirmation": false
    }
  ],
  "warnings": [],
  "actions": [],
  "created_at": "2026-10-23T10:00:00Z"
}
```

---

## 4. Bill Comparison
`POST /api/v1/bills/compare`

Headers: `X-Session-ID: sess_...`

### Request Body
```json
{
  "current_document_id": "doc_curr_123",
  "previous_document_id": "doc_prev_456",
  "language": "bn"
}
```

### Response
```json
{
  "comparison_id": "comp_789abc",
  "current_document_id": "doc_curr_123",
  "previous_document_id": "doc_prev_456",
  "amount": {
    "previous": 980.0,
    "current": 1240.0,
    "difference": 260.0,
    "percentage_change": 26.53,
    "status": "increased",
    "currency": "INR"
  },
  "consumption": {
    "previous": 180.0,
    "current": 205.0,
    "difference": 25.0,
    "unit": "kWh",
    "status": "increased",
    "comparable": true,
    "warnings": []
  },
  "due_date": {
    "previous": "2026-10-12",
    "current": "2026-11-12",
    "status": "changed"
  },
  "line_item_diffs": [],
  "interpretation": "Your current bill shows an increase of ₹260 (about 26.5%)...",
  "warnings": [],
  "created_at": "2026-10-23T10:05:00Z"
}
```

---

## 5. Action Items
`GET /api/v1/actions?document_id=...&status=...`  
`POST /api/v1/actions`  
`PATCH /api/v1/actions/{action_id}`  
`DELETE /api/v1/actions/{action_id}`

Headers: `X-Session-ID: sess_...`

### Request Body (`POST`)
```json
{
  "document_id": "doc_a1b2c3d4",
  "title": "Submit Life Certificate to bank",
  "description": "Carry original PPO booklet",
  "due_date": "2026-11-30",
  "status": "pending",
  "source_text": "Please submit by 30th November 2026"
}
```

---

## 6. Text-to-Speech
`POST /api/v1/speech`

### Request Body
```json
{
  "text": "Your electricity bill amount due is twelve hundred forty rupees.",
  "language": "en",
  "purpose": "document_summary"
}
```

### Response
Binary stream with header `Content-Type: audio/mpeg`.
