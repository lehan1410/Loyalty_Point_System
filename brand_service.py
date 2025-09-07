from flask import Blueprint, jsonify, send_file, request
import mysql.connector
from flask_cors import CORS
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import io

brand_bp = Blueprint("brand", __name__)
CORS(brand_bp)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        port=3307,
        password="",
        database= "brand_service"
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

@brand_bp.route('/get_contracts', methods=['GET'])
def get_contracts():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT contract_id, brandname, start_at, end_at, Contract.status, created_at, total_amount
            FROM Contract
            JOIN Brand WHERE Contract.brand_id = Brand.brand_id
            ORDER BY created_at DESC
        """)
        contracts = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"contracts": contracts}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@brand_bp.route('/export_contract/<int:contract_id>', methods=['GET'])
def export_contract(contract_id):
    try:
        # Kết nối cơ sở dữ liệu
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Lấy thông tin hợp đồng
        cursor.execute("""
            SELECT c.contract_id, c.brand_id, c.start_at, c.end_at, c.total_amount, b.brandname
            FROM Contract c
            JOIN Brand b ON c.brand_id = b.brand_id
            WHERE c.contract_id = %s
        """, (contract_id,))
        contract = cursor.fetchone()

        if not contract:
            cursor.close()
            conn.close()
            return jsonify({"error": "Hợp đồng không tồn tại!"}), 404

        cursor.close()
        conn.close()


        pdfmetrics.registerFont(TTFont('DejaVuSans', 'DejaVuSans.ttf'))  # Nếu không có file times.ttf, dùng font hệ thống

        # Tạo buffer để lưu file PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)

        # Định dạng kiểu chữ
        styles = getSampleStyleSheet()
        # Tùy chỉnh font cho các kiểu chữ
        title_style = ParagraphStyle(
            name='Title',
            parent=styles['Title'],
            fontName='DejaVuSans',
            fontSize=18,
            spaceAfter=20,
            alignment=1  # Căn giữa
        )
        normal_style = ParagraphStyle(
            name='Normal',
            parent=styles['Normal'],
            fontName='DejaVuSans',
            fontSize=12,
            leading=14
        )
        bold_style = ParagraphStyle(
            name='Bold',
            parent=normal_style,
            fontName='DejaVuSans',
            fontSize=12,
            fontWeight='bold'
        )

        # Nội dung PDF
        elements = []

        # Tiêu đề hợp đồng
        elements.append(Paragraph("HỢP ĐỒNG HỢP TÁC", title_style))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"Mã hợp đồng: #CON{contract['contract_id']}", bold_style))
        elements.append(Spacer(1, 20))

        # Thông tin hợp đồng
        elements.append(Paragraph("THÔNG TIN HỢP ĐỒNG", bold_style))
        elements.append(Spacer(1, 10))

        # Dữ liệu hợp đồng dưới dạng bảng
        data = [
            ["Brand", contract['brandname']],
            ["Ngày bắt đầu", contract['start_at'].strftime('%d/%m/%Y') if contract['start_at'] else 'N/A'],
            ["Ngày kết thúc", contract['end_at'].strftime('%d/%m/%Y') if contract['end_at'] else 'N/A'],
            ["Giá trị hợp đồng", f"{contract['total_amount']:,.0f} VND"],
            ["Ngày xuất", datetime.now().strftime('%d/%m/%Y')],
        ]

        table = Table(data, colWidths=[150, 350])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'DejaVuSans'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('BOX', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))

        # Thêm nội dung hợp đồng
        elements.append(Paragraph("NỘI DUNG HỢP ĐỒNG", bold_style))
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("1. Hai bên đồng ý hợp tác theo các điều khoản đã thống nhất.", normal_style))
        elements.append(Paragraph("2. Thời gian hợp tác: Từ ngày bắt đầu đến ngày kết thúc như đã nêu trên.", normal_style))
        elements.append(Paragraph("3. Giá trị hợp đồng sẽ được thanh toán theo thỏa thuận.", normal_style))
        elements.append(Spacer(1, 20))

        # Chữ ký
        elements.append(Paragraph("ĐẠI DIỆN TRUNG TÂM THƯƠNG MẠI", bold_style))
        elements.append(Spacer(1, 50))
        elements.append(Paragraph("(Ký tên, đóng dấu)", normal_style))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("ĐẠI DIỆN BRAND", bold_style))
        elements.append(Spacer(1, 50))
        elements.append(Paragraph("(Ký tên, đóng dấu)", normal_style))

        # Tạo PDF
        doc.build(elements)

        # Đặt con trỏ buffer về đầu
        buffer.seek(0)

        # Trả file PDF về client
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"Contract_CON{contract['contract_id']}.pdf",
            mimetype='application/pdf'
        )

    except Exception as e:
        return jsonify({"error": f"Lỗi khi xuất hợp đồng: {str(e)}"}), 500