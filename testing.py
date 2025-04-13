from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

# Twilio credentials
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

print(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)

# Initialize Twilio client
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


def send_whatsapp_message(to, message):
    try:
        message = client.messages.create(
            body=message, from_=f"whatsapp:{TWILIO_PHONE_NUMBER}", to=f"whatsapp:{to}"
        )
        return message.sid
    except Exception as e:
        raise Exception(f"Failed to send message: {e}")


def main():
    # Example usage
    to = "+919451478866"  # Replace with the recipient's WhatsApp number
    message = "Testing message from Twilio WhatsApp API"

    try:
        message_sid = send_whatsapp_message(to, message)
        print(f"Message sent successfully with SID: {message_sid}")
    except Exception as e:
        print(e)


if __name__ == "__main__":
    main()
