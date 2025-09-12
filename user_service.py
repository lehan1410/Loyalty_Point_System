from flask import Blueprint, render_template, request, jsonify, redirect, url_for
import mysql.connector
from flask_cors import CORS
from datetime import datetime, timedelta

user_bp = Blueprint("user", __name__)
CORS(user_bp)

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        port=3307,
        user="root",
        password="",
        database="user_service"
    )

# def get_db_connection():
#     return mysql.connector.connect(
#         host="han312.mysql.pythonanywhere-services.com",
#         user="han312",
#         password="SOA2025@",
#         database= "han312$user_service"
#     )

@user_bp.route('/login', methods=['GET'])
def login_page():
    return_url = request.args.get('return_url', '/user/customer')
    return render_template("login.html", return_url=return_url)

@user_bp.route('/transaction_qr', methods=['GET'])
def transaction_qr_page():
    user_id = request.args.get('user_id')
    user_name = request.args.get('username', 'Khách hàng')
    # Kiểm tra đăng nhập và vai trò
    if not user_id:
        return redirect(url_for('user.login_page', return_url=request.url))

    # Lấy dữ liệu từ query string và truyền vào template
    transaction_data = {
        "user_id": user_id,
        "brand_id": request.args.get('brand_id'),
        "invoice_code": request.args.get('invoice_code'),
        "amount": request.args.get('amount'),
        "created_at": request.args.get('created_at'),
    }
    user_snapshot_id = request.args.get('user_snapshot_id')
    return render_template("transaction_qr.html", transaction_data=transaction_data, user_snapshot_id=user_snapshot_id, user_name=user_name)

