'use client';

import { toJalaliHuman, toJalaliDateTime } from '@/lib/date';

interface Props {
  date: Date | string;
  showTime?: boolean;
}

export default function JalaliDate({ date, showTime }: Props) {
  return <span>{showTime ? toJalaliDateTime(date) : toJalaliHuman(date)}</span>;
}
