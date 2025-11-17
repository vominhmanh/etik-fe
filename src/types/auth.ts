export type User = {
  fullName: string;
  email: string;
  phoneNumber: string;
};

export type LoginReq = {
  username: string;
  password: string;
};

export type SignUpReq = {
  fullName: string;
  email: string;
  phoneNumber: string;
  phoneCountry?: string;
  phoneNationalNumber?: string;
  password: string;
};

export type AuthRes = {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
  auth_code: string;
  auth_code_expires_in: number
};

export type SsoAuthRes = {
  authCode: string;
  expiresIn: number;
};
