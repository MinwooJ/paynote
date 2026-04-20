import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function LargeIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 380,
          background: 'hsl(146, 25%, 45%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          letterSpacing: '-0.05em',
        }}
      >
        ₩
      </div>
    ),
    { ...size },
  )
}
