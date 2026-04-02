import { Timestamped, DateString } from "./common";

export type TransactionType = "income" | "expense";

export type ExpenseCategory =
  | "food" | "transport" | "housing" | "utilities"
  | "entertainment" | "health" | "education"
  | "shopping" | "savings" | "salary" | "freelance" | "other";

export interface Transaction extends Timestamped {
  type: TransactionType;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: DateString;
}
