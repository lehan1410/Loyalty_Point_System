from flask import Flask, render_template, request, jsonify, Blueprint, render_template
import mysql.connector
from datetime import datetime
from flask_cors import CORS

notification_bp = Blueprint("notification", __name__)
CORS(notification_bp)

def get_db_connection():
    return mysql.connector.connect(
        host="free02.123host.vn",
        user="wxuszrya_notification_service",
        password="12345678",
        database="wxuszrya_notification_service"
    )

# def get_db_connection():
#     return mysql.connector.connect(
#         host="han312.mysql.pythonanywhere-services.com",
#         user="han312",
#         password="SOA2025@",
#         database= "han312$notification_service"
#     )

# 1. Lấy danh sách thông báo

@notification_bp.route('/create', methods=['POST'])
def create_notification():
    try:
        data = request.get_json()
        title = data.get("title")
        message = data.get("message")
        end_at = data.get("end_at")
        status = data.get("status", 1)
        noti_type = "marketing"
        target_type = data.get("target_type")  # brand | customer
        target_id = data.get("target_id")      # brand_id nếu là hợp đồng, NULL nếu là customer broadcast

        # Validate
        if not title or not message:
            return jsonify({"success": False, "message": "Thiếu tiêu đề hoặc nội dung"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO Notification (title, message, created_at, end_at, status, type, target_type, target_id)
            VALUES (%s, %s, NOW(), %s, %s, %s, %s, %s)
        """, (title, message, end_at, status, noti_type, target_type, target_id))

        conn.commit()
        cursor.close(); conn.close()
        return jsonify({"success": True, "message": "Tạo system notification thành công"}), 201

    except Exception as e:
        print("❌ Lỗi create_system_notification:", e)
        return jsonify({"success": False, "message": str(e)}), 500
    
@notification_bp.route('/create/system', methods=['POST'])
def create_system_notification():
    """Tạo thông báo hệ thống (system) cho brand/customer"""
    try:
        data = request.get_json()
        title = data.get("title")
        message = data.get("message")
        end_at = data.get("end_at")
        status = data.get("status", 1)
        noti_type = "system"

        target_type = data.get("target_type")  # brand | customer
        target_id = data.get("target_id")      # brand_id nếu là hợp đồng, NULL nếu là customer broadcast

        # Validate
        if not title or not message:
            return jsonify({"success": False, "message": "Thiếu tiêu đề hoặc nội dung"}), 400

        if target_type not in ("brand", "customer"):
            return jsonify({"success": False, "message": "target_type không hợp lệ"}), 400

        # Với brand thì bắt buộc phải có brand_id
        if target_type == "brand" and not target_id:
            return jsonify({"success": False, "message": "Thiếu brand_id cho thông báo hợp đồng"}), 400

        # Với customer (account mới) thì target_id phải NULL (broadcast)
        if target_type == "customer":
            target_id = None

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO Notification (title, message, created_at, end_at, status, type, target_type, target_id)
            VALUES (%s, %s, NOW(), %s, %s, %s, %s, %s)
        """, (title, message, end_at, status, noti_type, target_type, target_id))

        conn.commit()
        cursor.close(); conn.close()
        return jsonify({"success": True, "message": "Tạo system notification thành công"}), 201

    except Exception as e:
        print("❌ Lỗi create_system_notification:", e)
        return jsonify({"success": False, "message": str(e)}), 500




# 3. Cập nhật thông báo
@notification_bp.route('/update_notification/<int:notification_id>', methods=['PUT'])
def update_notification(notification_id):
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            UPDATE Notification
            SET title = %s, message = %s, end_at = %s
            WHERE notification_id = %s
        """
        cursor.execute(query, (
            data['title'],
            data['message'],
            data.get('end_at'),
            notification_id
        ))
        conn.commit()

        return jsonify({'message': 'Notification updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 4. Xóa thông báo
@notification_bp.route('/delete_notification/<int:notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM Notification WHERE notification_id = %s", (notification_id,))
        conn.commit()

        return jsonify({'message': 'Notification deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 5. Tắt/mở thông báo
@notification_bp.route('/toggle_notification_status/<int:notification_id>/toggle', methods=['PATCH'])
def toggle_notification_status(notification_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            UPDATE Notification
            SET status = CASE
               WHEN status = 1 THEN 0
               WHEN status = 0 THEN 1
            END
            WHERE notification_id = %s
            RETURNING status""", (notification_id,))
        conn.commit()

        return jsonify({'message': 'Notification status updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@notification_bp.route('/list', methods=['GET'])
def notification_list():
    """Trả về danh sách thông báo JSON (chỉ những thông báo còn hạn sử dụng)"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT notification_id, title, message, created_at, end_at, status
            FROM Notification
            WHERE status = 1
            AND (end_at IS NULL OR end_at >= NOW())
            ORDER BY created_at DESC
        """)
        rows = cursor.fetchall()

        cursor.close()
        conn.close()
        return jsonify({"success": True, "notifications": rows}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@notification_bp.route('/mark_read/<int:noti_id>', methods=['POST'])
def mark_read(noti_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE Notification SET status = 0 WHERE notification_id = %s", (noti_id,))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    
@notification_bp.route('/mark_all_read', methods=['POST'])
def mark_all_read():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE Notification SET status = 0 WHERE type='system' AND status=1")
        conn.commit()
        cur.close(); conn.close()
        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    
@notification_bp.route('/list/system', methods=['GET'])
def system_notifications():
    """Trả về thông báo hệ thống cho Mall admin"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT notification_id, title, message, created_at, end_at, status
            FROM Notification
            WHERE status = 1
              AND type = 'system'
              AND (end_at IS NULL OR end_at >= NOW())
            ORDER BY created_at DESC
        """)
        rows = cursor.fetchall()

        cursor.close()
        conn.close()
        return jsonify({"success": True, "notifications": rows}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    
@notification_bp.route('/list/<target_type>/<target_id>', methods=['GET'])
def notification_list_for_target(target_type, target_id):
    """
    target_type: 'customer' | 'brand' | 'mall'
    target_id: id cụ thể
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT notification_id, title, message, created_at, end_at, status, target_type
            FROM Notification
            WHERE status = 1
              AND (end_at IS NULL OR end_at >= NOW())
              AND (target_type = %s OR target_type = 'all')
              AND (target_id = %s OR target_id IS NULL)
            ORDER BY created_at DESC
        """, (target_type, target_id))
        rows = cursor.fetchall()

        cursor.close()
        conn.close()
        return jsonify({"success": True, "notifications": rows}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
@notification_bp.route('/list/customer/<int:customer_id>', methods=['GET'])
def customer_notifications(customer_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Chỉ lấy thông báo type=marketing (đặt `type` trong backtick để tránh conflict MySQL)
        query = """
            SELECT 
                notification_id, title, message, created_at, end_at, status, `type`, target_type
            FROM Notification
            WHERE status = 1
              AND `type` = 'marketing'
              AND (end_at IS NULL OR end_at >= NOW())
              AND (target_type = 'customer' OR target_type = 'all')
              AND (target_id = %s OR target_id IS NULL)
            ORDER BY created_at DESC
        """
        cursor.execute(query, (customer_id,))
        rows = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify({"success": True, "notifications": rows}), 200

    except Exception as e:
        print("❌ Lỗi customer_notifications:", e)
        return jsonify({"success": False, "message": str(e)}), 500

@notification_bp.route('/create_no', methods=['POST'])
def create_notification_account():
    try:
        data = request.get_json()
        title = data.get("title")
        message = data.get("message")
        end_at = data.get("end_at")
        status = data.get("status", 1)
        noti_type = "system"
        target_type = data.get("target_type", "all")  # customer | brand | all
        target_id = data.get("target_id")

        # Validate
        if not title or not message:
            return jsonify({"success": False, "message": "Thiếu tiêu đề hoặc nội dung"}), 400

        if target_type not in ("customer", "brand", "all"):
            return jsonify({"success": False, "message": "target_type không hợp lệ"}), 400

        if target_type == "brand" and not target_id:
            return jsonify({"success": False, "message": "Thiếu brand_id cho thông báo brand"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO Notification (title, message, created_at, end_at, status, type, target_type, target_id)
            VALUES (%s, %s, NOW(), %s, %s, %s, %s, %s)
        """, (title, message, end_at, status, noti_type, target_type, target_id))

        conn.commit()
        cursor.close(); conn.close()
        return jsonify({"success": True, "message": "Tạo thông báo thành công"}), 201

    except Exception as e:
        print("❌ Lỗi create_notification:", e)
        return jsonify({"success": False, "message": str(e)}), 500
@notification_bp.route('/list/brand/marketing/<int:brand_id>', methods=['GET'])
def brand_marketing_notifications(brand_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                notification_id, title, message, created_at, end_at, status, `type`, target_type
            FROM Notification
            WHERE status = 1
              AND `type` = 'marketing'
              AND (end_at IS NULL OR end_at >= NOW())
              AND (target_type = 'brand' OR target_type = 'all')
              AND (target_id = %s OR target_id IS NULL)
            ORDER BY created_at DESC
        """
        cursor.execute(query, (brand_id,))
        rows = cursor.fetchall()

        cursor.close()
        conn.close()
        return jsonify({"success": True, "notifications": rows}), 200

    except Exception as e:
        print("❌ Lỗi brand_marketing_notifications:", e)
        return jsonify({"success": False, "message": str(e)}), 500
@notification_bp.route('/list/brand/system/<int:brand_id>', methods=['GET'])
def brand_system_notifications(brand_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                notification_id, title, message, created_at, end_at, status, `type`, target_type
            FROM Notification
            WHERE status = 1
              AND `type` = 'system'
              AND (end_at IS NULL OR end_at >= NOW())
              AND target_type = 'brand'
              AND target_id = %s
            ORDER BY created_at DESC
        """
        cursor.execute(query, (brand_id,))
        rows = cursor.fetchall()

        cursor.close()
        conn.close()
        return jsonify({"success": True, "notifications": rows}), 200

    except Exception as e:
        print("❌ Lỗi brand_system_notifications:", e)
        return jsonify({"success": False, "message": str(e)}), 500

@notification_bp.route('/list/mall', methods=['GET'])
def mall_notifications():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                notification_id, title, message, created_at, end_at, status, `type`, target_type
            FROM Notification
            WHERE status = 1
              AND (end_at IS NULL OR end_at >= NOW())
              AND (type = 'marketing')
            ORDER BY created_at DESC
        """
        cursor.execute(query)
        rows = cursor.fetchall()

        cursor.close()
        conn.close()
        return jsonify({"success": True, "notifications": rows}), 200

    except Exception as e:
        print("❌ Lỗi mall_notifications:", e)
        return jsonify({"success": False, "message": str(e)}), 500