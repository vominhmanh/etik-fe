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


