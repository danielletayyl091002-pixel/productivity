import { Timestamped, DateString } from "./common";

export type ReadingStatus = "to-read" | "reading" | "finished" | "abandoned";

export interface Book extends Timestamped {
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: ReadingStatus;
  startDate?: DateString;
  finishDate?: DateString;
  rating?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface ReadingSession extends Timestamped {
  bookId: string;
  date: DateString;
  pagesRead: number;
  durationMinutes?: number;
}
