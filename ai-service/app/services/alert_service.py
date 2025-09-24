from typing import Dict, Any
import logging
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)

class AlertService:
    """Send alerts based on trading signals"""
    def __init__(self, email_config: Dict[str, str]):
        self.email_config = email_config

    def send_alert(self, recipient: str, signal_data: Dict[str, Any]):
        msg = EmailMessage()
        msg["Subject"] = f"Trading Alert: {signal_data['signal']}"
        msg["From"] = self.email_config["from"]
        msg["To"] = recipient
        msg.set_content(f"""
        Signal: {signal_data['signal']}
        Confidence: {signal_data['confidence']:.1%}
        Reasoning: {signal_data['reasoning']}
        Model Version: {signal_data['model_version']}
        """)

        try:
            with smtplib.SMTP(self.email_config["smtp_server"], self.email_config["smtp_port"]) as smtp:
                smtp.send_message(msg)
            logger.info(f"Alert sent to {recipient}")
        except Exception as e:
            logger.error(f"Failed to send alert: {e}")
