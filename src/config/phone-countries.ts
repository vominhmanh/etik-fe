export type PhoneCountry = {
  iso2: string;
  nameVi: string;
  nameEn: string;
  dialCode: string; // e.g. "+84"
};

// NOTE: This list can be extended over time. Start with the most common countries.
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso2: 'VN', nameVi: 'Việt Nam', nameEn: 'Vietnam', dialCode: '+84' },
  { iso2: 'US', nameVi: 'Hoa Kỳ', nameEn: 'United States', dialCode: '+1' },
  { iso2: 'GB', nameVi: 'Vương quốc Anh', nameEn: 'United Kingdom', dialCode: '+44' },
  { iso2: 'FR', nameVi: 'Pháp', nameEn: 'France', dialCode: '+33' },
  { iso2: 'DE', nameVi: 'Đức', nameEn: 'Germany', dialCode: '+49' },
  { iso2: 'SG', nameVi: 'Singapore', nameEn: 'Singapore', dialCode: '+65' },
  { iso2: 'TH', nameVi: 'Thái Lan', nameEn: 'Thailand', dialCode: '+66' },
  { iso2: 'MY', nameVi: 'Malaysia', nameEn: 'Malaysia', dialCode: '+60' },
  { iso2: 'ID', nameVi: 'Indonesia', nameEn: 'Indonesia', dialCode: '+62' },
  { iso2: 'PH', nameVi: 'Philippines', nameEn: 'Philippines', dialCode: '+63' },
  { iso2: 'KR', nameVi: 'Hàn Quốc', nameEn: 'South Korea', dialCode: '+82' },
  { iso2: 'JP', nameVi: 'Nhật Bản', nameEn: 'Japan', dialCode: '+81' },
  { iso2: 'CN', nameVi: 'Trung Quốc', nameEn: 'China', dialCode: '+86' },
  { iso2: 'AU', nameVi: 'Úc', nameEn: 'Australia', dialCode: '+61' },
  { iso2: 'CA', nameVi: 'Canada', nameEn: 'Canada', dialCode: '+1' },
  { iso2: 'IN', nameVi: 'Ấn Độ', nameEn: 'India', dialCode: '+91' },
  { iso2: 'NZ', nameVi: 'New Zealand', nameEn: 'New Zealand', dialCode: '+64' },
  { iso2: 'LA', nameVi: 'Lào', nameEn: 'Laos', dialCode: '+856' },
  { iso2: 'KH', nameVi: 'Campuchia', nameEn: 'Cambodia', dialCode: '+855' },
  { iso2: 'MM', nameVi: 'Myanmar', nameEn: 'Myanmar', dialCode: '+95' },
  { iso2: 'HK', nameVi: 'Hồng Kông', nameEn: 'Hong Kong', dialCode: '+852' },
  { iso2: 'TW', nameVi: 'Đài Loan', nameEn: 'Taiwan', dialCode: '+886' },
  { iso2: 'RU', nameVi: 'Nga', nameEn: 'Russia', dialCode: '+7' },
  { iso2: 'BR', nameVi: 'Brazil', nameEn: 'Brazil', dialCode: '+55' },
  { iso2: 'AR', nameVi: 'Argentina', nameEn: 'Argentina', dialCode: '+54' },
  { iso2: 'ZA', nameVi: 'Nam Phi', nameEn: 'South Africa', dialCode: '+27' },
  { iso2: 'SA', nameVi: 'Ả Rập Xê Út', nameEn: 'Saudi Arabia', dialCode: '+966' },
  { iso2: 'AE', nameVi: 'UAE', nameEn: 'United Arab Emirates', dialCode: '+971' },
];

export const DEFAULT_PHONE_COUNTRY: PhoneCountry = PHONE_COUNTRIES[0]; // Việt Nam

/**
 * Parse E.164 format phone number to extract country code and national number
 * @param e164Phone Phone number in E.164 format (e.g., '+84333247242')
 * @returns Object with countryCode (ISO 3166-1 alpha-2) and nationalNumber (NSN without trunk '0')
 */
export function parseE164Phone(e164Phone: string | null | undefined): {
  countryCode: string;
  nationalNumber: string;
} | null {
  if (!e164Phone) return null;

  try {
    // Import google-libphonenumber dynamically to avoid SSR issues
    const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber');
    const phoneUtil = PhoneNumberUtil.getInstance();
    
    const parsed = phoneUtil.parse(e164Phone, null);
    const countryCode = phoneUtil.getRegionCodeForNumber(parsed);
    const nationalNumber = phoneUtil.format(parsed, PhoneNumberFormat.NATIONAL);
    
    // Extract digits only from national number and remove leading trunk '0'
    const digits = nationalNumber.replace(/\D/g, '');
    const nsn = digits.startsWith('0') && digits.length > 1 ? digits.slice(1) : digits;
    
    return {
      countryCode: countryCode || DEFAULT_PHONE_COUNTRY.iso2,
      nationalNumber: nsn || '',
    };
  } catch (error) {
    console.error('Failed to parse E.164 phone:', e164Phone, error);
    // Fallback: try to extract country code from known dial codes
    for (const country of PHONE_COUNTRIES) {
      if (e164Phone.startsWith(country.dialCode)) {
        const nationalNumber = e164Phone.slice(country.dialCode.length);
        return {
          countryCode: country.iso2,
          nationalNumber: nationalNumber.replace(/^0+/, ''), // Remove leading zeros
        };
      }
    }
    return null;
  }
}

/**
 * Format phone country and national number to E.164 format
 * @param countryCode ISO 3166-1 alpha-2 country code (e.g., 'VN')
 * @param nationalNumber National Significant Number without trunk '0' (e.g., '333247242')
 * @returns Phone number in E.164 format (e.g., '+84333247242')
 */
export function formatToE164(countryCode: string, nationalNumber: string): string | null {
  if (!countryCode || !nationalNumber) return null;

  try {
    const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber');
    const phoneUtil = PhoneNumberUtil.getInstance();
    
    const parsed = phoneUtil.parse(nationalNumber, countryCode);
    return phoneUtil.format(parsed, PhoneNumberFormat.E164);
  } catch (error) {
    console.error('Failed to format to E.164:', countryCode, nationalNumber, error);
    // Fallback: construct manually
    const country = PHONE_COUNTRIES.find(c => c.iso2 === countryCode);
    if (country) {
      return `${country.dialCode}${nationalNumber}`;
    }
    return null;
  }
}

