// lib/level.ts
export type LevelEnum =
  | "FIRST_YEAR"
  | "SECOND_YEAR"
  | "THIRD_YEAR"
  | "FOURTH_YEAR"
  | "FIFTH_YEAR"
  | "SIXTH_YEAR";

const MAP: Record<string, LevelEnum> = {
  "1": "FIRST_YEAR",
  "2": "SECOND_YEAR",
  "3": "THIRD_YEAR",
  "4": "FOURTH_YEAR",
  "5": "FIFTH_YEAR",
  "6": "SIXTH_YEAR",
  first: "FIRST_YEAR",
  second: "SECOND_YEAR",
  third: "THIRD_YEAR",
  fourth: "FOURTH_YEAR",
  fifth: "FIFTH_YEAR",
  sixth: "SIXTH_YEAR",
};

export function levelParamToEnum(param: string): LevelEnum {
  const key = (param || "").toLowerCase();
  return MAP[key] ?? (param.toUpperCase() as LevelEnum);
}
