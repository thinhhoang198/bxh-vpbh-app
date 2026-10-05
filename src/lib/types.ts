import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
// ISO datetime with offset, minute precision (no seconds), e.g. 2026-11-20T10:00+07:00
const isoMinute = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/);
const phoneMasked = z.string().regex(/^\d{4}\*{3}\d{3}$/);

export const EntrySchema = z.object({
  rank: z.number().int().min(1),
  name: z.string(),
  agency: z.string(),
  phoneMasked,
  guests: z.number().int().min(0),
  visits: z.number().int().min(0).optional(),
  lastCheckin: isoMinute.optional(),
});

export const WeekMetaSchema = z.object({
  week: z.number().int().min(1),
  start: isoDate,
  end: isoDate,
  status: z.enum(["upcoming", "ongoing", "ended"]),
});

export const WinnerSchema = z.object({
  week: z.number().int().min(1),
  name: z.string(),
  agency: z.string(),
  guests: z.number().int().min(0),
  qualified: z.boolean(),
  prizeVnd: z.number().int().min(0),
});

export const SummarySchema = z.object({
  meta: z.object({
    generatedAt: isoMinute,
    dataAsOf: isoMinute.nullable(),
    programStart: isoDate,
    programEnd: isoDate,
    currentWeek: z.number().int().min(0),
    totalWeeks: z.number().int().min(1),
    minGuestsPerWeek: z.number().int().min(1),
    weeklyPrizeVnd: z.number().int().min(0),
    weeks: z.array(WeekMetaSchema),
  }),
  totals: z.object({
    guests: z.number().int().min(0),
    cvkdCount: z.number().int().min(0),
    visits: z.number().int().min(0),
  }),
  overall: z.array(EntrySchema).max(300),
  currentWeekEntries: z.array(EntrySchema).max(200),
  winners: z.array(WinnerSchema),
});

export const WeekResponseSchema = z.object({
  week: z.number().int().min(1),
  entries: z.array(EntrySchema).max(200),
});

export type Entry = z.infer<typeof EntrySchema>;
export type WeekMeta = z.infer<typeof WeekMetaSchema>;
export type Winner = z.infer<typeof WinnerSchema>;
export type Summary = z.infer<typeof SummarySchema>;
export type WeekResponse = z.infer<typeof WeekResponseSchema>;
