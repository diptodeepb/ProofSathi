# ProofSathi — Privacy & Safety Policy

## 1. Principles of Data Minimization

ProofSathi is designed to assist older adults in reading and comprehending physical documents without collecting unnecessary personally identifiable information (PII).

1. **One-Question Onboarding**: We only ask "Which language are you most comfortable with?" We do not collect names, ages, diagnoses, bank details, home addresses, phone numbers, or email addresses during onboarding.
2. **Device-Scoped Anonymous Sessions**: Sessions are identified by cryptographically random tokens (`sess_...`). All document history and comparisons are strictly bound to this session ID.
3. **No Credential Exposure**: Client code has zero access to server-side API keys (`GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, `CLOUDINARY_API_SECRET`, `MONGODB_URI`).
4. **Temporary Image Storage by Default**: Unless the user explicitly enables persistent storage (`STORE_ORIGINAL_DOCUMENTS=true`), document scans uploaded to Cloudinary's `authenticated` tier are automatically destroyed in a `finally` block post-processing.
5. **Masked Identifiers**: Consumer numbers, phone numbers, and account IDs are masked in the UI and stored records (e.g. `****1234`).

---

## 2. Boundaries and Disclaimers

1. **Information Accessibility Tool Only**: ProofSathi is not a bank, utility provider, healthcare clinician, lawyer, or government body.
2. **No Automatic Payments or Submissions**: ProofSathi will never automatically deduct funds, initiate UPI payments, or submit applications to government portals.
3. **No Overcharge Claims**: Numeric differences between bills are calculated by deterministic arithmetic. ProofSathi states what changed between documents without fabricating ungrounded claims of overcharging or fraud.
4. **Medical Follow-ups**: Prescriptions or medical discharge directions extracted by ProofPath must always be confirmed with the treating doctor or healthcare provider.
5. **No Live Listening**: ElevenLabs text-to-speech is used strictly for on-demand spoken playback of generated summaries. There is no background microphone listening or conversational telephone calling.
