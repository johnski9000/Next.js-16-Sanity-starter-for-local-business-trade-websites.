import {ImageResponse} from 'next/og'

export const runtime = 'edge'

const NAVY = '#1e345b'
const BLUE = '#1b9cde'

export async function GET(req: Request) {
  // All brand text is passed in via query params (eyebrow = business name,
  // tagline = strapline) so this route carries no hard-coded client identity.
  const {searchParams} = new URL(req.url)
  const title = (searchParams.get('title') || 'Welcome').slice(0, 120)
  const eyebrow = (searchParams.get('eyebrow') || '').slice(0, 60)
  const tagline = (searchParams.get('tagline') || '').slice(0, 80)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: NAVY,
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        {eyebrow ? (
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: BLUE,
            }}
          >
            {eyebrow}
          </div>
        ) : (
          <div style={{display: 'flex'}} />
        )}
        <div
          style={{
            display: 'flex',
            fontSize: 68,
            fontWeight: 700,
            color: 'white',
            lineHeight: 1.1,
            maxWidth: '900px',
          }}
        >
          {title}
        </div>
        {tagline ? (
          <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <div style={{width: 64, height: 8, background: BLUE, borderRadius: 4}} />
            <div style={{fontSize: 26, color: 'rgba(255,255,255,0.7)'}}>{tagline}</div>
          </div>
        ) : (
          <div style={{display: 'flex'}} />
        )}
      </div>
    ),
    {width: 1200, height: 630},
  )
}
