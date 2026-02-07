// WhatsApp utility functions for sending pre-filled messages

export interface WhatsAppMessageData {
  memberName: string;
  memberEmail: string;
  memberPassword: string;
  memberPhone: string;
  adminName: string;
  appUrl: string;
}

export const generateWhatsAppMessage = (data: WhatsAppMessageData): string => {
  return `🎉 Welcome to TaskFlow!

Hi ${data.memberName}!

You've been added to TaskFlow by ${data.adminName}.

📧 *Email:* ${data.memberEmail}
🔐 *Password:* ${data.memberPassword}
🌐 *Login:* ${data.appUrl}

Please login and change your password after first login.

Welcome to the team! 🚀`;
};

export const openWhatsAppWithMessage = (phoneNumber: string, message: string): void => {
  // Remove any non-numeric characters and ensure proper format
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present (assuming India +91)
  const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
  
  // Create WhatsApp URL with pre-filled message
  const whatsappURL = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  
  // Open WhatsApp in new tab/window
  window.open(whatsappURL, '_blank');
};

export const generateMemberCredentials = (): string => {
  // Generate a random password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Basic Indian phone number validation
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 || (cleanPhone.length === 12 && cleanPhone.startsWith('91'));
};