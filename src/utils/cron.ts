// Cron expression validation and next-run calculation utilities.
//
// Supports:
// - Standard 5-field cron: minute hour day-of-month month day-of-week
// - Extended 6-field cron: second minute hour day-of-month month day-of-week
//
// Each field supports: numbers, ranges (1-5), steps (star/5, 1-10/2), lists (1,3,5), and wildcard (*)

export interface CronValidationResult {
  valid: boolean
  error?: string
  nextRuns?: string[]
}

/** Field definitions with name, min, and max values */
interface FieldDef {
  name: string
  min: number
  max: number
}

const FIVE_FIELD_DEFS: FieldDef[] = [
  { name: '分钟', min: 0, max: 59 },
  { name: '小时', min: 0, max: 23 },
  { name: '日', min: 1, max: 31 },
  { name: '月', min: 1, max: 12 },
  { name: '星期', min: 0, max: 7 },
]

const SIX_FIELD_DEFS: FieldDef[] = [
  { name: '秒', min: 0, max: 59 },
  ...FIVE_FIELD_DEFS,
]

/**
 * Validate a single value (number) against a field's range.
 */
function validateValue(value: number, field: FieldDef): string | null {
  if (!Number.isInteger(value)) {
    return `${field.name}字段值必须为整数`
  }
  if (value < field.min || value > field.max) {
    return `${field.name}字段值 ${value} 超出范围 ${field.min}-${field.max}`
  }
  return null
}

// Validate a single cron field (e.g., "*/5", "1-10/2", "1,3,5", "*", "5").
function validateField(token: string, field: FieldDef): string | null {
  if (token === '*') {
    return null
  }

  // List: "1,3,5"
  if (token.includes(',')) {
    const parts = token.split(',')
    for (const part of parts) {
      if (part === '') {
        return `${field.name}字段包含空的列表项`
      }
      const err = validateField(part, field)
      if (err) return err
    }
    return null
  }

  // Step: "*/5" or "1-10/2"
  if (token.includes('/')) {
    const parts = token.split('/')
    if (parts.length !== 2) {
      return `${field.name}字段步长格式无效: ${token}`
    }
    const [base, stepStr] = parts
    if (stepStr === '' || !/^\d+$/.test(stepStr)) {
      return `${field.name}字段步长值无效: ${token}`
    }
    const step = Number(stepStr)
    if (step === 0) {
      return `${field.name}字段步长值不能为 0`
    }
    if (step < 1) {
      return `${field.name}字段步长值必须为正整数`
    }
    // Validate the base part (either "*" or a range)
    if (base !== '*') {
      const err = validateField(base, field)
      if (err) return err
    }
    return null
  }

  // Range: "1-5"
  if (token.includes('-')) {
    const parts = token.split('-')
    if (parts.length !== 2) {
      return `${field.name}字段范围格式无效: ${token}`
    }
    const [startStr, endStr] = parts
    if (!/^\d+$/.test(startStr) || !/^\d+$/.test(endStr)) {
      return `${field.name}字段范围值必须为数字: ${token}`
    }
    const start = Number(startStr)
    const end = Number(endStr)
    const startErr = validateValue(start, field)
    if (startErr) return startErr
    const endErr = validateValue(end, field)
    if (endErr) return endErr
    if (start > end) {
      return `${field.name}字段范围起始值 ${start} 大于结束值 ${end}`
    }
    return null
  }

  // Single number
  if (!/^\d+$/.test(token)) {
    return `${field.name}字段包含无效字符: ${token}`
  }
  const num = Number(token)
  return validateValue(num, field)
}

/**
 * Validate a cron expression string.
 * Supports 5-field (minute hour dom month dow) and 6-field (second minute hour dom month dow) formats.
 * Returns a CronValidationResult with validation status, optional error message, and next 5 runs on success.
 */
export function validateCron(expression: string): CronValidationResult {
  if (typeof expression !== 'string') {
    return { valid: false, error: 'Cron 表达式必须为字符串' }
  }

  const trimmed = expression.trim()
  if (trimmed === '') {
    return { valid: false, error: 'Cron 表达式不能为空' }
  }

  const fields = trimmed.split(/\s+/)
  if (fields.length !== 5 && fields.length !== 6) {
    return {
      valid: false,
      error: `Cron 表达式格式错误: 期望 5 或 6 个字段，实际为 ${fields.length} 个字段`,
    }
  }

  const fieldDefs = fields.length === 5 ? FIVE_FIELD_DEFS : SIX_FIELD_DEFS

  for (let i = 0; i < fields.length; i++) {
    const error = validateField(fields[i], fieldDefs[i])
    if (error) {
      return { valid: false, error }
    }
  }

  // On success, compute next 5 runs
  try {
    const nextRuns = getNextRuns(expression, 5)
    return { valid: true, nextRuns }
  } catch {
    return { valid: true }
  }
}

/**
 * Expand a single cron field token into a sorted array of matching values.
 */
