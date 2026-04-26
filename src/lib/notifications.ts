/**
 * SMS Notifications via Africa's Talking
 * https://africastalking.com — Kenya's best SMS gateway
 * Pay-per-SMS, no monthly fee
 */

const AT_API_URL = 'https://api.africastalking.com/version1/messaging';

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<SMSResult> {
  const apiKey = process.env.AT_API_KEY;
  const username = process.env.AT_USERNAME;

  if (!apiKey || !username) {
    console.warn('[SMS] Africa\'s Talking credentials not set — logging only');
    console.log(`[SMS MOCK] To: ${phoneNumber}\nMessage: ${message}`);
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  // Normalize Kenyan phone numbers to +254 format
  const normalized = normalizeKenyanPhone(phoneNumber);

  try {
    const params = new URLSearchParams({
      username,
      to: normalized,
      message,
      ...(process.env.AT_SHORTCODE ? { from: process.env.AT_SHORTCODE } : {}),
    });

    const res = await fetch(AT_API_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AT API ${res.status}: ${text}`);
    }

    const data = (await res.json()) as {
      SMSMessageData: {
        Recipients: Array<{ status: string; messageId: string }>;
      };
    };

    const recipient = data.SMSMessageData.Recipients[0];
    if (recipient?.status === 'Success') {
      return { success: true, messageId: recipient.messageId };
    }

    return { success: false, error: recipient?.status ?? 'Unknown error' };
  } catch (err) {
    console.error('[SMS] Error:', err);
    return { success: false, error: String(err) };
  }
}

/** Normalize Kenyan phone numbers to E.164 format (+254XXXXXXXXX) */
export function normalizeKenyanPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('254')) return `+${digits}`;
  if (digits.startsWith('0')) return `+254${digits.slice(1)}`;
  if (digits.startsWith('7') || digits.startsWith('1'))
    return `+254${digits}`;
  return `+${digits}`;
}

// ── Pre-built message templates ───────────────────────────────────────────────

export function orderAssignedCustomerSMS(
  customerName: string,
  orderNumber: string,
  riderName: string,
  riderPhone: string,
  trackingUrl: string
): string {
  return `Hi ${customerName}, your order #${orderNumber} has been assigned to ${riderName} (${riderPhone}). Track live: ${trackingUrl}`;
}

export function orderAssignedRiderSMS(
  riderName: string,
  customerName: string,
  address: string,
  orderNumber: string
): string {
  return `Hi ${riderName}, new delivery! Order #${orderNumber} for ${customerName} at ${address}. Open your Shipday app to accept.`;
}

export function orderDeliveredSMS(
  customerName: string,
  orderNumber: string
): string {
  return `Hi ${customerName}, your order #${orderNumber} has been delivered. Thank you for shopping with us!`;
}

export function courierBookedSMS(
  customerName: string,
  orderNumber: string,
  courierName: string,
  trackingId: string
): string {
  return `Hi ${customerName}, your order #${orderNumber} has been booked with ${courierName}. Tracking: ${trackingId}. Expected delivery: 1-3 business days.`;
}
