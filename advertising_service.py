from flask import Flask, render_template, request, jsonify, Blueprint, send_file
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

ad_bp = Blueprint("ad", __name__)
CORS(ad_bp)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        port=3307,
        user="root",
        password="",
        database= "advertising_service"
    )

# def get_db_connection():
#     return mysql.connector.connect(
#         host="han312.mysql.pythonanywhere-services.com",
#         user="han312",
#         password="SOA2025@",
#         database="han312$advertising_service"
#     )

@ad_bp.route('/create_ad', methods=['GET'])
def create_ad_page():
    user_id = request.args.get('user_id')
    user_name = request.args.get('username', '')
    brand_id = request.args.get('brand', '')
    return render_template("advertising_service/create_ad.html", user_name=user_name, brand_id=brand_id, user_id=user_id)

# Tạo quảng cáo mới
@ad_bp.route('/ads', methods=['POST'])
def create_ad():
    data = request.json
    required_fields = ['brand_id', 'title', 'description', 'start_at', 'end_at', 'ad_cost']
    for field in required_fields:
        if field not in data or isinstance(data[field], list):
            return jsonify({"error": f"Thiếu hoặc sai kiểu dữ liệu trường: {field}"}), 400

    brand_id = data['brand_id']
    if not brand_id:
        return jsonify({"error": "Bạn chưa đăng nhập hoặc không có quyền tạo quảng cáo."}), 401

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
        INSERT INTO Ad (brand_id, title, description, start_at, end_at, created_at, status, ad_cost)
        VALUES (%s, %s, %s, %s, %s, %s, 'DRAFT', %s)
        """
        cursor.execute(query, (
            brand_id,
            data['title'],
            data['description'],
            datetime.strptime(data['start_at'], '%Y-%m-%dT%H:%M'),
            datetime.strptime(data['end_at'], '%Y-%m-%dT%H:%M'),
            datetime.now(),
            float(data['ad_cost'])
        ))
        ad_id = cursor.lastrowid
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({
            "message": "Tạo quảng cáo thành công!",
            "ad_id": ad_id
        }), 201
    except ValueError as ve:
        return jsonify({"error": f"Invalid date format: {str(ve)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Lỗi tạo: {str(e)}"}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()
@ad_bp.route('/brand', methods=['GET'])
def brand_page():
    """
    Render the brand page template.
    """
    try:
        user_id = request.args.get('user_id', '')
        brand_id = request.args.get('brand_id', '')
        user_name = request.args.get('user_name', '')
        user = {"user_id": user_id, "user_name": user_name}
        return render_template("brand.html", user=user, brand_id=brand_id)
    except Exception as e:
        return jsonify({"error": f"Failed to render brand page: {str(e)}"}), 500

# Gửi quảng cáo để duyệt
@ad_bp.route('/ads/<int:ad_id>/submit', methods=['POST'])
def submit_ad(ad_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM Ad WHERE ad_id = %s", (ad_id,))
        ad = cursor.fetchone()
        if not ad:
            cursor.close()
            conn.close()
            return jsonify({"error": "Quảng cáo không tồn tại!"}), 404

        if ad[0] != 'DRAFT':
            cursor.close()
            conn.close()
            return jsonify({"error": "Quảng cáo không ở trạng thái DRAFT!"}), 400

        cursor.execute("UPDATE Ad SET status = 'PENDING' WHERE ad_id = %s", (ad_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Gửi quảng cáo để duyệt thành công!"}), 200
    except Exception as e:
        if 'conn' in locals():
            cursor.close()
            conn.close()
        return jsonify({"error": str(e)}), 500

@ad_bp.route('/ads/get_all', methods=['GET'])
def get_all_ads():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Join with Brand table if you need brand name, assuming a Brand table exists
        # Adjust the query based on your actual database schema
        query = """
            SELECT
                a.ad_id, a.brand_id, a.title, a.description,
                a.start_at, a.end_at, a.created_at, a.status, a.ad_cost
                -- , b.brandname  -- Uncomment if you have a Brand table and need the name
            FROM Ad a
            -- LEFT JOIN YourBrandTableName b ON a.brand_id = b.brand_id -- Uncomment and adjust join
            ORDER BY a.created_at DESC
        """
        cursor.execute(query)
        ads = cursor.fetchall()

        # Convert datetime objects to string format suitable for JSON
        for ad in ads:
            if ad['start_at']:
                ad['start_at'] = ad['start_at'].strftime('%Y-%m-%d %H:%M:%S')
            if ad['end_at']:
                ad['end_at'] = ad['end_at'].strftime('%Y-%m-%d %H:%M:%S')
            if ad['created_at']:
                ad['created_at'] = ad['created_at'].strftime('%Y-%m-%d %H:%M:%S')

        cursor.close()
        conn.close()
        return jsonify({"ads": ads}), 200
    except Exception as e:
        # Log the error e for debugging
        print(f"Error fetching all ads: {e}")
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
        return jsonify({"error": f"Lỗi máy chủ khi lấy danh sách quảng cáo: {str(e)}"}), 500

# API để lấy quảng cáo chờ duyệt (PENDING)
@ad_bp.route('/ads/pending', methods=['GET'])
def get_pending_ads():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        # Adjust the query if you need more details like brand name
        query = """
            SELECT
                a.ad_id, a.brand_id, a.title, a.description,
                a.start_at, a.end_at, a.ad_cost
                -- , b.brandname -- Uncomment if needed
            FROM Ad a
            -- LEFT JOIN YourBrandTableName b ON a.brand_id = b.brand_id -- Uncomment and adjust join
            WHERE a.status = 'PENDING'
            ORDER BY a.created_at ASC
        """
        cursor.execute(query)
        pending_ads = cursor.fetchall()

        # Format dates for JSON
        for ad in pending_ads:
            if ad['start_at']:
                ad['start_at'] = ad['start_at'].strftime('%Y-%m-%d %H:%M:%S')
            if ad['end_at']:
                ad['end_at'] = ad['end_at'].strftime('%Y-%m-%d %H:%M:%S')

        cursor.close()
        conn.close()
        return jsonify({"ads": pending_ads}), 200
    except Exception as e:
        print(f"Error fetching pending ads: {e}")
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
        return jsonify({"error": f"Lỗi máy chủ khi lấy quảng cáo chờ duyệt: {str(e)}"}), 500


# API để duyệt quảng cáo (Approve/Reject)
@ad_bp.route('/ads/<int:ad_id>/review', methods=['POST'])
def review_ad(ad_id):
    data = request.json
    decision = data.get('decision') # Should be 'APPROVED' or 'REJECTED'

    if not decision or decision not in ['APPROVED', 'REJECTED']:
        return jsonify({"error": "Quyết định không hợp lệ. Phải là 'APPROVED' hoặc 'REJECTED'."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT status FROM Ad WHERE ad_id = %s", (ad_id,))
        ad = cursor.fetchone()

        if not ad:
            cursor.close()
            conn.close()
            return jsonify({"error": "Quảng cáo không tồn tại!"}), 404

        if ad[0] != 'PENDING':
            cursor.close()
            conn.close()
            return jsonify({"error": "Quảng cáo không ở trạng thái chờ duyệt (PENDING)!"}), 400

        cursor.execute("UPDATE Ad SET status = %s WHERE ad_id = %s", (decision, ad_id))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": f"Quảng cáo đã được {decision.lower()}!"}), 200
    except Exception as e:
        print(f"Error reviewing ad {ad_id}: {e}")
        if 'conn' in locals() and conn.is_connected():
            conn.rollback() # Rollback on error
            cursor.close()
            conn.close()
        return jsonify({"error": f"Lỗi máy chủ khi duyệt quảng cáo: {str(e)}"}), 500

# API để lấy danh sách quảng cáo đang hoạt động
@ad_bp.route('/active', methods=['GET'])
def get_active_ads():
    try:
        brand_id = request.args.get('brand_id', type=int)
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT ad_id, brand_id, title, description, start_at, end_at, created_at
            FROM Ad
            WHERE start_at <= NOW()
              AND (end_at IS NULL OR end_at >= NOW())
              AND status = 'APPROVED'
        """
        params = []

        # Nếu truyền brand_id thì lọc, ngược lại trả tất cả brand
        if brand_id:
            query += " AND brand_id = %s"
            params.append(brand_id)

        query += " ORDER BY created_at DESC"

        cursor.execute(query, tuple(params))
        ads = cursor.fetchall()

        cursor.close()
        conn.close()
        return jsonify({"success": True, "ads": ads}), 200

    except Exception as e:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()
        return jsonify({"success": False, "message": str(e)}), 500


