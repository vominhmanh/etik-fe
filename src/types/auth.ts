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
  password: string;
};

export type AuthRes = {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
};
