from flask import Blueprint, jsonify, send_file, request
import mysql.connector
from flask_cors import CORS
from datetime import datetime
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, HRFlowable
import os
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from flask import send_file, jsonify
from datetime import datetime
import io, requests

brand_bp = Blueprint("brand", __name__)
CORS(brand_bp)

def get_db_connection():
    return mysql.connector.connect(
        host="free02.123host.vn",
        user="wxuszrya_brand_service",
        password="12345678",
        database= "wxuszrya_brand_service"
    )

# def get_db_connection():
#     return mysql.connector.connect(
#         host="han312.mysql.pythonanywhere-services.com",
#         user="han312",
#         password="SOA2025@",
#         database= "han312$brand_service"
#     )


# Existing APIs
@brand_bp.route('/get_brand', methods=['GET'])
def get_brand():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""SELECT distinct b.*, c.name, ct.* FROM Brand b
                        join Contract ct on b.brand_id = ct.brand_id
                        LEFT JOIN Category c ON b.category_id = c.category_id
                       """)
        brands = cursor.fetchall()
        cursor.close()
        conn.close()
        if not brands:
            return jsonify({"error": "No brands found"}), 404
        return jsonify({"brands": brands}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@brand_bp.route('/get_contract/<int:brand_id>', methods=['GET'])
def get_contract(brand_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Contract JOIN Brand ON Contract.brand_id = Brand.brand_id WHERE Brand.brand_id = %s", (brand_id,))
        contract = cursor.fetchall()
        cursor.close()
        conn.close()
        if not contract:
            return jsonify({"error": "No contract found"}), 404
        return jsonify({"contract": contract}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@brand_bp.route('/get_brand_id/<brand_id>', methods=['GET'])
def get_brand_by_id(brand_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Brand WHERE brand_id = %s", (brand_id,))
        brand = cursor.fetchone()
        cursor.close()
        conn.close()
        if not brand:
            return jsonify({"error": "Brand not found"}), 404
        return jsonify(brand), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@brand_bp.route('/update_brand', methods=['POST'])
def update_brand():
    data = request.get_json()
    brand_id = data.get('brand_id')
    brandname = data.get('brandname')
    email = data.get('email')
    if not brand_id or not brandname or not email:
        return jsonify({"error": "Missing required fields (brand_id, brandname, email)"}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Brand WHERE brand_id = %s", (brand_id,))
        brand = cursor.fetchone()
        if not brand:
            cursor.close()
            conn.close()
            return jsonify({"error": "Brand not found"}), 404
        cursor.execute(
            "UPDATE Brand SET brandname = %s, email = %s WHERE brand_id = %s",
            (brandname, email, brand_id)
        )
        conn.commit()
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"error": "No changes made to the brand"}), 400
        cursor.close()
        conn.close()
        return jsonify({"message": "Brand updated successfully"}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@brand_bp.route('/update_coefficient', methods=['POST'])
def update_coefficient():
    data = request.get_json()
    brand_id = data.get('brand_id')
    coefficient = data.get('coefficient')
    if not brand_id or not coefficient:
        return jsonify({"error": "Missing required fields (brand_id, coefficient)"}), 400
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Brand WHERE brand_id = %s", (brand_id,))
        brand = cursor.fetchone()
        if not brand:
            cursor.close()
            conn.close()
            return jsonify({"error": "Brand not found"}), 404
        cursor.execute(
            "UPDATE Brand SET coefficient = %s WHERE brand_id = %s",
            (coefficient, brand_id)
        )
        conn.commit()
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({"error": "No changes made to the coefficient"}), 400
        cursor.close()
        conn.close()
        return jsonify({"message": "Coefficient updated successfully"}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

# Đếm số số lượng brand
@brand_bp.route('/count_brand', methods=['GET'])
def count_brand():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) as total FROM Brand")
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if not result:
            return jsonify({"error": "No brands found"}), 404
        return jsonify({"total": result['total']}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@brand_bp.route('/get_brand', methods=['GET'])
def get_all_brands():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Brand where status = 1")
        brands = cursor.fetchall()
        cursor.close()
        conn.close()

        if not brands:
            return jsonify({"error": "No brands found"}), 404
        return jsonify({"brands": brands}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@brand_bp.route('/brand_by_type_chart', methods=['GET'])
def brand_by_type_chart():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT c.name, COUNT(b.brand_id) as total FROM Brand b JOIN Category c ON b.category_id = c.category_id GROUP BY c.name")
        result = cursor.fetchall()
        cursor.close()
        conn.close()

        if not result:
            return jsonify({"error": "No brands found"}), 404
        return jsonify({"brand_by_type": result}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

from datetime import date

@brand_bp.route('/get_contracts', methods=['GET'])
def get_contracts():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT c.contract_id, c.start_at, c.end_at, 
                   c.total_amount, c.status, b.brandname
            FROM Contract c
            JOIN Brand b ON c.brand_id = b.brand_id
        """)
        contracts = cursor.fetchall()
        today = date.today()

        for c in contracts:
            # ép kiểu end_at về date nếu nó là datetime
            end_at = c["end_at"].date() if isinstance(c["end_at"], datetime) else c["end_at"]

            new_status = 0 if end_at < today else 1
            c["status"] = new_status  # gán vào kết quả trả về

        cursor.close()
        conn.close()

        return jsonify({"success": True, "contracts": contracts}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@brand_bp.route('/export_contract/<int:contract_id>', methods=['GET'])
def export_contract(contract_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT c.contract_id, c.brand_id, c.start_at, c.end_at, c.total_amount, b.brandname
            FROM Contract c
            JOIN Brand b ON c.brand_id = b.brand_id
            WHERE c.contract_id = %s
        """, (contract_id,))
        contract = cursor.fetchone()
        cursor.close(); conn.close()

        if not contract:
            return jsonify({"error": "Hợp đồng không tồn tại!"}), 404

        # Font tiếng Việt
        pdfmetrics.registerFont(TTFont('DejaVuSans', 'DejaVuSans.ttf'))

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=40, bottomMargin=40)

        styles = getSampleStyleSheet()
        normal = ParagraphStyle(name="Normal", fontName="DejaVuSans", fontSize=12, leading=18)
        bold = ParagraphStyle(name="Bold", fontName="DejaVuSans", fontSize=12, leading=18, spaceAfter=6)
        center = ParagraphStyle(name="Center", fontName="DejaVuSans", fontSize=12, alignment=1, leading=18)
        title = ParagraphStyle(name="Title", fontName="DejaVuSans", fontSize=18, alignment=1, spaceAfter=12)

        elements = []

        # Header: Logo + Quốc hiệu
        header_data = [
            [Image(os.path.join("static", "logo.png"), width=80, height=50),
             Paragraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br/>Độc lập - Tự do - Hạnh phúc", center)]
        ]
        header = Table(header_data, colWidths=[100, 350])
        header.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE')]))
        elements.append(header)
        elements.append(Spacer(1, 5))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.black))
        elements.append(Spacer(1, 20))

        # Tiêu đề hợp đồng
        elements.append(Paragraph("HỢP ĐỒNG HỢP TÁC", title))
        elements.append(Paragraph(f"Số: CON{contract['contract_id']}/2025/HĐHT", center))
        elements.append(Spacer(1, 20))

        # Bảng thông tin hợp đồng
        data = [
            ["Bên A (Mall)", "ABC Mall"],
            ["Bên B (Brand)", contract['brandname']],
            ["Ngày bắt đầu", contract['start_at'].strftime('%d/%m/%Y') if contract['start_at'] else 'N/A'],
            ["Ngày kết thúc", contract['end_at'].strftime('%d/%m/%Y') if contract['end_at'] else 'N/A'],
            ["Giá trị hợp đồng", f"{contract['total_amount']:,.0f} VND"],
            ["Ngày xuất", datetime.now().strftime('%d/%m/%Y')],
        ]
        table = Table(data, colWidths=[180, 320])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#F2F2F2")),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTNAME', (0, 0), (-1, -1), 'DejaVuSans'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))

        # Nội dung điều khoản
        elements.append(Paragraph("ĐIỀU KHOẢN HỢP ĐỒNG", bold))
        elements.append(Paragraph("<b>Điều 1.</b> Nội dung hợp tác: Hai bên thống nhất hợp tác theo các điều khoản đã thỏa thuận.", normal))
        elements.append(Paragraph("<b>Điều 2.</b> Thời hạn hợp đồng: Từ ngày bắt đầu đến ngày kết thúc như đã ghi trên.", normal))
        elements.append(Paragraph("<b>Điều 3.</b> Giá trị hợp đồng: Thanh toán theo thỏa thuận giữa hai bên.", normal))
        elements.append(Paragraph("<b>Điều 4.</b> Trách nhiệm và quyền lợi: Mỗi bên cam kết thực hiện đúng các điều khoản.", normal))
        elements.append(Spacer(1, 30))

        # Ngày ký
        elements.append(Paragraph(f"TP.HCM, ngày .... tháng .... năm {datetime.now().strftime('%Y')}", center))
        elements.append(Spacer(1, 20))

        # Chữ ký 2 bên
        sign_data = [
            ["ĐẠI DIỆN BÊN A (Mall)", "ĐẠI DIỆN BÊN B (Brand)"],
            ["(Ký, ghi rõ họ tên, đóng dấu)", "(Ký, ghi rõ họ tên, đóng dấu)"]
        ]
        sign_table = Table(sign_data, colWidths=[250, 250])
        sign_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'DejaVuSans'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 40),
        ]))
        elements.append(sign_table)

        doc.build(elements)
        buffer.seek(0)
        return send_file(buffer, as_attachment=True,
                         download_name=f"Contract_CON{contract['contract_id']}.pdf",
                         mimetype='application/pdf')

    except Exception as e:
        return jsonify({"error": f"Lỗi khi xuất hợp đồng: {str(e)}"}), 500
# Lấy chi tiết 1 hợp đồng theo contract_id
@brand_bp.route('/contract/<int:contract_id>', methods=['GET'])
def get_contract_by_id(contract_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT c.contract_id, c.start_at, c.end_at, c.total_amount, c.status,
                   b.brandname
            FROM Contract c
            JOIN Brand b ON c.brand_id = b.brand_id
            WHERE c.contract_id = %s
        """, (contract_id,))
        contract = cursor.fetchone()
        cursor.close()
        conn.close()

        if not contract:
            return jsonify({"success": False, "message": "Không tìm thấy hợp đồng"}), 404

        return jsonify({"success": True, "contract": contract}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@brand_bp.route('/contract/renew/<int:contract_id>', methods=['PUT'])
def renew_contract(contract_id):
    try:
        data = request.get_json()
        new_end_date = data.get("end_date")

        if not new_end_date:
            return jsonify({"success": False, "message": "Thiếu ngày kết thúc mới"}), 400

        # Parse ngày kết thúc mới
        new_end = datetime.strptime(new_end_date, "%Y-%m-%d").date()
        today = date.today()  # ngày bắt đầu mới = hôm nay

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT start_at, end_at FROM Contract WHERE contract_id = %s", (contract_id,))
        contract = cursor.fetchone()

        if not contract:
            conn.close()
            return jsonify({"success": False, "message": "Không tìm thấy hợp đồng"}), 404

        old_end = contract["end_at"].date() if isinstance(contract["end_at"], datetime) else contract["end_at"]

        # Check logic ngày
        if new_end <= old_end:
            conn.close()
            return jsonify({"success": False, "message": "Ngày gia hạn phải lớn hơn ngày kết thúc cũ"}), 400

        # Update DB: set start_at = hôm nay, end_at = ngày gia hạn
        cursor2 = conn.cursor()
        cursor2.execute("""
            UPDATE Contract
            SET start_at = %s, end_at = %s, status = 1
            WHERE contract_id = %s
        """, (today, new_end, contract_id))
        conn.commit()
        cursor2.close()
        conn.close()

        return jsonify({"success": True, "message": "Gia hạn hợp đồng thành công"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@brand_bp.route("/check_expiring", methods=["POST"])
def check_expiring_contracts():
    """Quét hợp đồng còn <=7 ngày và tạo thông báo hệ thống"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT c.contract_id, b.brandname, c.end_at, c.brand_id
            FROM Contract c
            JOIN Brand b ON c.brand_id = b.brand_id
            WHERE c.end_at <= DATE_ADD(NOW(), INTERVAL 7 DAY)
              AND c.notified = 0
        """)
        contracts = cursor.fetchall()

        for c in contracts:
            message = f"Hợp đồng với {c['brandname']} sẽ hết hạn vào {c['end_at']}"
            
            # Gửi sang Notification Service
            requests.post("https://loyalty-point-system.onrender.com/notification/create/system", json={
                "title": "Hợp đồng sắp hết hạn",
                "message": message,
                "end_at": c["end_at"].strftime("%Y-%m-%d %H:%M:%S"),
                "status": 1,
                "type": "system",
                "target_type": "brand",
                "target_id": c["brand_id"]
            })
            

            # Đánh dấu đã thông báo
            cursor.execute("UPDATE Contract SET notified = 1 WHERE contract_id = %s", (c["contract_id"],))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "contracts": len(contracts)}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@brand_bp.route('/contracts/mark_notified', methods=['POST'])
def mark_contract_notified():
    try:
        data = requests.get_json()
        contract_id = data.get("contract_id")

        if not contract_id:
            return jsonify({"success": False, "message": "Thiếu contract_id"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE Contract SET notified = 1 WHERE contract_id = %s", (contract_id,))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": "Đã đánh dấu hợp đồng"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
