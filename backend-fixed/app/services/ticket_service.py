"""
Ticket generation utilities: QR code + Barcode (base64 PNG).
"""

import base64
import io
from typing import Tuple

import qrcode
import barcode
from barcode.writer import ImageWriter


def generate_qr_base64(data: str) -> str:
    """Generate a QR code PNG encoded as a base64 data URI."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=6,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


def generate_barcode_base64(data: str) -> str:
    """Generate a Code128 barcode PNG encoded as a base64 data URI."""
    Code128 = barcode.get_barcode_class("code128")
    bc = Code128(data, writer=ImageWriter())
    buf = io.BytesIO()
    bc.write(buf, options={"write_text": False, "module_height": 10.0})
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64}"


def generate_ticket_codes(ticket_number: str) -> Tuple[str, str]:
    """Return (qr_code_b64, barcode_b64) for a ticket number."""
    qr_b64 = generate_qr_base64(ticket_number)
    bc_b64 = generate_barcode_base64(ticket_number)
    return qr_b64, bc_b64
