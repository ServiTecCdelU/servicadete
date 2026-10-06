import { ImageResponse } from 'next/og'
import { SITE_NAME } from '@/lib/seo'

export const alt = 'ServiCadete — La operación que mueve tu ciudad'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const BG = '#060a18'
const LIME = '#b7f34b'
const CYAN = '#36d3c7'
const MUTED = '#8c9ab1'
const WHITE = '#eef3f7'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: `radial-gradient(circle at 85% 10%, rgba(28,70,92,.45), transparent 55%), ${BG}`,
          color: WHITE,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 34, fontWeight: 800 }}>
          <div style={{ width: 22, height: 22, borderRadius: 999, background: LIME, boxShadow: `0 0 36px ${LIME}` }} />
          {SITE_NAME}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 0.95, letterSpacing: -4 }}>La operación que</div>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 700, lineHeight: 1.05, letterSpacing: -4 }}>
            mueve tu&nbsp;<span style={{ color: LIME }}>ciudad.</span>
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: MUTED, maxWidth: 820 }}>
            Pedidos, cadetes y rendiciones en vivo para mensajerías y cadeterías.
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, letterSpacing: 4, color: MUTED }}>
          <span style={{ color: CYAN }}>SEGUIMIENTO EN VIVO · CUENTA CORRIENTE · LIQUIDACIÓN</span>
          <span>SERVITEC</span>
        </div>
      </div>
    ),
    size,
  )
}
