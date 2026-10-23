# ProofSathi — Source Guidance & Evidence Extraction

## 1. Traceability Standard

To protect older adults from misleading AI hallucinations, every consequential field extracted by ProofSathi must be accompanied by a verifiable source excerpt from the original document image.

Consequential fields include:
- Total amount due
- Payment due date
- Units / consumption values
- Official submission deadlines
- Required identity proofs or supporting paperwork
- Explicitly requested actions

---

## 2. Extraction Categorization

Rather than exposing uncalibrated model confidence percentages (which can deceive users), ProofSathi uses categorical states:

1. **Clear on document (`high`)**:
   - Explicitly printed in the document.
   - Exact matching source snippet extracted.
   - Conforms strictly to schema and date/numeric validation.
2. **Please verify (`medium` / `needs_confirmation=true`)**:
   - Inferred from surrounding context or partially obscured.
   - Ambiguous numeric dates (such as `04/05/2026` where month and day could be ambiguous).
   - Consequential action items without explicit source quotes.
3. **Unclear in photo (`low`)**:
   - Image blurry, cropped, or dark.
   - User is prompted with guidance on how to retake a legible photo.

---

## 3. Date & Currency Normalization Guidelines

- **Dates**:
  - In India, `DD/MM/YYYY` is the prevalent format.
  - ProofSathi checks for ambiguity: when both day and month are `<= 12` and different, the field is normalized assuming `DD/MM/YYYY` but explicitly flagged as needing confirmation.
  - Textual months (e.g. `12 Nov 2026`, `12 November 2026`) are resolved unambiguously.
- **Currencies**:
  - Normalized to `INR` (`₹`).
  - Monetary values are parsed and computed using Python `Decimal` with rounding half-up (`0.01`).
