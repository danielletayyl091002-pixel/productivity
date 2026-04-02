import { Timestamped } from "./common";

export interface Note extends Timestamped {
  title: string;
  content: string;
  tags?: string[];
  isPinned: boolean;
}