function expandField(token: string, field: FieldDef): number[] {
  if (token === '*') {
    const result: number[] = []
    for (let i = field.min; i <= field.max; i++) {
      result.push(i)
    }
    return result
  }

  // List
  if (token.includes(',')) {
    const values = new Set<number>()
    for (const part of token.split(',')) {
      for (const v of expandField(part, field)) {
        values.add(v)
      }
    }
    return [...values].sort((a, b) => a - b)
  }

  // Step
  if (token.includes('/')) {
    const [base, stepStr] = token.split('/')
    const step = Number(stepStr)
    let start = field.min
    let end = field.max

    if (base !== '*') {
      if (base.includes('-')) {
        const [s, e] = base.split('-').map(Number)
        start = s
        end = e
      } else {
        start = Number(base)
      }
    }

    const result: number[] = []
    for (let i = start; i <= end; i += step) {
      result.push(i)
    }
    return result
  }

  // Range
  if (token.includes('-')) {
    const [start, end] = token.split('-').map(Number)
    const result: number[] = []
    for (let i = start; i <= end; i++) {
      result.push(i)
    }
    return result
  }

  // Single value
  return [Number(token)]
}

/**
 * Calculate the next N execution times for a cron expression.
 * Returns ISO 8601 formatted date strings.
 */
export function getNextRuns(expression: string, count: number): string[] {
  if (count <= 0) return []

  const trimmed = expression.trim()
  const fields = trimmed.split(/\s+/)
  const is6Field = fields.length === 6
  const fieldDefs = is6Field ? SIX_FIELD_DEFS : FIVE_FIELD_DEFS

  // Expand each field
  const expanded = fields.map((token, i) => expandField(token, fieldDefs[i]))

  let secondValues: number[]
  let minuteValues: number[]
  let hourValues: number[]
  let domValues: number[]
  let monthValues: number[]
  let dowValues: number[]

  if (is6Field) {
    ;[secondValues, minuteValues, hourValues, domValues, monthValues, dowValues] = expanded
  } else {
    secondValues = [0]
    ;[minuteValues, hourValues, domValues, monthValues, dowValues] = expanded
  }

  // Normalize day-of-week: 7 -> 0 (both represent Sunday)
  dowValues = dowValues.map((v) => (v === 7 ? 0 : v))
  dowValues = [...new Set(dowValues)].sort((a, b) => a - b)

  const results: string[] = []
  const now = new Date()
  // Start from the next second
  const current = new Date(now.getTime() + 1000)
  current.setMilliseconds(0)

  // Safety limit to prevent infinite loops
  const maxIterations = 366 * 24 * 60 * 60 // ~1 year in seconds
  let iterations = 0

  while (results.length < count && iterations < maxIterations) {
    iterations++

    const month = current.getMonth() + 1 // 1-12
    const dom = current.getDate()
    const dow = current.getDay() // 0-6
    const hour = current.getHours()
    const minute = current.getMinutes()
    const second = current.getSeconds()

    // Check month first - if not matching, skip to next month
    if (!monthValues.includes(month)) {
      // Advance to the first day of the next matching month
      const nextMonth = monthValues.find((m) => m > month)
      if (nextMonth !== undefined) {
        current.setMonth(nextMonth - 1, 1)
        current.setHours(0, 0, 0, 0)
      } else {
        // Wrap to next year, first matching month
        current.setFullYear(current.getFullYear() + 1)
        current.setMonth(monthValues[0] - 1, 1)
        current.setHours(0, 0, 0, 0)
      }
      continue
    }

    // Check day-of-month and day-of-week
    if (!domValues.includes(dom) || !dowValues.includes(dow)) {
      // Advance to next day
      current.setDate(current.getDate() + 1)
      current.setHours(0, 0, 0, 0)
      continue
    }

    // Check hour
    if (!hourValues.includes(hour)) {
      const nextHour = hourValues.find((h) => h > hour)
      if (nextHour !== undefined) {
        current.setHours(nextHour, 0, 0, 0)
      } else {
        // Advance to next day
        current.setDate(current.getDate() + 1)
        current.setHours(0, 0, 0, 0)
      }
      continue
    }

    // Check minute
    if (!minuteValues.includes(minute)) {
      const nextMinute = minuteValues.find((m) => m > minute)
      if (nextMinute !== undefined) {
        current.setMinutes(nextMinute, 0, 0)
      } else {
        // Advance to next hour
        current.setHours(current.getHours() + 1, 0, 0, 0)
      }
      continue
    }

    // Check second
    if (!secondValues.includes(second)) {
      const nextSecond = secondValues.find((s) => s > second)
      if (nextSecond !== undefined) {
        current.setSeconds(nextSecond, 0)
      } else {
        // Advance to next minute
        current.setMinutes(current.getMinutes() + 1, 0, 0)
      }
      continue
    }

    // All fields match - record this time
    results.push(current.toISOString())

    // Advance by 1 second for next iteration
    current.setSeconds(current.getSeconds() + 1)
  }

  return results
}
