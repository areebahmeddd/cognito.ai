from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
import textwrap


def wrap_text(text, width=80):
    """Wrap long text for table cells."""
    return "<br/>".join(textwrap.wrap(str(text), width))


def generate_pdf(data, output_file="forensic_report.pdf"):
    """
    Generate a forensic PDF report from JSON data.
    `output_file` can be a path (str) or a BytesIO buffer for in-memory generation.
    """
    doc = SimpleDocTemplate(
        output_file,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()
    story = []

    # --- Title Page ---
    story.append(Paragraph("<b>Digital Forensic Report</b>", styles["Title"]))
    story.append(Spacer(1, 30))

    # --- Chain of Custody (key:value layout) ---
    story.append(Paragraph("<b>Chain of Custody</b>", styles["Heading2"]))

    header_data = [
        ["Artifact ID", data[0].get("artifact_id", "N/A") if data else "N/A"],
        ["Investigating Officer", "Not Provided"],
        ["Officer ID", "Not Provided"],
        ["Case ID", data[0].get("case_id", "N/A") if data else "N/A"],
        ["Device ID", data[0].get("device_id", "N/A") if data else "N/A"],
    ]

    header_table = Table(header_data, colWidths=[150, 350])
    header_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.lightgrey),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.black),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 20))

    # --- Items Submitted ---
    story.append(Paragraph("<b>Items Submitted</b>", styles["Heading2"]))
    submitted_items = list({r.get("source_path", "N/A") for r in data if r.get("source_path")})
    for idx, item in enumerate(submitted_items, 1):
        story.append(Paragraph(f"{idx}. {item}", styles["Normal"]))
    story.append(Spacer(1, 15))

    # --- Examination Results ---
    story.append(Paragraph("<b>Examination Results</b>", styles["Heading2"]))
    exam_table_data = [["Sender", "Conversation", "Timestamp", "Message"]]
    for r in data:
        exam_table_data.append([
            Paragraph(r.get("sending_party", "N/A"), styles["Normal"]),
            Paragraph(r.get("conversation_name", "N/A"), styles["Normal"]),
            Paragraph(r.get("timestamp", "N/A"), styles["Normal"]),
            Paragraph(wrap_text(r.get("message", "N/A"), 70), styles["Normal"]),
        ])

    exam_table = Table(exam_table_data, colWidths=[100, 120, 120, 180])
    exam_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(exam_table)
    story.append(Spacer(1, 15))

    # Build the PDF
    doc.build(story)
    return output_file
