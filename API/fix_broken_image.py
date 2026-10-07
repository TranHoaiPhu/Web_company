"""
Fix broken Unsplash image URL in the database
This script updates the broken Sa Pa image URL in the tours table
"""
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Get Supabase connection details from environment
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env file")
    exit(1)

# Import supabase after loading env
from supabase import create_client

# Create supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Old broken URL
OLD_URL = "https://images.unsplash.com/photo-1583396095097-dc8e0c647b63?w=1920&q=80"

# New working URL (Sa Pa rice terraces)
NEW_URL = "https://images.unsplash.com/photo-1528181304800-259b08848526?w=1920&q=80"

print(f"🔍 Searching for tours with broken image URL...")

try:
    # Find all tours with the broken URL in the image_url column
    result = supabase.table("tours").select("*").eq("image_url", OLD_URL).execute()

    if result.data and len(result.data) > 0:
        print(f"✅ Found {len(result.data)} tour(s) with broken URL:")
        for tour in result.data:
            print(f"   - Tour ID: {tour.get('id')}, Title: {tour.get('name')}")
        
        # Update the URL
        print(f"\n🔄 Updating image URL...")
        update_result = supabase.table("tours").update({"image_url": NEW_URL}).eq("image_url", OLD_URL).execute()
        
        if update_result.data:
            print(f"✅ Successfully updated {len(update_result.data)} tour(s)")
            for tour in update_result.data:
                print(f"   - Tour ID: {tour.get('id')}: {tour.get('name')}")
        else:
            print("❌ Update failed")
    else:
        print("ℹ️  No tours found with the broken URL in image_url column.")
        print("   Checking tour_images table instead...")
        
        # Also check tour_images table
        images_result = supabase.table("tour_images").select("*").eq("image_url", OLD_URL).execute()
        
        if images_result.data and len(images_result.data) > 0:
            print(f"✅ Found {len(images_result.data)} image(s) in tour_images table:")
            for img in images_result.data:
                print(f"   - Image ID: {img.get('id')}, Tour ID: {img.get('tour_id')}")
            
            # Update the URL in tour_images
            print(f"\n🔄 Updating image URL in tour_images...")
            update_images_result = supabase.table("tour_images").update({"image_url": NEW_URL}).eq("image_url", OLD_URL).execute()
            
            if update_images_result.data:
                print(f"✅ Successfully updated {len(update_images_result.data)} image(s)")
            else:
                print("❌ Update failed")
        else:
            print("ℹ️  No images found with the broken URL. Database might already be updated.")

except Exception as e:
    print(f"❌ Error: {e}")

print("\n✨ Done!")

