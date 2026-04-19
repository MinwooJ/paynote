'use client'

import * as React from 'react'
import { Input, type InputProps } from './ui/input'
import { formatAmountInput } from '@/lib/currency'

interface Props extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  value: number | null
  onValueChange: (next: number | null) => void
}

/**
 * 금액 입력 필드. 타이핑과 동시에 쉼표 자동 포맷. ADR-0003.
 * 내부값은 항상 정수(KRW) 또는 null.
 */
export function AmountInput({ value, onValueChange, placeholder, ...rest }: Props) {
  const display = value === null ? '' : value.toLocaleString('ko-KR')

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-9,]*"
      value={display}
      placeholder={placeholder ?? '0'}
      onChange={(e) => {
        const formatted = formatAmountInput(e.target.value)
        if (formatted === '') {
          onValueChange(null)
          return
        }
        const n = Number(formatted.replace(/,/g, ''))
        onValueChange(Number.isFinite(n) ? n : null)
      }}
      className="amount text-right"
      {...rest}
    />
  )
}
