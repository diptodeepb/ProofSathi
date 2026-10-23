# ProofSathi — Judge & Evaluator Walkthrough Script (90–120s)

This walkthrough demonstrates the end-to-end functionality of ProofSathi on mobile viewports.

---

### Step 1: Launch & One-Question Onboarding (0:00–0:15)
1. Open ProofSathi on a phone or mobile viewport (`http://localhost:5173` or deployed Vercel URL).
2. The app immediately presents the one-question onboarding modal:
   > *"Which language are you most comfortable with? English | हिंदी | বাংলা"*
3. Tap **বাংলা (Bengali)** or **English**.
4. The entire application instantly renders in the chosen language. Notice that no name, age, address, diagnosis, or bank details are requested.

---

### Step 2: BillSaathi — Understanding a Household Bill (0:15–0:40)
1. From the Home screen, tap **"Understand a bill" (বিল বুঝুন)**.
2. Under *"Or try with a sample document"*, tap **"State Electricity Board — Current Bill"** (or photograph a bill).
3. Tap **"Understand This Document"**.
4. Watch the loading indicator transition through genuine stages: *Checking the photo... Reading the document... Preparing explanation...*
5. View the structured results:
   - **Total Amount Payable**: `₹1,240.00` prominently highlighted.
   - **Due Date**: `12/11/2026`.
   - **Units Consumed**: `205 kWh`.
   - **Itemized Breakdown**: Energy charges, fixed demand charges, duty/tax.
6. Tap **"Found on document"** under Amount Due to reveal the exact printed quote verifying the figure.
7. Tap **"Listen to explanation" (কথা শুনুন)** to hear the ElevenLabs multilingual voice synthesis in the selected language.

---

### Step 3: Deterministic Bill Comparison (0:40–1:05)
1. On the same bill result page, tap **"Compare with an earlier bill" (আগের বিলের সাথে তুলনা করুন)**.
2. Select **"Use Sample Previous Bill (₹980)"** (or upload an earlier bill).
3. Review the comparison screen:
   - Difference: `+₹260.00 (+26.53%)` calculated deterministically by Python `Decimal` code.
   - Consumption Change: `+25.0 kWh` with units compatibility check.
   - Due Date change tracking.
4. Highlight the ethical disclaimer:
   > *"These figures show what changed between bills. A difference does not automatically mean an overcharge or error."*

---

### Step 4: ProofPath — Tracking Official Notices & Deadlines (1:05–1:30)
1. Return to Home and tap **"Understand a document" (নথি বুঝুন)**.
2. Tap the sample **"Central Pension Accounting Office — Notice"**.
3. View the extracted structured guidance:
   - **Document Summary**: Plain-language explanation for older adults.
   - **Important Dates**: `30 November 2026` with deadline badge and source excerpt.
   - **Required Documents**: Original PPO booklet and Aadhaar card.
   - **Action Checklist**: *"Submit Life Certificate to bank branch or online"*.
4. Tap the circular checkbox on the action item to mark it **Completed**.
5. Type a custom note (e.g., *"Ask neighbor to accompany to bank"*) and tap **Add**.

---

### Step 5: Wrap-up & Core Principle (1:30–1:45)
Conclude with the core product philosophy:
> *"ProofSathi explains what the document says, grounds every consequential field in visible evidence, and makes the next step easier. It does not invent facts, fabricate overcharge claims, or act on the user's behalf."*
