import { type FieldDef, FIVE_FIELD_DEFS, SIX_FIELD_DEFS } from "./types";

/** Expand a single cron field token into a sorted array of matching values. */
export function expandField(token: string, field: FieldDef): number[] {
  if (token === "*") {
    const result: number[] = [];
    for (let i = field.min; i <= field.max; i++) result.push(i);
    return result;
  }
  if (token.includes(",")) {
    const values = new Set<number>();
    for (const part of token.split(",")) {
      for (const v of expandField(part, field)) values.add(v);
    }
    return [...values].sort((a, b) => a - b);
  }
  if (token.includes("/")) {
    const [base, stepStr] = token.split("/");
    const step = Number(stepStr);
    let start = field.min;
    let end = field.max;
    if (base !== "*") {
      if (base.includes("-")) [start, end] = base.split("-").map(Number);
      else start = Number(base);
    }
    const result: number[] = [];
    for (let i = start; i <= end; i += step) result.push(i);
    return result;
  }
  if (token.includes("-")) {
    const [start, end] = token.split("-").map(Number);
    const result: number[] = [];
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  }
  return [Number(token)];
}

interface ExpandedFields {
  secondValues: number[];
  minuteValues: number[];
  hourValues: number[];
  domValues: number[];
  monthValues: number[];
  dowValues: number[];
}

function expandAll(fields: string[]): ExpandedFields {
  const is6Field = fields.length === 6;
  const fieldDefs = is6Field ? SIX_FIELD_DEFS : FIVE_FIELD_DEFS;
  const expanded = fields.map((token, i) => expandField(token, fieldDefs[i]));

  let secondValues: number[];
  let rest: number[][];
  if (is6Field) [secondValues, ...rest] = expanded;
  else {
    secondValues = [0];
    rest = expanded;
  }
  const [minuteValues, hourValues, domValues, monthValues, dowRaw] = rest;
  // Day-of-week: 7 and 0 both mean Sunday — collapse and sort.
  const dowValues = [...new Set(dowRaw.map((v) => (v === 7 ? 0 : v)))].sort((a, b) => a - b);
  return { secondValues, minuteValues, hourValues, domValues, monthValues, dowValues };
}

function advanceToNextMonth(current: Date, month: number, monthValues: number[]): void {
  const nextMonth = monthValues.find((m) => m > month);
  if (nextMonth !== undefined) {
    current.setMonth(nextMonth - 1, 1);
  } else {
    current.setFullYear(current.getFullYear() + 1);
    current.setMonth(monthValues[0] - 1, 1);
  }
  current.setHours(0, 0, 0, 0);
}

function advanceToNextHour(current: Date, hour: number, hourValues: number[]): void {
  const nextHour = hourValues.find((h) => h > hour);
  if (nextHour !== undefined) current.setHours(nextHour, 0, 0, 0);
  else {
    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);
  }
}

function advanceToNextMinute(current: Date, minute: number, minuteValues: number[]): void {
  const nextMinute = minuteValues.find((m) => m > minute);
  if (nextMinute !== undefined) current.setMinutes(nextMinute, 0, 0);
  else current.setHours(current.getHours() + 1, 0, 0, 0);
}

function advanceToNextSecond(current: Date, second: number, secondValues: number[]): void {
  const nextSecond = secondValues.find((s) => s > second);
  if (nextSecond !== undefined) current.setSeconds(nextSecond, 0);
  else current.setMinutes(current.getMinutes() + 1, 0, 0);
}

/**
 * Calculate the next N execution times for a cron expression.
 * Returns ISO 8601 formatted date strings.
 */
export function getNextRuns(expression: string, count: number): string[] {
  if (count <= 0) return [];

  const fields = expression.trim().split(/\s+/);
  const expanded = expandAll(fields);
  const { secondValues, minuteValues, hourValues, domValues, monthValues, dowValues } = expanded;

  const results: string[] = [];
  const current = new Date(Date.now() + 1000);
  current.setMilliseconds(0);

  const maxIterations = 366 * 24 * 60 * 60; // ~1 year in seconds
  let iterations = 0;

  while (results.length < count && iterations < maxIterations) {
    iterations++;
    const month = current.getMonth() + 1;
    if (!monthValues.includes(month)) {
      advanceToNextMonth(current, month, monthValues);
      continue;
    }
    if (!domValues.includes(current.getDate()) || !dowValues.includes(current.getDay())) {
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
      continue;
    }
    if (!hourValues.includes(current.getHours())) {
      advanceToNextHour(current, current.getHours(), hourValues);
      continue;
    }
    if (!minuteValues.includes(current.getMinutes())) {
      advanceToNextMinute(current, current.getMinutes(), minuteValues);
      continue;
    }
    if (!secondValues.includes(current.getSeconds())) {
      advanceToNextSecond(current, current.getSeconds(), secondValues);
      continue;
    }
    results.push(current.toISOString());
    current.setSeconds(current.getSeconds() + 1);
  }
  return results;
}
