from supabase_client import supabase
from datetime import datetime

class ContactRepository:
    @staticmethod
    def create(fullname: str, email: str, phone: str, subject: str, message: str) -> dict:
        """Lưu thông tin liên hệ vào database"""
        try:
            data = {
                "fullname": fullname,
                "email": email,
                "phone": phone,
                "subject": subject,
                "message": message,
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
            }

            response = supabase.table("contacts").insert(data).execute()
            
            if response.data:
                return response.data[0]
            return None
        except Exception as e:
            print(f"Error saving contact: {str(e)}")
            raise e

    @staticmethod
    def get_all(limit: int = 50, offset: int = 0) -> list:
        """Lấy danh sách tất cả liên hệ"""
        try:
            response = (
                supabase.table("contacts")
                .select("*")
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            return response.data if response.data else []
        except Exception as e:
            print(f"❌ Error fetching contacts: {str(e)}")
            return []

    @staticmethod
    def get_by_id(contact_id: str) -> dict:
        """Lấy thông tin liên hệ theo ID"""
        try:
            response = (
                supabase.table("contacts")
                .select("*")
                .eq("id", contact_id)
                .single()
                .execute()
            )
            return response.data
        except Exception as e:
            print(f"❌ Error fetching contact: {str(e)}")
            return None

    @staticmethod
    def update_status(contact_id: str, status: str) -> dict:
        """Cập nhật trạng thái liên hệ"""
        try:
            response = (
                supabase.table("contacts")
                .update({"status": status})
                .eq("id", contact_id)
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            print(f"❌ Error updating contact status: {str(e)}")
            return None

    @staticmethod
    def get_count() -> int:
        """Lấy tổng số liên hệ"""
        try:
            response = supabase.table("contacts").select("id", count="exact").execute()
            return response.count or 0
        except Exception as e:
            print(f"❌ Error counting contacts: {str(e)}")
            return 0

    @staticmethod
    def delete(contact_id: str) -> bool:
        """Xóa liên hệ"""
        try:
            response = (
                supabase.table("contacts")
                .delete()
                .eq("id", contact_id)
                .execute()
            )
            return True if response else False
        except Exception as e:
            print(f"❌ Error deleting contact: {str(e)}")
            return False
