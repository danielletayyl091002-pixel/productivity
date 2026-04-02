export type ID = string;

export interface Timestamped {
  id: ID;
  createdAt: string;
  updatedAt: string;
}

export type DateString = string;
export type TimeString = string;
export type ISOString = string;
