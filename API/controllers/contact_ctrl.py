from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
from repositories.contact_repo import ContactRepository

load_dotenv()

router = APIRouter()

# Email config
GMAIL_USER = os.getenv("GMAIL_USER", "")
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@travelvn.com")

class ContactRequest(BaseModel):
    fullname: str
    email: EmailStr
    phone: str
    subject: str
    message: str

def send_email(to_email: str, subject: str, fullname: str, phone: str, message: str):
    """Gửi email thông tin liên hệ đến owner"""
    try:
        # Email gửi cho owner/admin
        owner_body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
                        📨 Có Liên Hệ Mới từ TravelVN
                    </h2>
                    
                    <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0 0 15px 0;"><strong style="font-size: 16px;">Thông Tin Khách Hàng:</strong></p>
                        
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: bold; width: 30%; color: #2563eb;">Họ Tên:</td>
                                <td style="padding: 10px;">{fullname}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: bold; color: #2563eb;">Email:</td>
                                <td style="padding: 10px;"><a href="mailto:{to_email}" style="color: #2563eb; text-decoration: none;">{to_email}</a></td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: bold; color: #2563eb;">Điện Thoại:</td>
                                <td style="padding: 10px;"><a href="tel:{phone}" style="color: #2563eb; text-decoration: none;">{phone}</a></td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; font-weight: bold; color: #2563eb;">Tiêu Đề:</td>
                                <td style="padding: 10px;">{subject}</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; margin: 20px 0; border-radius: 6px;">
                        <p style="margin: 0 0 10px 0;"><strong style="color: #2563eb;">Nội Dung Tin Nhắn:</strong></p>
                        <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; color: #555;">
                            {message}
                        </p>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                    
                    <p style="color: #666; font-size: 14px; margin: 0;">
                        ⏰ <strong>Thời gian gửi:</strong> {__import__('datetime').datetime.now().strftime('%d/%m/%Y %H:%M:%S')}<br>
                        📍 <strong>Từ:</strong> Trang Contact TravelVN
                    </p>
                </div>
            </body>
        </html>
        """

        # Nếu chưa config email, chỉ log
        if not GMAIL_USER or not GMAIL_APP_PASSWORD:
            print("⚠️  Email chưa được config. Thông tin liên hệ đã được lưu.")
            return True

        # Gửi email tới owner
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)

        # Email tới owner
        owner_msg = MIMEMultipart("alternative")
        owner_msg["Subject"] = f"[📨 Liên Hệ Mới] {subject}"
        owner_msg["From"] = GMAIL_USER
        owner_msg["To"] = ADMIN_EMAIL
        owner_msg.attach(MIMEText(owner_body, "html"))
        server.sendmail(GMAIL_USER, ADMIN_EMAIL, owner_msg.as_string())

        server.quit()
        print(f"✅ Contact email sent to owner: {ADMIN_EMAIL}")
        print(f"   From: {fullname} ({to_email})")
        return True

    except Exception as e:
        print(f"❌ Email error: {str(e)}")
        return False

@router.post("/contact")
async def send_contact(request: ContactRequest):
    """
    Nhận thông tin liên hệ từ người dùng, lưu vào database và gửi email
    """
    try:
        # Validate inputs
        if not all([request.fullname, request.email, request.phone, request.subject, request.message]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vui lòng điền đầy đủ thông tin"
            )

        print(f"📧 Contact Form Received:")
        print(f"  Name: {request.fullname}")
        print(f"  Email: {request.email}")
        print(f"  Phone: {request.phone}")
        print(f"  Subject: {request.subject}")
        print(f"  Message: {request.message}")

        # Lưu vào database
        saved_contact = ContactRepository.create(
            fullname=request.fullname,
            email=request.email,
            phone=request.phone,
            subject=request.subject,
            message=request.message
        )

        if not saved_contact:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Lưu thông tin thất bại"
            )

        print(f"✅ Contact saved to database with ID: {saved_contact.get('id')}")

        # Gửi email
        email_sent = send_email(
            to_email=request.email,
            subject=request.subject,
            fullname=request.fullname,
            phone=request.phone,
            message=request.message
        )

        return {
            "status": "success",
            "message": "Chúng tôi đã nhận được thông tin của bạn. Cảm ơn bạn đã liên hệ!",
            "data": {
                "id": saved_contact.get('id'),
                "fullname": request.fullname,
                "email": request.email,
                "email_sent": email_sent
            }
        }

    except Exception as e:
        print(f"❌ Contact error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gửi thông tin thất bại: {str(e)}"
        )
