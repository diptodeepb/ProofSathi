"""Synthetic demo fixtures generator for ProofSathi testing and live evaluation."""
from __future__ import annotations
import os
import io
from PIL import Image, ImageDraw, ImageFont

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


def _draw_synthetic_document(
    title: str, lines: list[str], bg_color: str = "#ffffff", text_color: str = "#1e293b", is_blurry: bool = False
) -> bytes:
    width, height = 800, 1050
    img = Image.new("RGB", (width, height), color=bg_color)
    draw = ImageDraw.Draw(img)

    # Draw border
    draw.rectangle([20, 20, width - 20, height - 20], outline="#cbd5e1", width=3)
    draw.rectangle([40, 40, width - 40, 110], fill="#f1f5f9", outline="#94a3b8", width=1)

    # Title
    draw.text((60, 60), title, fill=text_color)

    # Draw horizontal divider
    draw.line([40, 130, width - 40, 130], fill="#94a3b8", width=2)

    # Lines
    y = 160
    for line in lines:
        if line.startswith("---"):
            draw.line([40, y + 5, width - 40, y + 5], fill="#e2e8f0", width=1)
            y += 20
        elif line.startswith("#"):
            draw.text((50, y), line.replace("#", "").strip(), fill="#0f172a")
            y += 35
        else:
            draw.text((50, y), line, fill=text_color)
            y += 28

    # Watermark
    draw.text((50, height - 50), "DEMO SPECIMEN — SYNTHETIC TEST FIXTURE (NOT A REAL BILL/NOTICE)", fill="#94a3b8")

    if is_blurry:
        from PIL import ImageFilter
        img = img.filter(ImageFilter.GaussianBlur(radius=8))

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


FIXTURE_DEFINITIONS = {
    "demo-electricity-current": {
        "title": "State Electricity Board — Current Bill",
        "workflow": "bill",
        "document_type": "electricity_bill",
        "description": "Current month electricity bill showing ₹1,240 payable and 205 kWh usage.",
        "lines": [
            "# STATE ELECTRICITY DISTRIBUTION CO. LTD.",
            "Consumer No: 0834284321        Tariff: Domestic LT-A",
            "Name: Demo Consumer             Meter No: ELM-90214",
            "Address: Plot 42, Civil Lines",
            "---",
            "Bill Date: 05/10/2026           Due Date: 12/11/2026",
            "Billing Period: 01 Sep 2026 to 30 Sep 2026 (30 Days)",
            "---",
            "Previous Reading: 4120          Current Reading: 4325",
            "Current Units Consumed: 205 kWh",
            "---",
            "Energy Charges: ₹820.00",
            "Fixed Demand Charges: ₹250.00",
            "Electricity Duty & Taxes: ₹170.00",
            "---",
            "# Total Amount Payable: ₹1,240.00",
            "Please pay on or before 12-11-2026 to avoid late surcharge.",
        ],
        "is_blurry": False,
    },
    "demo-electricity-previous": {
        "title": "State Electricity Board — Previous Bill",
        "workflow": "bill",
        "document_type": "electricity_bill",
        "description": "Previous month electricity bill showing ₹980 payable and 180 kWh usage.",
        "lines": [
            "# STATE ELECTRICITY DISTRIBUTION CO. LTD.",
            "Consumer No: 0834284321        Tariff: Domestic LT-A",
            "Name: Demo Consumer             Meter No: ELM-90214",
            "---",
            "Bill Date: 05/09/2026           Due Date: 12/10/2026",
            "Billing Period: 01 Aug 2026 to 31 Aug 2026 (31 Days)",
            "---",
            "Previous Reading: 3940          Current Reading: 4120",
            "Current Units Consumed: 180 kWh",
            "---",
            "Energy Charges: ₹640.00",
            "Fixed Demand Charges: ₹250.00",
            "Electricity Duty & Taxes: ₹90.00",
            "---",
            "# Total Amount Payable: ₹980.00",
            "Payment Status: Paid on 10-10-2026.",
        ],
        "is_blurry": False,
    },
    "demo-pension-notice": {
        "title": "Central Pension Accounting Office — Notice",
        "workflow": "document",
        "document_type": "pension_notice",
        "description": "Annual Life Certificate submission notice with 30 November deadline.",
        "lines": [
            "# CENTRAL PENSION ACCOUNTING OFFICE / DISBURSING AGENCY",
            "Ref No: CPAO/VERIF/2026/8941    Date: 15 October 2026",
            "To: All Central / State Pensioners",
            "---",
            "# SUBJECT: SUBMISSION OF ANNUAL LIFE CERTIFICATE (JEEVAN PRAMAAN)",
            "It is hereby notified that all pensioners must submit their annual",
            "Life Certificate for the year 2026-2027.",
            "---",
            "Important Date / Deadline: 30 November 2026",
            "Required Documents:",
            "1. Original Pension Payment Order (PPO) booklet",
            "2. Aadhaar Card for biometric authentication",
            "3. Active Bank Passbook linked with Pension Account",
            "---",
            "Modes of Submission: Visit nearest bank branch, Citizen Service Centre,",
            "or generate Digital Life Certificate via Jeevan Pramaan App.",
            "Failure to submit by 30-11-2026 may result in temporary pension stoppage.",
        ],
        "is_blurry": False,
    },
    "demo-hospital-followup": {
        "title": "City Care Hospital — Discharge & Follow-up Instructions",
        "workflow": "document",
        "document_type": "hospital_document",
        "description": "Post-discharge instruction sheet with next appointment date.",
        "lines": [
            "# CITY GENERAL HOSPITAL — DEPARTMENT OF GERIATRIC CARE",
            "Patient Name: Demo Elder         Age: 72   Ward: 4B",
            "Discharge Date: 18 October 2026",
            "---",
            "# FOLLOW-UP INSTRUCTIONS",
            "1. Next Review Appointment: 05 November 2026 at 10:30 AM (Room 204).",
            "2. Blood Pressure and fasting sugar check before review.",
            "3. Continue prescribed blood pressure tablet once daily in morning.",
            "---",
            "Required Items for Visit:",
            "- Previous discharge summary booklet",
            "- Daily BP log sheet",
            "---",
            "Safety Note: If chest heaviness or sudden dizziness occurs, contact",
            "Emergency Helpline immediately or visit the casualty department.",
        ],
        "is_blurry": False,
    },
    "demo-blurry-bill": {
        "title": "Unreadable Blurry Bill Sample",
        "workflow": "bill",
        "document_type": "unknown",
        "description": "Simulated blurry, unreadable bill testing graceful failure state.",
        "lines": [
            "UNCLEAR BLURRY BILL CONTENT",
            "Amount due: ?????",
            "Date: ??/??/????",
        ],
        "is_blurry": True,
    },
}


def ensure_fixtures_generated():
    os.makedirs(FIXTURES_DIR, exist_ok=True)
    for name, defn in FIXTURE_DEFINITIONS.items():
        file_path = os.path.join(FIXTURES_DIR, f"{name}.jpg")
        if not os.path.exists(file_path):
            img_bytes = _draw_synthetic_document(
                title=defn["title"],
                lines=defn["lines"],
                is_blurry=defn["is_blurry"],
            )
            with open(file_path, "wb") as f:
                f.write(img_bytes)


def get_fixture_image_bytes(name: str) -> Optional[bytes]:
    ensure_fixtures_generated()
    file_path = os.path.join(FIXTURES_DIR, f"{name}.jpg")
    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            return f.read()
    return None
