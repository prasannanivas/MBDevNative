/**
 * Format a phone number to (XXX) XXX-XXXX format
 * @param {string} phoneNumber - Raw phone number string
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // Remove all non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phoneNumber; // Return original if doesn't match expected format
};

/**
 * Remove formatting from phone number
 * @param {string} phoneNumber - Formatted phone number
 * @returns {string} Unformatted phone number (digits only)
 */
export const unFormatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  return phoneNumber.replace(/\D/g, '');
};

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid
 */
export const isValidPhoneNumber = (phoneNumber) => {
  const cleaned = unFormatPhoneNumber(phoneNumber);
  return cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1');
};
