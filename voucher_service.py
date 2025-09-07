from flask import request, jsonify, Blueprint, render_template
import mysql.connector
from flask_cors import CORS
from datetime import datetime

voucher_bp = Blueprint("voucher", __name__, template_folder='templates')
CORS(voucher_bp)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        port=3307,
        user="root",
        password="",
        database="voucher_service"
    )

# def get_db_connection():
#     return mysql.connector.connect(
#         host="han312.mysql.pythonanywhere-services.com",
#         user="han312",
#         password="SOA2025@",
#         database= "han312$voucher_service"
#     )

# 1. Tạo voucher
@voucher_bp.route('/vouchers', methods=['POST'])
def create_voucher():
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
        INSERT INTO Voucher (brand_id, title, description, points_required, discount_amount, created_at, start_at, end_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            1, data['title'], data['description'],
            data['points_required'], data['discount_amount'], datetime.now(),
            data['start_at'], data['end_at']
        ))
        conn.commit()
        return jsonify({"message": "Voucher created"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 2. Cập nhật voucher
@voucher_bp.route('/vouchers/<int:voucher_id>', methods=['PUT'])
def update_voucher(voucher_id):
    data = request.json
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
        UPDATE Voucher SET title=%s, description=%s, points_required=%s,
        discount_amount=%s, start_at=%s, end_at=%s
        WHERE voucher_id=%s
        """

        cursor.execute(query, (
            data['title'], data['description'], data['points_required'],
            data['discount_amount'], data['start_at'], data['end_at'], voucher_id
        ))
        conn.commit()
        return jsonify({"message": "Voucher updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 3. Xóa voucher
@voucher_bp.route('/vouchers/<int:voucher_id>', methods=['DELETE'])
def delete_voucher(voucher_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Kiểm tra xem voucher có tồn tại không
        cursor.execute("SELECT * FROM Voucher WHERE voucher_id = %s", (voucher_id,))
        if cursor.fetchone() is None:
            return jsonify({"message": "Voucher không tồn tại."}), 404

        # Xóa voucher
        cursor.execute("DELETE FROM Voucher WHERE voucher_id = %s", (voucher_id,))
        conn.commit()

        return jsonify({"message": "Voucher đã được xóa thành công."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 4. Lấy chi tiết voucher
@voucher_bp.route('/vouchers/<int:voucher_id>', methods=['GET'])
def get_voucher(voucher_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Voucher WHERE voucher_id=%s", (voucher_id,))
        voucher = cursor.fetchone()
        return jsonify(voucher)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 5. Lọc danh sách voucher
@voucher_bp.route('/vouchers', methods=['GET'])
def list_vouchers():
    brand_id = request.args.get('brand_id')
    mall_only = request.args.get('mall_only', 'false').lower() == 'true'  # New parameter to fetch mall-wide vouchers

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT voucher_id, title, description, points_required, discount_amount, created_at, start_at, end_at, brand_id
            FROM Voucher
            WHERE 1=1
        """
        params = []

        # If mall_only is true, fetch vouchers where brand_id is NULL (or a specific mall brand_id)
        if mall_only:
            query += " AND brand_id IS NULL"
        elif brand_id:
            query += " AND brand_id = %s"
            params.append(brand_id)

        # Optional: Add status filtering (e.g., only active vouchers)
        query += " AND start_at <= %s AND end_at >= %s"
        params.extend([datetime.now(), datetime.now()])

        query += " ORDER BY created_at DESC"

        cursor.execute(query, tuple(params))
        result = cursor.fetchall()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

# 6. Đổi voucher
@voucher_bp.route('/vouchers/<int:voucher_id>/redeem', methods=['POST'])
def redeem_voucher(voucher_id):
    try:
        # Lấy dữ liệu từ request
        data = request.get_json()
        user_id = data.get('user_id')
        points_spent = data.get('points_spent')
        redemption_code = data.get('redemption_code')
        if not user_id or not points_spent or not redemption_code:
            return jsonify({"error": "Thiếu thông tin cần thiết (user_id, points_spent, redemption_code)"}), 400

        # Kết nối cơ sở dữ liệu
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Lấy thông tin voucher, bao gồm stock
        cursor.execute("""
            SELECT stock
            FROM Voucher
            WHERE voucher_id = %s FOR UPDATE
        """, (voucher_id,))
        voucher = cursor.fetchone()
        if not voucher:
            conn.rollback()
            cursor.close()
            conn.close()
            return jsonify({"error": "Voucher không tồn tại!"}), 404

        # Kiểm tra stock
        if voucher['stock'] <= 0:
            conn.rollback()
            cursor.close()
            conn.close()
            return jsonify({"error": "Hết voucher!"}), 400

        # Ghi lại việc đổi quà trong Voucher_Redemption
        cursor.execute("""
            INSERT INTO Voucher_Redemption (voucher_id, user_id, points_spent, redemption_code, redeemed_at, status)
            VALUES (%s, %s, %s, %s, %s, 'Chưa sử dụng')
        """, (voucher_id, user_id, points_spent, redemption_code, datetime.now()))

        # Cập nhật stock (giảm đi 1)
        cursor.execute("""
            UPDATE Voucher
            SET stock = stock - 1
            WHERE voucher_id = %s
        """, (voucher_id,))

        # Commit giao dịch
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "message": "Đổi quà thành công!",
            "voucher_id": voucher_id,
            "user_id": user_id,
            "redemption_code": redemption_code,
            "points_spent": points_spent
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

@voucher_bp.route('/get_rewards/<int:brand_id>', methods=['GET'])
def get_rewards(brand_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT
                voucher_id AS reward_id,
                title AS name,
                description,
                points_required AS points,
                discount_amount AS discount,
                start_at AS start_time,
                end_at AS end_time,
                CASE
                    WHEN NOW() BETWEEN start_at AND end_at THEN 'Đang hoạt động'
                    ELSE 'Hết hạn'
                END AS status,
                stock ,
                initial_stock
            FROM Voucher
            WHERE brand_id = %s
        """, (brand_id,))
        rewards = cursor.fetchall()
        cursor.close()
        conn.close()
        if not rewards:
            return jsonify({"error": "No rewards found"}), 404
        return jsonify({"rewards": rewards}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@voucher_bp.route('/get_reward_chart/<int:brand_id>', methods=['GET'])
def get_reward_chart(brand_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT v.title AS name,
                   COUNT(vr.redemption_id) AS redeemed
            FROM Voucher v
            LEFT JOIN Voucher_Redemption vr ON v.voucher_id = vr.voucher_id
            WHERE v.brand_id = %s
            GROUP BY v.voucher_id, v.title
            ORDER BY redeemed DESC LIMIT 5
        """, (brand_id,))
        reward_data = cursor.fetchall()
        cursor.close()
        conn.close()

        reward_labels = [r['name'] for r in reward_data]
        reward_redeemed = [r['redeemed'] for r in reward_data]

        return jsonify({
            "reward_chart": {
                "labels": reward_labels,
                "data": reward_redeemed
            }
        }), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@voucher_bp.route('/get_rewards_redeemed/<int:brand_id>', methods=['GET'])
def get_rewards_redeemed(brand_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS rewards_redeemed FROM Voucher_Redemption WHERE voucher_id IN (SELECT voucher_id FROM Voucher WHERE brand_id = %s)", (brand_id,))
        rewards_redeemed = cursor.fetchone()['rewards_redeemed']
        cursor.close()
        conn.close()
        return jsonify({"rewards_redeemed": rewards_redeemed}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@voucher_bp.route('/<int:user_id>/redeemed_vouchers', methods=['GET'])
def get_user_redeemed_vouchers(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            SELECT v.*, vr.redeemed_at, vr.points_spent, vr.redemption_code
            FROM Voucher v
            JOIN Voucher_Redemption vr ON v.voucher_id = vr.voucher_id
            WHERE vr.user_id = %s
        """
        cursor.execute(query, (user_id,))
        result = cursor.fetchall()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@voucher_bp.route('/voucher', methods=['GET'])
def create_voucher_page():
    user_id = request.args.get('user_id', '')
    user_name = request.args.get('user_name', '')
    user = {"user_id": user_id, "user_name": user_name}
    return render_template('/voucher_service/create_voucher.html', user=user)

@voucher_bp.route('/create_voucher', methods=['POST'])
def create_voucher_form():
    data = request.form
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        query = """
        INSERT INTO Voucher (brand_id, title, description, points_required, discount_amount, created_at, start_at, end_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (
            1, data['title'], data['description'],
            data['points_required'], data['discount_amount'], datetime.now(),
            data['start_at'], data['end_at']
        ))
        conn.commit()
        return jsonify({"message": "Voucher created"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@voucher_bp.route('/user_mall_vouchers/<int:user_id>', methods=['GET'])
def get_user_mall_vouchers(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT vr.redemption_id AS voucher_id, v.title, v.description, vr.points_spent AS points_required,
                   vr.redemption_code, vr.status, vr.redeemed_at, v.usage_instructions, v.start_at, v.end_at
            FROM Voucher_Redemption vr
            JOIN Voucher v ON vr.voucher_id = v.voucher_id
            WHERE vr.user_id = %s
            AND vr.status = "Chưa sử dụng"
            ORDER BY vr.redeemed_at DESC
        """, (user_id,))
        vouchers = cursor.fetchall()
        # Thêm số lượng
        for voucher in vouchers:
            voucher['quantity'] = 1 if voucher['status'] == 'Chưa sử dụng' else 0
        cursor.close()
        conn.close()
        return jsonify(vouchers), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

@voucher_bp.route('/voucher_redemption/<int:redemption_id>/use', methods=['POST'])
def use_voucher_redemption(redemption_id):
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        if not user_id:
            return jsonify({"error": "Thiếu user_id"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()

        # Kiểm tra xem voucher có tồn tại và thuộc về user không
        cursor.execute("""
            SELECT * FROM Voucher_Redemption
            WHERE redemption_id = %s AND user_id = %s AND status = 'Chưa sử dụng'
        """, (redemption_id, user_id))
        redemption = cursor.fetchone()

        if not redemption:
            cursor.close()
            conn.close()
            return jsonify({"error": "Voucher không tồn tại hoặc đã được sử dụng!"}), 404

        # Cập nhật trạng thái và thời gian sử dụng
        used_at = datetime.now()
        cursor.execute("""
            UPDATE Voucher_Redemption
            SET status = 'Đã sử dụng', used_at = %s
            WHERE redemption_id = %s AND user_id = %s
        """, (used_at, redemption_id, user_id))

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

@voucher_bp.route('/user_mall_used_vouchers/<int:user_id>', methods=['GET'])
def get_user_mall_used_vouchers(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Lấy danh sách voucher đã sử dụng từ Mall
        cursor.execute("""
            SELECT vr.redemption_id, vr.redemption_code, vr.used_at, vr.status,
                   v.title, v.description, v.points_required
            FROM Voucher_Redemption vr
            JOIN Voucher v ON vr.voucher_id = v.voucher_id
            WHERE vr.user_id = %s AND vr.status = 'Đã sử dụng'
            ORDER BY vr.used_at DESC
        """, (user_id,))
        used_vouchers = cursor.fetchall()

        cursor.close()
        conn.close()

        return jsonify(used_vouchers), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500