import { format as jalaliFormat } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";

export function toJalali(date: Date | string): string {
  return jalaliFormat(
    typeof date === "string" ? new Date(date) : date,
    "yyyy/MM/dd",
    { locale: faIR },
  );
}

export function toJalaliHuman(date: Date | string): string {
  return jalaliFormat(
    typeof date === "string" ? new Date(date) : date,
    "dd MMMM yyyy",
    { locale: faIR },
  );
}