# API để ghi nhận hành động của người dùng với quảng cáo
@ad_bp.route('/interaction', methods=['POST'])
def record_ad_interaction():
    try:
        data = request.get_json()
        ad_id = data.get('ad_id')
        user_id = data.get('user_id')
        action = data.get('action')  # 'VIEW' hoặc 'DISMISS'

        if not ad_id or not user_id or not action:
            return jsonify({"error": "Thiếu thông tin ad_id, user_id hoặc action"}), 400

        if action not in ['VIEW', 'DISMISS']:
            return jsonify({"error": "Hành động không hợp lệ, phải là VIEW hoặc DISMISS"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO AdInteraction (ad_id, user_id, action, interaction_at)
            VALUES (%s, %s, %s, %s)
        """, (ad_id, user_id, action, datetime.now()))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "Hành động được ghi lại thành công!"}), 200
    except Exception as e:
        if 'conn' in locals():
            cursor.close()
            conn.close()
        return jsonify({"error": str(e)}), 500

# API để lấy số liệu thống kê hành động của quảng cáo
@ad_bp.route('/<int:ad_id>/stats', methods=['GET'])
def get_ad_stats(ad_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                action,
                COUNT(*) AS count
            FROM AdInteraction
            WHERE ad_id = %s
            GROUP BY action
        """, (ad_id,))
        stats = cursor.fetchall()
        cursor.close()
        conn.close()

        result = {"views": 0, "dismissals": 0}
        for stat in stats:
            if stat['action'] == 'VIEW':
                result['views'] = stat['count']
            elif stat['action'] == 'DISMISS':
                result['dismissals'] = stat['count']

        return jsonify(result), 200
    except Exception as e:
        if 'conn' in locals():
            cursor.close()
            conn.close()
        return jsonify({"error": str(e)}), 500

@ad_bp.route('/export_invoice/<int:ad_id>', methods=['GET'])
def export_ad_invoice(ad_id):
    try:
        # Kết nối cơ sở dữ liệu
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Lấy thông tin quảng cáo
        cursor.execute("""
            SELECT a.ad_id, a.brand_id, a.title, a.description, a.start_at, a.end_at, a.ad_cost
            FROM Ad a
            WHERE a.ad_id = %s
        """, (ad_id,))
        ad = cursor.fetchone()

        if not ad:
            cursor.close()
            conn.close()
            return jsonify({"error": "Quảng cáo không tồn tại!"}), 404

        # Đóng kết nối cơ sở dữ liệu
        cursor.close()
        conn.close()

        # Đăng ký font hỗ trợ tiếng Việt
        pdfmetrics.registerFont(TTFont('DejaVuSans', 'DejaVuSans.ttf'))  # Đảm bảo bạn có font này

        # Tạo buffer để lưu file PDF
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50)

        # Định dạng kiểu chữ
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            name='Title',
            parent=styles['Title'],
            fontName='DejaVuSans',
            fontSize=18,
            spaceAfter=20,
            alignment=1
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

        # Tiêu đề hóa đơn
        elements.append(Paragraph("HÓA ĐƠN QUẢNG CÁO", title_style))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"Mã quảng cáo: AD-{ad['ad_id']}", bold_style))
        elements.append(Spacer(1, 20))

        # Thông tin hóa đơn
        elements.append(Paragraph("THÔNG TIN HÓA ĐƠN", bold_style))
        elements.append(Spacer(1, 10))

        # Dữ liệu hóa đơn dưới dạng bảng
        data = [
            ["Tiêu đề", ad['title']],
            ["Mô tả", ad['description']],
            ["Brand", ad['brand_id']],
            ["Ngày bắt đầu", ad['start_at'].strftime('%d/%m/%Y') if ad['start_at'] else 'N/A'],
            ["Ngày kết thúc", ad['end_at'].strftime('%d/%m/%Y') if ad['end_at'] else 'N/A'],
            ["Chi phí", f"{ad['ad_cost']:,.0f} VND"],
            ["Ngày xuất", "14/05/2025 10:17"]  # Cập nhật thời gian hiện tại
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

        # Thông tin bổ sung
        elements.append(Paragraph("THÔNG TIN BỔ SUNG", bold_style))
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("1. Hóa đơn này được xuất tự động từ hệ thống.", normal_style))
        elements.append(Paragraph("2. Vui lòng kiểm tra thông tin trước khi sử dụng.", normal_style))
        elements.append(Spacer(1, 20))

        # Chữ ký
        elements.append(Paragraph("ĐẠI DIỆN KHÁCH HÀNG", bold_style))
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
            download_name=f"Invoice_AD-{ad['ad_id']}.pdf",
            mimetype='application/pdf'
        )

    except Exception as e:
        return jsonify({"error": f"Lỗi khi xuất hóa đơn: {str(e)}"}), 500