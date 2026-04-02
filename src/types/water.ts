import { Timestamped, DateString, TimeString } from "./common";

export interface WaterEntry extends Timestamped {
  date: DateString;
  amountMl: number;
  time: TimeString;
}

export interface WaterSettings {
  dailyGoalMl: number;
  defaultGlassMl: number;
}
