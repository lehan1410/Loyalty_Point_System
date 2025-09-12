from flask import request, jsonify, Blueprint, render_template, redirect, send_file
import mysql.connector
from flask_cors import CORS
from datetime import datetime
import random
import string
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import io

campaign_bp = Blueprint("campaign", __name__, template_folder='templates')
CORS(campaign_bp)
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        port=3307,
        user="root",
        password="",
        database= "campaign_service"
    )

# def get_db_connection():
#     return mysql.connector.connect(
#         host="han312.mysql.pythonanywhere-services.com",
#         user="han312",
#         password="SOA2025@",
#         database="han312$campaign_service"
#     )

def generate_code(length=6):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))
@campaign_bp.route('/brand', methods=['GET'])
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

@campaign_bp.route('/create_campaign', methods=['GET'])
def create_campaign_page():
    user_id = request.args.get('user_id')
    user_name = request.args.get('username', '')
    brand_id = request.args.get('brand', '')
    return render_template("campaign_service/create_campaign.html", user_name=user_name, brand_id=brand_id, user_id=user_id)

@campaign_bp.route('/campaigns', methods=['POST'])
def create_campaign():
    data = request.json
    required_fields = ['brand_id', 'title', 'description', 'points_required', 'reward', 'start_at', 'end_at', 'campaign_cost', 'brand_ratio', 'mall_ratio', 'initial_stock']
    for field in required_fields:
        if field not in data or isinstance(data[field], list):
            return jsonify({"error": f"Thiếu hoặc sai kiểu dữ liệu trường: {field}"}), 400

    brand_id = data['brand_id']
    if not brand_id:
        return jsonify({"error": "Bạn chưa đăng nhập hoặc không có quyền tạo chiến dịch."}), 401

    # Kiểm tra tổng tỷ lệ
    brand_ratio = float(data['brand_ratio'])
    mall_ratio = float(data['mall_ratio'])
    if abs(brand_ratio + mall_ratio - 100) > 0.01:  # Cho phép sai số nhỏ
        return jsonify({"error": "Tổng tỷ lệ Brand và Mall phải bằng 100%."}), 400

    # Kiểm tra initial_stock
    initial_stock = int(data['initial_stock'])
    if initial_stock < 1:
        return jsonify({"error": "Số lượng voucher ban đầu phải lớn hơn hoặc bằng 1."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        while True:
            redemption_code = generate_code()
            cursor.execute("SELECT campaign_id FROM Campaign WHERE redemption_code = %s LIMIT 1", (redemption_code,))
            if not cursor.fetchone():
                break

        query = """
        INSERT INTO Campaign (brand_id, title, description, points_required, reward, created_at, start_at, end_at, status, redemption_code, campaign_cost, brand_ratio, mall_ratio, initial_stock, stock)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'DRAFT', %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            brand_id,
            data['title'],
            data['description'],
            int(data['points_required']),
            data['reward'],
            datetime.now(),
            datetime.strptime(data['start_at'], '%Y-%m-%dT%H:%M'),
            datetime.strptime(data['end_at'], '%Y-%m-%dT%H:%M'),
            redemption_code,
            float(data['campaign_cost']),
            brand_ratio,
            mall_ratio,
            initial_stock,
            initial_stock  # stock ban đầu bằng initial_stock
        ))
        campaign_id = cursor.lastrowid
        conn.commit()
        return jsonify({
            "message": "Tạo chiến dịch thành công!",
            "campaign_id": campaign_id,
            "redemption_code": redemption_code
        }), 201
    except ValueError as ve:
        return jsonify({"error": f"Invalid date format: {str(ve)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Lỗi tạo: {str(e)}"}), 500
    finally:
        cursor.close()
        conn.close()

@campaign_bp.route('/campaigns/<int:campaign_id>', methods=['PUT'])
def update_campaign(campaign_id):
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
        UPDATE Campaign SET title=%s, description=%s, points_required=%s,
        reward=%s, start_at=%s, end_at=%s
        WHERE campaign_id=%s AND status='DRAFT'
        """
        cursor.execute(query, (
            data['title'],
            data['description'],
            data['points_required'],
            data['reward'],
            datetime.strptime(data['start_at'], '%Y-%m-%dT%H:%M'),
            datetime.strptime(data['end_at'], '%Y-%m-%dT%H:%M'),
            campaign_id
        ))
        if cursor.rowcount == 0:
            return jsonify({"error": "Campaign not found or not in DRAFT status"}), 400
        conn.commit()
        return jsonify({"message": "Campaign updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@campaign_bp.route('/campaigns/<int:campaign_id>/submit', methods=['POST'])
def submit_campaign(campaign_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE Campaign SET status='PENDING_APPROVAL' WHERE campaign_id=%s AND status='DRAFT'", (campaign_id,))
        if cursor.rowcount == 0:
            return jsonify({"error": "Campaign not found or not in DRAFT status"}), 400
        conn.commit()
        return jsonify({"message": "Campaign submitted for approval"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()
@campaign_bp.route('/campaigns/pending', methods=['GET'])
def get_pending_campaigns():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                campaign_id,
                title,
                description,
                points_required,
                reward,
                DATE_FORMAT(start_at, '%H:%i %d/%m/%Y ') AS start_at,
                DATE_FORMAT(end_at, '%H:%i %d/%m/%Y ') AS end_at,
                campaign_cost,
                brand_ratio,
                mall_ratio
            FROM Campaign
            WHERE status = 'PENDING_APPROVAL'
        """)
        campaigns = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"campaigns": campaigns}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@campaign_bp.route('/campaigns/<int:campaign_id>/review', methods=['POST'])
def review_campaign(campaign_id):
    data = request.json
    decision = data.get('decision')

    if decision not in ['APPROVED', 'REJECTED']:
        return jsonify({"error": "Invalid decision"}), 400

    # Chuyển decision thành status phù hợp với DB
    if decision == 'APPROVED':
        status = 'Đang hoạt động'  # hoặc 'ĐANG HOẠT ĐỘNG' nếu bạn lưu tiếng Việt
    else:
        status = 'Từ chối'

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE Campaign SET status=%s WHERE campaign_id=%s AND status='PENDING_APPROVAL'",
            (status, campaign_id)
        )
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"message": "Cập nhật thành công"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@campaign_bp.route('/get_campaign_page', methods=['GET'])
def get_campaign_page():
    brand_id = request.args.get('brand_id')
    if not brand_id:
        return redirect('/user/login')
    user_name = request.args.get('user_name', '')
    return render_template("campaign_service/get_campaign.html", user_name=user_name, brand_id= brand_id)

@campaign_bp.route('/count_campaigns/', methods=['GET'])
def count_campaign():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) as total FROM Campaign")
        result = cursor.fetchone()
        cursor.close()
        conn.close()

        if not result:
            return jsonify({"error": "No brands found"}), 404
        return jsonify({"total": result['total']}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@campaign_bp.route('/campaigns', methods=['GET'])
def list_campaigns():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = "SELECT * FROM Campaign WHERE status != 'DRAFT'"
        cursor.execute(query)
        result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@campaign_bp.route('/campaigns/<int:campaign_id>/redeem', methods=['POST'])
def redeem_campaign(campaign_id):
    try:
        # Lấy dữ liệu từ request
        data = request.get_json()
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({"error": "Thiếu user_id"}), 400

        # Lấy thông tin chiến dịch từ Campaign_Service
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Lấy thông tin chiến dịch, bao gồm stock
        cursor.execute("""
            SELECT points_required, redemption_code, stock
            FROM Campaign
            WHERE campaign_id = %s FOR UPDATE
        """, (campaign_id,))
        campaign = cursor.fetchone()
        if not campaign:
            conn.rollback()
            cursor.close()
            conn.close()
            return jsonify({"error": "Chiến dịch không tồn tại!"}), 404

        # Kiểm tra stock
        if campaign['stock'] <= 0:
            conn.rollback()
            cursor.close()
            conn.close()
            return jsonify({"error": "Hết voucher cho chiến dịch này!"}), 400

        points_required = campaign['points_required']
        redemption_code = campaign['redemption_code']

        # Ghi lại việc đổi quà trong Campaign_Service
        cursor.execute("""
            INSERT INTO Campaign_Redemption (campaign_id, user_id, points_spent, redeemed_at)
            VALUES (%s, %s, %s, %s)
        """, (campaign_id, user_id, points_required, datetime.now()))

        # Cập nhật stock (giảm đi 1)
        cursor.execute("""
            UPDATE Campaign
            SET stock = stock - 1
            WHERE campaign_id = %s
        """, (campaign_id,))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Đổi quà thành công!",
            "campaign_id": campaign_id,
            "user_id": user_id,
            "redemption_code": redemption_code,
            "points_required": points_required
        }), 200

    except mysql.connector.Error as err:
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"error": str(err)}), 500
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
            cursor.close()
            conn.close()
        return jsonify({"error": str(e)}), 500

@campaign_bp.route('/campaigns/<int:campaign_id>/redemptions', methods=['GET'])
def get_campaign_redemptions(campaign_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT campaign_id, user_id, points_spent, redeemed_at FROM Campaign_Redemption WHERE campaign_id=%s", (campaign_id,))
        result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@campaign_bp.route('/<int:user_id>/redeemed_campaigns', methods=['GET'])
def get_user_redeemed_campaigns(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
        SELECT c.*, cr.redeemed_at, cr.points_spent
        FROM Campaign c
        JOIN Campaign_Redemption cr ON c.campaign_id = cr.campaign_id
        WHERE cr.user_id = %s
        """
        cursor.execute(query, (user_id,))
        result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@campaign_bp.route('/campaigns/<int:campaign_id>/review_form', methods=['GET', 'POST'])
def review_campaign_form(campaign_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    if request.method == 'POST':
        decision = request.form.get('decision')
        comment = request.form.get('comment')
        if decision not in ['APPROVED', 'REJECTED']:
            return "Lựa chọn không hợp lệ", 400
        try:
            cursor.execute(
                "UPDATE Campaign SET status=%s, approval_comment=%s WHERE campaign_id=%s AND status='PENDING_APPROVAL'",
                (decision, comment, campaign_id)
            )
            if cursor.rowcount == 0:
                return "Chiến dịch không tồn tại hoặc không ở trạng thái PENDING_APPROVAL", 400
            conn.commit()
            return f"Chiến dịch đã được {decision.lower()}.", 200
        except Exception as e:
            return f"Lỗi: {e}", 500

    cursor.execute("SELECT * FROM Campaign WHERE campaign_id=%s", (campaign_id,))
    campaign = cursor.fetchone()
    if not campaign:
        return "Chiến dịch không tồn tại", 404
    cursor.close()
    conn.close()
    return render_template("campaign_service/review_campaign.html", campaign=campaign)

@campaign_bp.route('/campaigns/pending/list', methods=['GET'])
def pending_campaign_list():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Campaign WHERE status = 'PENDING_APPROVAL'")
    campaigns = cursor.fetchall()
    cursor.close()
    conn.close()
    return render_template("campaign_service/pending_campaign_list.html", campaigns=campaigns)

# New APIs for Dashboard
@campaign_bp.route('/get_campaigns/<int:brand_id>', methods=['GET'])
def get_campaigns_by_brand(brand_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT campaign_id, title AS name,
                   CASE
                       WHEN reward LIKE '%Discount%' THEN 'Khuyến mãi'
                       WHEN reward LIKE '%Voucher%' THEN 'Đổi quà'
                       ELSE 'Tích điểm'
                   END AS type,
                   description,
                   DATE_FORMAT(start_at, '%d/%m') AS start_date,
                   DATE_FORMAT(end_at, '%d/%m') AS end_date,
                   status,
                   (SELECT COUNT(*) FROM Campaign_Redemption cr WHERE cr.campaign_id = Campaign.campaign_id) AS participants,
                   1000 AS target_participants, -- Placeholder, adjust as needed
                   (SELECT COUNT(*) FROM Campaign_Redemption cr WHERE cr.campaign_id = Campaign.campaign_id) / 1000 * 100 AS progress
            FROM Campaign
            WHERE brand_id = %s
        """, (brand_id,))
        campaigns = cursor.fetchall()
        cursor.close()
        conn.close()
        if not campaigns:
            return jsonify({"error": "No campaigns found"}), 404
        current = [c for c in campaigns if c['status'] in ['Đang hoạt động', 'Sắp bắt đầu']]
        past = [c for c in campaigns if c['status'] == 'Kết thúc']
        return jsonify({"current": current, "past": past}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@campaign_bp.route('/get_campaign_chart/<int:brand_id>', methods=['GET'])
def get_campaign_chart(brand_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT title AS name,
                   (SELECT COUNT(*) FROM Campaign_Redemption cr WHERE cr.campaign_id = Campaign.campaign_id) AS participants
            FROM Campaign
            WHERE brand_id = %s
            ORDER BY participants DESC, campaign_id DESC LIMIT 5
        """, (brand_id,))
        campaign_data = cursor.fetchall()
        cursor.close()
        conn.close()

        campaign_labels = [c['name'] for c in campaign_data]
        campaign_participants = [c['participants'] for c in campaign_data]

        return jsonify({
            "campaign_chart": {
                "labels": campaign_labels,
                "data": campaign_participants
            }
        }), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@campaign_bp.route('/get_active_campaigns/<int:brand_id>', methods=['GET'])
def get_active_campaigns(brand_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS active_campaigns FROM Campaign WHERE brand_id = %s AND status = 'Đang hoạt động'", (brand_id,))
        active_campaigns = cursor.fetchone()['active_campaigns']
        cursor.close()
        conn.close()
        return jsonify({"active_campaigns": active_campaigns}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@campaign_bp.route('/user_brand_vouchers/<int:user_id>', methods=['GET'])
def get_user_brand_vouchers(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT cr.campaign_redemption_id AS campaign_id, c.title, c.description, cr.points_spent AS points_required,
                   c.redemption_code, cr.status, cr.redeemed_at, c.usage_instructions, c.stock, c.start_at, c.end_at, c.brand_id
            FROM Campaign_Redemption cr
            JOIN Campaign c ON cr.campaign_id = c.campaign_id
            WHERE cr.user_id = %s
            AND cr.status = "Chưa sử dụng"
            ORDER BY cr.redeemed_at DESC
        """, (user_id,))
        vouchers = cursor.fetchall()
        for voucher in vouchers:
            voucher['quantity'] = 1 if voucher['status'] == 'Chưa sử dụng' else 0
        cursor.close()
        conn.close()
        return jsonify(vouchers), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@campaign_bp.route('/get_campaigns', methods=['GET'])
def get_campaigns():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM Campaign
            ORDER BY created_at DESC
        """)
        campaigns = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"campaigns": campaigns}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@campaign_bp.route('/campaign_redemption/<int:campaign_redemption_id>/use', methods=['POST'])
def use_campaign_redemption(campaign_redemption_id):
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({"error": "Thiếu user_id"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Kiểm tra xem voucher có tồn tại và thuộc về user không
        cursor.execute("""
            SELECT * FROM Campaign_Redemption
            WHERE campaign_redemption_id = %s AND user_id = %s AND status = 'Chưa sử dụng'
        """, (campaign_redemption_id, user_id))
        redemption = cursor.fetchone()

        if not redemption:
            cursor.close()
            conn.close()
            return jsonify({"error": "Voucher không tồn tại hoặc đã được sử dụng!"}), 404

        # Cập nhật trạng thái và thời gian sử dụng
        used_at = datetime.now()
        cursor.execute("""
            UPDATE Campaign_Redemption
            SET status = 'Đã sử dụng', used_at = %s
            WHERE campaign_redemption_id = %s AND user_id = %s
        """, (used_at, campaign_redemption_id, user_id))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Sử dụng voucher thành công!",
            "used_at": used_at.isoformat()  # Trả về thời gian sử dụng
        }), 200
    except Exception as e:
        if 'conn' in locals():
            cursor.close()
            conn.close()
        return jsonify({"error": str(e)}), 500

@campaign_bp.route('/user_brand_used_vouchers/<int:user_id>', methods=['GET'])
def get_user_brand_used_vouchers(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Lấy danh sách voucher đã sử dụng từ Brand
        cursor.execute("""
            SELECT cr.campaign_redemption_id, c.redemption_code, cr.used_at, cr.status,
                   c.title, c.description, c.points_required, c.brand_id
            FROM Campaign_Redemption cr
            JOIN Campaign c ON cr.campaign_id = c.campaign_id
            WHERE cr.user_id = %s AND cr.status = 'Đã sử dụng'
            ORDER BY cr.used_at DESC
        """, (user_id,))
        used_vouchers = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(used_vouchers), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@campaign_bp.route('/export_invoice/<int:campaign_id>', methods=['GET'])
def export_campaign_invoice(campaign_id):
    try:
        # Kết nối cơ sở dữ liệu
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Lấy thông tin chiến dịch
        cursor.execute("""
            SELECT c.campaign_id, c.brand_id, c.title, c.description, c.points_required, c.reward,
                   c.start_at, c.end_at, c.campaign_cost, c.brand_ratio, c.mall_ratio
            FROM Campaign c
            WHERE c.campaign_id = %s
        """, (campaign_id,))
        campaign = cursor.fetchone()

        if not campaign:
            cursor.close()
            conn.close()
            return jsonify({"error": "Chiến dịch không tồn tại!"}), 404

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
        elements.append(Paragraph("HÓA ĐƠN CHIẾN DỊCH", title_style))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph(f"Mã chiến dịch: CAMPAIGN-{campaign['campaign_id']}", bold_style))
        elements.append(Spacer(1, 20))

        # Thông tin hóa đơn
        elements.append(Paragraph("THÔNG TIN HÓA ĐƠN", bold_style))
        elements.append(Spacer(1, 10))

        # Dữ liệu hóa đơn dưới dạng bảng
        data = [
            ["Tiêu đề", campaign['title']],
            ["Mô tả", campaign['description']],
            ["Brand", campaign['brand_id']],
            ["Điểm yêu cầu", f"{campaign['points_required']}"],
            ["Phần thưởng", campaign['reward']],
            ["Ngày bắt đầu", campaign['start_at'].strftime('%d/%m/%Y') if campaign['start_at'] else 'N/A'],
            ["Ngày kết thúc", campaign['end_at'].strftime('%d/%m/%Y') if campaign['end_at'] else 'N/A'],
            ["Tổng tiền", f"{campaign['campaign_cost']:,.0f} VND"],
            ["Tỷ lệ Brand", f"{campaign['brand_ratio']}%"],
            ["Tỷ lệ Mall", f"{campaign['mall_ratio']}%"],
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
            download_name=f"Invoice_CAMPAIGN-{campaign['campaign_id']}.pdf",
            mimetype='application/pdf'
        )

    except Exception as e:
        return jsonify({"error": f"Lỗi khi xuất hóa đơn: {str(e)}"}), 500