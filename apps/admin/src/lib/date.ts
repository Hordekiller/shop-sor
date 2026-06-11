import { format as jalaliFormat, isBefore } from 'date-fns-jalali';
import { faIR } from 'date-fns-jalali/locale';

export function toJalali(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return jalaliFormat(d, 'yyyy/MM/dd', { locale: faIR });
}

export function toJalaliHuman(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return jalaliFormat(d, 'dd MMMM yyyy', { locale: faIR });
}

export function toJalaliFull(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return jalaliFormat(d, 'EEEE dd MMMM yyyy', { locale: faIR });
}

export function toJalaliDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return jalaliFormat(d, 'yyyy/MM/dd HH:mm', { locale: faIR });
}

export function isExpired(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return isBefore(d, new Date());
}

export function daysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = d.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
