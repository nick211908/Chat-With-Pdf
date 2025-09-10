import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- IMPORTANT: EDIT THESE WITH YOUR TEST USER CREDENTIALS ---
# You can also move these to the .env file if you prefer
TEST_USER_EMAIL = "pandeyayush4101@gmail.com"
TEST_USER_PASSWORD = "1234567890"
# -----------------------------------------------------------

def get_jwt():
    """
    Connects to Supabase, authenticates the test user, and prints the access token.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    # This script acts like a frontend client, so it needs the public 'anon' key.
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY")

    if not supabase_url or not supabase_anon_key:
        print("\n❌ FAILED: Ensure SUPABASE_URL and SUPABASE_ANON_KEY are in your .env file.")
        print("Please check the instructions for updating your .env file.")
        return

    try:
        print("Connecting to Supabase...")
        supabase: Client = create_client(supabase_url, supabase_anon_key)
        
        print("Authenticating...")
        response = supabase.auth.sign_in_with_password({
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })

        access_token = response.session.access_token
        print("\n" + "="*50)
        print("✅ SUCCESS! Your JWT access token is printed below.")
        print("="*50)
        print(access_token)
        print("\nCopy this entire token to use in Swagger UI.")

    except Exception as e:
        print(f"\n❌ FAILED: An error occurred: {e}")
        print("Please check your user credentials, Supabase URL, and ANON key.")


if __name__ == "__main__":
    # The script now directly attempts to get the token.
    # The error-prone file-reading check has been removed.
    get_jwt()

