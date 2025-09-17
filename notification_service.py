from flask import Flask, render_template, request, jsonify, Blueprint, render_template
import mysql.connector
from datetime import datetime
from flask_cors import CORS

notification_bp = Blueprint("notification", __name__)
CORS(notification_bp)

BRAND_SERVICE_URL = "http://localhost:5000/brand/get_brand"

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        port=3307,
        user="root",
        password="",
        database="notification_service"
    )

# def get_db_connection():
#     return mysql.connector.connect(
#         host="han312.mysql.pythonanywhere-services.com",
#         user="han312",
#         password="SOA2025@",
#         database= "han312$notification_service"
#     )

# 0. Lấy tất cả thông báo
@notification_bp.route('/get_notification', methods=['GET'])
def get_notification():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Notification ORDER BY created_at DESC")
        notifications = cursor.fetchall()
        return jsonify({"notifications": notifications}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conn.close()

# 0.1. Lấy thông báo theo ID
@notification_bp.route('/get_notification/<int:notification_id>', methods=['GET'])
def get_notification_by_id(notification_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Notification WHERE notification_id = %s", (notification_id,))
        notification = cursor.fetchone()
        if not notification:
            return jsonify({"success": False, "message": "Không tìm thấy"}), 404
        return jsonify({"success": True, "notification": notification}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close(); conn.close()

# 1. Đếm tất cả
@notification_bp.route('/count_total', methods=['GET'])
def count_total_notifications():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS total FROM Notification")
        result = cursor.fetchone()
        return jsonify({"total_notifications": result["total"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conn.close()

# 1.1. Đếm thông báo bật
@notification_bp.route('/count_active', methods=['GET'])
def count_active_notifications():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS total FROM Notification WHERE status = 1")
        result = cursor.fetchone()
        return jsonify({"active_notifications": result["total"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conn.close()

# 1.2. Đếm thông báo tắt
@notification_bp.route('/count_inactive', methods=['GET'])
def count_inactive_notifications():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS total FROM Notification WHERE status = 0")
        result = cursor.fetchone()
        return jsonify({"inactive_notifications": result["total"]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close(); conn.close()

# 2. Hiển thị HTML
@notification_bp.route('/notification', methods=['GET'])
def notification():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Notification WHERE status = 1 ORDER BY created_at DESC")
        notifications = cursor.fetchall()
        return render_template('notification_service/notification.html', notifications=notifications)
    except Exception as e:
        return render_template('notification_service/error.html', message=str(e)), 500
    finally:
        cursor.close(); conn.close()

# 3. Tạo
@notification_bp.route('/create_notification', methods=['POST'])
def create_notification():
    data = request.get_json()
    try:
        title = data.get('title')
        message = data.get('message')
        started_at = datetime.strptime(data.get('started_at'), "%Y-%m-%dT%H:%M")
        end_at = datetime.strptime(data.get('end_at'), "%Y-%m-%dT%H:%M") if data.get('end_at') else None
        status = 1 if str(data.get('status',1))=="1" else 0
        noti_type = data.get('type','marketing')
        target_type = data.get('target_type','customer')
        target_id = data.get('target_id')

        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """INSERT INTO Notification(title,message,started_at,end_at,status,type,target_type,target_id)
                 VALUES(%s,%s,%s,%s,%s,%s,%s,%s)"""
        cursor.execute(sql,(title,message,started_at,end_at,status,noti_type,target_type,target_id))
        conn.commit()
        return jsonify({"message":"Tạo thành công"}),201
    except Exception as e:
        return jsonify({"error":str(e)}),500
    finally:
        cursor.close(); conn.close()

# 4. Cập nhật
@notification_bp.route('/update_notification/<int:notification_id>', methods=['PUT'])
def update_notification(notification_id):
    data = request.get_json()
    try:
        title = data.get('title')
        message = data.get('message')
        started_at = datetime.strptime(data.get('started_at'), "%Y-%m-%dT%H:%M") if data.get('started_at') else None
        end_at = datetime.strptime(data.get('end_at'), "%Y-%m-%dT%H:%M") if data.get('end_at') else None
        status = 1 if str(data.get('status',1)) in ("1","true","True","on") else 0
        noti_type = data.get('type','marketing')
        target_type = data.get('target_type','customer')
        target_id = data.get('target_id')

        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """UPDATE Notification 
                 SET title=%s,message=%s,started_at=%s,end_at=%s,status=%s,type=%s,target_type=%s,target_id=%s
                 WHERE notification_id=%s"""
        cursor.execute(sql,(title,message,started_at,end_at,status,noti_type,target_type,target_id,notification_id))
        conn.commit()
        return jsonify({"message":"Cập nhật thành công"}),200
    except Exception as e:
        return jsonify({"error":str(e)}),500
    finally:
        cursor.close(); conn.close()

# 5. Xóa
@notification_bp.route('/delete_notification/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Notification WHERE notification_id=%s",(notification_id,))
        conn.commit()
        return jsonify({"message":"Xóa thành công"}),200
    except Exception as e:
        return jsonify({"error":str(e)}),500
    finally:
        cursor.close(); conn.close()


# 6. Danh sách thông báo còn hạn
@notification_bp.route('/list', methods=['GET'])
def notification_list():
    """
    Lấy thông báo active (status=1) và chưa hết hạn
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM Notification
            WHERE status=1 AND (end_at IS NULL OR end_at>=NOW())
            ORDER BY created_at DESC
        """)
        rows = cursor.fetchall()
        return jsonify({"success":True,"notifications":rows}),200
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}),500
    finally:
        cursor.close(); conn.close()

# 7. Đánh dấu đã đọc
@notification_bp.route('/mark_read/<int:noti_id>', methods=['POST'])
def mark_read(noti_id):
    """
    Đánh dấu 1 thông báo là đã đọc (is_read = 1)
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE Notification SET is_read = 1 WHERE notification_id = %s", (noti_id,))
        conn.commit()

        if cur.rowcount == 0:
            return jsonify({"success": False, "message": "Không tìm thấy thông báo"}), 404

        return jsonify({"success": True, "message": "Đã đánh dấu đã đọc"}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()

# 8. Đánh dấu tất cả đã đọc
@notification_bp.route('/mark_all_read', methods=['POST'])
def mark_all_read():
    """
    Đánh dấu tất cả thông báo còn active (status=1) thành đã đọc (is_read=1)
    Có thể mở rộng: filter theo target_type/target_id nếu cần
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE Notification SET is_read = 1 WHERE status = 1 AND is_read = 0")
        conn.commit()

        return jsonify({
            "success": True,
            "message": f"Đã đánh dấu {cur.rowcount} thông báo là đã đọc"
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cur.close(); conn.close()


# 9. Thông báo hệ thống cho admin
@notification_bp.route('/list/system', methods=['GET'])
def system_notifications():
    """
    Lấy thông báo type=system còn hạn
    """
    try:
        conn=get_db_connection()
        cursor=conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM Notification
            WHERE status=1 AND type='system'
            AND (end_at IS NULL OR end_at>=NOW())
            ORDER BY created_at DESC
        """)
        rows=cursor.fetchall()
        return jsonify({"success":True,"notifications":rows}),200
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}),500
    finally:
        cursor.close(); conn.close()


# 10. Thông báo chưa đọc cho customer
@notification_bp.route('/list/customer/<target_type>/<int:target_id>', methods=['GET'])
def customer_notifications(target_type, target_id):
    """
    Lấy danh sách thông báo chưa đọc cho customer/brand
    - status=1
    - is_read=0
    - còn hạn (end_at IS NULL hoặc end_at >= NOW())
    - lọc theo target_type + target_id, hoặc all
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM Notification
            WHERE status = 1
              AND (end_at IS NULL OR end_at >= NOW())
              AND (target_type = %s OR target_type = 'all')
              AND (target_id = %s OR target_id IS NULL)
              AND is_read = 0
            ORDER BY created_at DESC
        """, (target_type, target_id))
        rows = cursor.fetchall()
        return jsonify({"success": True, "notifications": rows}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        cursor.close(); conn.close()


# 11. Lấy thông báo marketing cho brand
@notification_bp.route('/list/brand/marketing/<int:brand_id>', methods=['GET'])
def brand_marketing_notifications(brand_id):
    try:
        conn=get_db_connection()
        cursor=conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM Notification
            WHERE status=1 AND type='marketing'
              AND (end_at IS NULL OR end_at>=NOW())
              AND (target_type='brand' OR target_type='all')
              AND (target_id=%s OR target_id IS NULL)
            ORDER BY created_at DESC
        """,(brand_id,))
        rows=cursor.fetchall()
        return jsonify({"success":True,"notifications":rows}),200
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}),500
    finally:
        cursor.close(); conn.close()

# 12. Lấy thông báo system cho brand
@notification_bp.route('/list/brand/system/<int:brand_id>', methods=['GET'])
def brand_system_notifications(brand_id):
    try:
        conn=get_db_connection()
        cursor=conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT * FROM Notification
            WHERE status=1 AND type='system'
              AND (end_at IS NULL OR end_at>=NOW())
              AND target_type='brand'
              AND target_id=%s
            ORDER BY created_at DESC
        """,(brand_id,))
        rows=cursor.fetchall()
        return jsonify({"success":True,"notifications":rows}),200
    except Exception as e:
        return jsonify({"success":False,"message":str(e)}),500
    finally:
        cursor.close(); conn.close()

# 6. Kiểm tra hợp đồng
# API: Đồng bộ thông báo từ các hợp đồng sắp hết hạn
@notification_bp.route("/sync_contract_notifications", methods=["GET"])
def sync_contract_notifications():
    try:
        # 1. Gọi Brand Service để lấy danh sách hợp đồng
        response = requests.get(BRAND_SERVICE_URL, timeout=10)
        if response.status_code != 200:
            return jsonify({"error": "Không thể lấy dữ liệu từ Brand Service"}), 500

        data = response.json()
        contracts = data.get("brands", [])
        today = datetime.today().date()
        warning_date = today + timedelta(days=30)

        expiring_contracts = []

        # 2. Lọc hợp đồng sắp hết hạn (end_at trong vòng 30 ngày tới)
        for c in contracts:
            if not c.get("end_at"):
                continue

            try:
                end_date = datetime.strptime(c["end_at"], "%a, %d %b %Y %H:%M:%S %Z").date()
            except Exception:
                continue  # bỏ qua nếu format lỗi

            if today <= end_date <= warning_date:
                expiring_contracts.append({
                    "contract_id": c["contract_id"],
                    "brand_id": c["brand_id"],
                    "brandname": c["brandname"],
                    "end_at": str(end_date),
                    "user_id": c["user_id"],
                    "message": f"Hợp đồng của Brand {c['brandname']} sẽ hết hạn vào {end_date}"
                })

                # 3. Ở đây bạn có thể lưu expiring_contracts vào bảng CustomerNotification
                # hoặc gọi CustomerNotification API tạo thông báo mới

        return jsonify({
            "success": True,
            "expiring_contracts": expiring_contracts,
            "count": len(expiring_contracts)
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500