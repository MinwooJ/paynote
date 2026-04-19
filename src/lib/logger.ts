/**
 * 민감 데이터(금액·라벨) 노출을 막기 위한 얇은 로거 wrapper.
 * 프로덕션에서는 INFO+만 출력. 에러 로깅 시 개별 항목 내용은 포함하지 않음.
 */

type Level = 'debug' | 'info' | 'warn' | 'error'

const enabled: Record<Level, boolean> = {
  debug: process.env.NODE_ENV !== 'production',
  info: true,
  warn: true,
  error: true,
}

function log(level: Level, message: string, meta?: Record<string, unknown>): void {
  if (!enabled[level]) return
  const safeMeta = meta ? { ...meta } : undefined
  if (safeMeta) {
    // 민감 필드 마스킹
    for (const key of ['amount', 'label', 'note', 'category']) {
      if (key in safeMeta) safeMeta[key] = '***'
    }
  }
  const line = `[${level}] ${message}`
  if (level === 'error') console.error(line, safeMeta ?? '')
  else if (level === 'warn') console.warn(line, safeMeta ?? '')
  else console.log(line, safeMeta ?? '')
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
}
