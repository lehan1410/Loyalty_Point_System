import qrcode
import urllib.parse 

# Thông tin giao dịch mẫu
transaction_data = {
    "brand_id": 1,
    "invoice_code": "INV0500",
    "amount": 2750000,
    "created_at": "2025-04-27 10:30:00",
    "user_snapshot_id": 1,
}

# Đường dẫn API gốc
transaction_url = "https://loyalty-point-system.onrender.com/user/transaction_qr"
query = urllib.parse.urlencode(transaction_data)
full_url = f"{transaction_url}?{query}"

encoded = urllib.parse.quote(full_url, safe='')
login_link = f"https://loyalty-point-system.onrender.com/user/login?return_url={encoded}"

# Tạo QR Code
qr = qrcode.make(full_url)

# Lưu QR Code thành file
qr.save("transaction_qr.png")

print("Đã tạo mã QR chứa thông tin giao dịch!")
