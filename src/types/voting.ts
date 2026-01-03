export type Nominee = {
  id: number;
  eventId: number;
  categoryId: number;
  title: string;
  description: string;
  imageUrl: string;
  socialIframe: string;
  voteCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: number;
  eventId: number;
  name: string;
  description: string;
  maxVotesPerUserTotal: number;
  maxVotesPerUserDaily: number;
  allowMultipleNominees: boolean;
  startAt: string;
  endAt: string;
  createdAt: string;
  updatedAt: string;
  nominees: Nominee[];
};

export type VotingAllInfoResponse = {
  categories: Category[];
};