# Xử lý đăng nhập (POST)
@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    return_url = data.get('return_url', None)  # Lấy return_url từ dữ liệu gửi lên

    if not username or not password:
        return jsonify({"success": False, "message": "Thiếu tên đăng nhập hoặc mật khẩu!"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Users WHERE username = %s AND password = %s AND status = 1", (username, password))
    user = cursor.fetchone()

    if not user:
        conn.close()
        return jsonify({"success": False, "message": "Tên đăng nhập hoặc mật khẩu không đúng!"}), 401

    user_id = user['user_id']
    role = None
    redirect_url = None

    cursor.execute("SELECT * FROM Customer WHERE user_id = %s", (user_id,))
    if cursor.fetchone():
        role = "customer"

    cursor.execute("SELECT brand_id FROM Brand WHERE user_id = %s", (user_id,))
    brand = cursor.fetchone()
    if brand:
        role = "brand"

    cursor.execute("SELECT * FROM Mall WHERE user_id = %s", (user_id,))
    if cursor.fetchone():
        role = "mall"

    conn.close()

    if not role:
        return jsonify({"success": False, "message": "Người dùng không thuộc bất kỳ vai trò nào!"}), 403

    if return_url:
        from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

        parsed = urlparse(return_url)
        query = parse_qs(parsed.query)
        query['user_id'] = [str(user_id)]
        query['username'] = [username]
        new_query = urlencode(query, doseq=True)
        redirect_url = urlunparse(parsed._replace(query=new_query))
    else:
        if role == "customer":
            redirect_url = f"/user/customer?user_id={user_id}&username={username}"
        elif role == "brand":
            redirect_url = f"/user/brand?user_id={user_id}&username={username}&brand_id={brand['brand_id']}"
        elif role == "mall":
            redirect_url = f"/user/mall?user_id={user_id}&username={username}"

    return jsonify({
        "success": True,
        "role": role,
        "redirect": redirect_url
    })

# Trang tương ứng mỗi vai trò
@user_bp.route('/customer')
def customer_page():
    user_id = request.args.get('user_id')
    user_name = request.args.get('username', '')

    

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT membertype FROM Customer WHERE user_id = %s", (user_id,))
    customer = cursor.fetchone()
    conn.close()
    # Map membertype to membership name
    membertype_map = {
        1: 'Thành viên Bạc',
        2: 'Thành viên Vàng',
        3: 'Thành viên Kim cương'
    }
    if customer and customer['membertype'] in membertype_map:
        membership = membertype_map[customer['membertype']]
    else:
        membership = 'Thành viên'
    return render_template("customer.html", user={"user_id": user_id, "user_name": user_name, "membership": membership})
@user_bp.route('/brand')
def brand_page():
    user_id = request.args.get('user_id')
    user_name = request.args.get('username')
    brand_id = request.args.get('brand_id')

    if not user_id:
        return jsonify({"error": "Thiếu user_id"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT brand_id FROM Brand WHERE user_id = %s", (user_id,))
    brand = cursor.fetchone()
    conn.close()

    if not brand:
        return jsonify({"error": "Không tìm thấy thương hiệu cho user_id này"}), 404

    return render_template("brand.html", user={"user_id": user_id, "user_name": user_name, "brand_id": brand_id})

@user_bp.route('/mall')
def mall_page():
    data = request.args
    user_id = data.get('user_id')
    user_name = data.get('username')
    return render_template("mall.html", user={"user_id": user_id, "user_name": user_name})

# API lấy thông tin người dùng
@user_bp.route('/infor', methods=['POST'])
def infor():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({"success": False, "message": "Thiếu user_id!"}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM User_Profile WHERE user_id = %s", (user_id,))
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({"success": True, "message": "Thông tin người dùng", "user": user}), 200
    else:
        return jsonify({"success": False, "message": "Không tìm thấy người dùng!"}), 404

@user_bp.route('/logout')
def logout():
    return render_template("login.html")

@user_bp.route('/manage_account', methods=['GET'])
def manage_account():
    user_id = request.args.get('user_id')
    user_name = request.args.get('user_name')
    return render_template("user_service/mall_manage_account.html", user={"user_id": user_id, "user_name": user_name})

@user_bp.route('/account_customer', methods=['GET'])
def account_customer():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Users join User_Profile on Users.user_id = User_Profile.user_id join customer on Users.user_id = customer.user_id")
    user = cursor.fetchall()
    conn.close()
    return jsonify({"user": user}), 200

@user_bp.route('/account_brand', methods=['GET'])
def account_brand():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Users join User_Profile on Users.user_id = User_Profile.user_id join Brand on Users.user_id = Brand.user_id")
    user = cursor.fetchall()
    conn.close()
    return jsonify({"user": user}), 200

@user_bp.route('/account_mall', methods=['GET'])
def account_mall():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM Users join User_Profile on Users.user_id = User_Profile.user_id join Mall on Users.user_id = Mall.user_id")
    user = cursor.fetchall()
    conn.close()
    return jsonify({"user": user}), 200

@user_bp.route('/update_status/<int:user_id>/<int:status>', methods=['POST'])
def update_status(user_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE Users SET status = %s WHERE user_id = %s", (status, user_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Cập nhật trạng thái thành công!"}), 200

# Lấy thông tin user theo IDbạn không
@user_bp.route('/get_user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT *
        FROM Users
        JOIN Customer ON Users.user_id = Customer.user_id
        JOIN MemberTypeCoefficient ON Customer.membertype = MemberTypeCoefficient.membertype
        WHERE Users.user_id = %s
    """, (user_id,))
    user = cursor.fetchone()
    conn.close()

    if user:
        return jsonify({"success": True, "user": user}), 200
    else:
        return jsonify({"success": False, "message": "Không tìm thấy người dùng!"}), 404

# Đếm số lượng user
@user_bp.route('/count_user', methods=['GET'])
def count_user():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT COUNT(*) as count FROM Users join Customer on Users.user_id = Customer.user_id")
    count = cursor.fetchone()
    conn.close()

    if count:
        return jsonify({"success": True, "count": count['count']}), 200
    else:
        return jsonify({"success": False, "message": "Không tìm thấy người dùng!"}), 404

# Đếm số lượng admin
@user_bp.route('/count_admin', methods=['GET'])
def count_admin():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT COUNT(*) as count FROM Users join Mall on Users.user_id = Mall.user_id")
    count = cursor.fetchone()
    conn.close()

    if count:
        return jsonify({"success": True, "count": count['count']}), 200
    else:
        return jsonify({"success": False, "message": "Không tìm thấy người dùng!"}), 404

# Đếm tổng số lượng tài khoản
@user_bp.route('/count_total', methods=['GET'])
def count_total():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT COUNT(*) as count FROM Users")
    count = cursor.fetchone()
    conn.close()

    if count:
        return jsonify({"success": True, "count": count['count']}), 200
    else:
        return jsonify({"success": False, "message": "Không tìm thấy người dùng!"}), 404

# Quản lý brand
@user_bp.route('/manage_brand', methods=['GET'])
def manage_brand():
    user_id = request.args.get('user_id')
    user_name = request.args.get('user_name')
    return render_template("user_service/manage_brand.html", user={"user_id": user_id, "user_name": user_name})

# Quản lý điểm
@user_bp.route('/manage_point', methods=['GET'])
def manage_point():
    user_id = request.args.get('user_id')
    user_name = request.args.get('user_name')
    return render_template("user_service/manage_point.html", user={"user_id": user_id, "user_name": user_name})

# Quản lý chiến dịch
@user_bp.route('/manage_campaign', methods=['GET'])
def manage_campaign():
    user_id = request.args.get('user_id')
    user_name = request.args.get('user_name')
    return render_template("user_service/manage_campaign.html", user={"user_id": user_id, "user_name": user_name})

# Quản lý ưu đãi
@user_bp.route('/manage_discount', methods=['GET'])
def manage_discount():
    user_id = request.args.get('user_id')
    user_name = request.args.get('user_name')
    return render_template("user_service/manage_discount.html", user={"user_id": user_id, "user_name": user_name})

# Quản lý thông báo
@user_bp.route('/manage_notification', methods=['GET'])
def manage_notification():
    user_id = request.args.get('user_id')
    user_name = request.args.get('user_name')
    return render_template("user_service/manage_notification.html", user={"user_id": user_id, "user_name": user_name})

# Báo cáo
@user_bp.route('/report', methods=['GET'])
def report():
    return render_template("user_service/report.html")

@user_bp.route('/get_customers', methods=['POST'])
def get_customers():
    try:
        data = request.get_json()
        brand_id = data.get('brand_id')
        page = data.get('page', 1)
        limit = data.get('limit', 10)
        search = data.get('search', '').strip()
        user_points = data.get('user_points', [])

        if not brand_id:
            return jsonify({"error": "Thiếu brand_id"}), 400
        if page < 1 or limit < 1:
            return jsonify({"error": "page và limit phải lớn hơn 0"}), 400

        offset = (page - 1) * limit
        points_dict = {up['user_id']: up['total_points'] for up in user_points}

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Thêm điều kiện search
        query = """
            SELECT up.user_id, up.fullname AS name,
                   CONCAT('KH-', LPAD(up.user_id, 3, '0')) AS customer_code,
                   up.phone,
                   c.membertype
            FROM User_Profile up
            JOIN Customer c ON up.user_id = c.user_id
            WHERE 1=1
        """
        params = []

        if search:
            query += " AND (up.fullname LIKE %s OR up.phone LIKE %s)"
            params.extend([f"%{search}%", f"%{search}%"])

        query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])

        cursor.execute(query, tuple(params))
        user_profiles = cursor.fetchall()

        # Đếm tổng số khách hàng (áp dụng search)
        count_query = """
            SELECT COUNT(*) AS total
            FROM User_Profile up
            JOIN Customer c ON up.user_id = c.user_id
            WHERE 1=1
        """
        count_params = []
        if search:
            count_query += " AND (up.fullname LIKE %s OR up.phone LIKE %s)"
            count_params.extend([f"%{search}%", f"%{search}%"])

        cursor.execute(count_query, tuple(count_params))
        total_customers = cursor.fetchone()['total']

        # Thống kê
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.now() - timedelta(days=30)
        cursor.execute("""
            SELECT COUNT(*) AS new_customers
            FROM Users u
            WHERE u.created_at >= %s
        """, (thirty_days_ago,))
        new_customers_30d = cursor.fetchone()['new_customers']

        cursor.execute("""
            SELECT COUNT(*) AS vip_customers
            FROM Customer c
            WHERE c.membertype >= 2
        """)
        vip_customers = cursor.fetchone()['vip_customers']

        cursor.close()
        conn.close()

        customers = []
        for up in user_profiles:
            uid = up['user_id']
            customers.append({
                "user_id": uid,
                "name": up['name'],
                "customer_code": up['customer_code'],
                "phone": up['phone'],
                "total_points": points_dict.get(uid, 0),
                "last_transaction_date": None,
                "tier": "Bạc" if up['membertype'] == 1 else "Vàng" if up['membertype'] == 2 else "Kim cương" if up['membertype'] == 3 else "-"
            })

        return jsonify({
            "customers": customers,
            "total_customers": total_customers,
            "new_customers_30d": new_customers_30d,
            "vip_customers": vip_customers
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@user_bp.route('/get_customer_detail/<int:user_id>', methods=['GET'])
def get_customer_detail(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Lấy thông tin cơ bản của KH
        cursor.execute("""
            SELECT up.user_id, up.fullname, up.email, up.phone, up.address,
                   c.membertype, u.created_at,
                   CASE c.membertype
                       WHEN 1 THEN 'Bạc'
                       WHEN 2 THEN 'Vàng'
                       WHEN 3 THEN 'Kim cương'
                       ELSE 'Thành viên'
                   END AS tier
            FROM User_Profile up
            JOIN Customer c ON up.user_id = c.user_id
            JOIN Users u ON up.user_id = u.user_id
            WHERE up.user_id = %s
        """, (user_id,))
        customer = cursor.fetchone()

        cursor.close()
        conn.close()

        if not customer:
            return jsonify({"error": "Không tìm thấy khách hàng"}), 404

        # Trả về thông tin cơ bản, ví & lịch sử sẽ lấy từ point_service
        return jsonify({"customer": customer}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500



@user_bp.route('/get_total_customers/<int:brand_id>', methods=['GET'])
def get_total_customers(brand_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Truy vấn lấy danh sách user_id đã tham gia giao dịch với brand này
        cursor.execute("""
            SELECT COUNT(DISTINCT user_id) AS total_customers
            FROM point_service.Transactions
            WHERE brand_id = %s
        """, (brand_id,))
        result = cursor.fetchone()

        cursor.close()
        conn.close()

        return jsonify({"total_customers": result['total_customers']}), 200

    except mysql.connector.Error as err:
        print(f"Database error: {err}")
        return jsonify({"error": str(err)}), 500
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({"error": str(e)}), 500



@user_bp.route('/top_user_chart', methods=['GET'])
def top_user_chart():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT username, pw.total_points
            FROM Users u
            JOIN point_service.pointwallet pw ON u.user_id = pw.user_id
            WHERE u.status = 1
            ORDER BY pw.total_points DESC
            LIMIT 3
        """)
        results = cursor.fetchall()
        cursor.close()
        conn.close()
        labels = [row['username'] for row in results]
        values = [row['total_points'] for row in results]
        return jsonify({"labels": labels, "values": values}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Lấy hệ số của tất cả các thành viên
@user_bp.route('/get_membertype_coefficients', methods=['GET'])
def get_membertype_coefficients():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM MemberTypeCoefficient join Customer on MemberTypeCoefficient.membertype = Customer.membertype")
        coefficients = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({"coefficients": coefficients}), 200
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500
    
# --- Quản lý tài khoản (Mall) ---

@user_bp.route('/update_account/<int:user_id>', methods=['PUT'])
def update_account(user_id):
    try:
        data = request.get_json()
        user_name = data.get('username')
        password = data.get('password')
        status = data.get('status')

        conn = get_db_connection()
        cursor = conn.cursor()

        query = "UPDATE Users SET username=%s, password=%s, status=%s WHERE user_id=%s"
        cursor.execute(query, (user_name, password, status, user_id))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Cập nhật tài khoản thành công!"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@user_bp.route('/delete_account/<int:user_id>', methods=['DELETE'])
def delete_account(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Kiểm tra tồn tại
        cursor.execute("SELECT * FROM Users WHERE user_id=%s", (user_id,))
        if cursor.fetchone() is None:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "Tài khoản không tồn tại!"}), 404

        # Xóa
        cursor.execute("DELETE FROM User_Profile WHERE user_id=%s", (user_id,))
        cursor.execute("DELETE FROM Customer WHERE user_id=%s", (user_id,))
        cursor.execute("DELETE FROM Brand WHERE user_id=%s", (user_id,))
        cursor.execute("DELETE FROM Mall WHERE user_id=%s", (user_id,))
        cursor.execute("DELETE FROM Users WHERE user_id=%s", (user_id,))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Xóa tài khoản thành công!"}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@user_bp.route('/reset_password/<int:user_id>', methods=['POST'])
def reset_password(user_id):
    try:
        new_password = "123456"  # mật khẩu mặc định
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("UPDATE Users SET password=%s WHERE user_id=%s", (new_password, user_id))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({"success": True, "message": "Đặt lại mật khẩu thành công!", "new_password": new_password}), 200

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
@user_bp.route('/get_account/<int:user_id>', methods=['GET'])
def get_account(user_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT u.user_id, u.username, u.status,
                   p.email, p.phone, p.address,
                   CASE
                       WHEN c.user_id IS NOT NULL THEN 'customer'
                       WHEN b.user_id IS NOT NULL THEN 'brand'
                       WHEN m.user_id IS NOT NULL THEN 'mall'
                       ELSE 'unknown'
                   END as role
            FROM Users u
            LEFT JOIN User_Profile p ON u.user_id = p.user_id
            LEFT JOIN Customer c ON u.user_id = c.user_id
            LEFT JOIN Brand b ON u.user_id = b.user_id
            LEFT JOIN Mall m ON u.user_id = m.user_id
            WHERE u.user_id = %s
        """, (user_id,))
        account = cursor.fetchone()

        cursor.close()
        conn.close()

        if not account:
            return jsonify({"success": False, "message": "Không tìm thấy tài khoản"}), 404

        return jsonify({"success": True, "account": account}), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
