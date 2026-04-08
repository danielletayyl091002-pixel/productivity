'use client'
import { useEffect, useState } from 'react'
import { db } from '@/db/schema'

const PALETTES: {
  name: string
  colors: [string, string, string]
  vars: Record<string, string>
  darkVars: Record<string, string>
}[] = [
  { name: 'Default', colors: ['#3B82F6', '#60A5FA', '#EFF6FF'],
    vars: { '--accent': '#3B82F6', '--accent-light': '#EFF6FF' },
    darkVars: { '--accent': '#60A5FA', '--accent-light': '#1E3A5F' } },
  { name: 'Ocean', colors: ['#0EA5E9', '#38BDF8', '#F0F9FF'],
    vars: { '--accent': '#0EA5E9', '--accent-light': '#F0F9FF' },
    darkVars: { '--accent': '#38BDF8', '--accent-light': '#0C4A6E' } },
  { name: 'Midnight', colors: ['#1E40AF', '#3B82F6', '#EFF6FF'],
    vars: { '--accent': '#1E40AF', '--accent-light': '#EFF6FF' },
    darkVars: { '--accent': '#3B82F6', '--accent-light': '#172554' } },
  { name: 'Lavender', colors: ['#8B5CF6', '#A78BFA', '#F5F3FF'],
    vars: { '--accent': '#8B5CF6', '--accent-light': '#F5F3FF' },
    darkVars: { '--accent': '#A78BFA', '--accent-light': '#3B0764' } },
  { name: 'Periwinkle', colors: ['#6B7FD4', '#8B9FE8', '#F0F2FD'],
    vars: { '--accent': '#6B7FD4', '--accent-light': '#F0F2FD' },
    darkVars: { '--accent': '#8B9FE8', '--accent-light': '#0A0E3D' } },
  { name: 'Rose', colors: ['#E11D48', '#FB7185', '#FFF1F2'],
    vars: { '--accent': '#E11D48', '--accent-light': '#FFF1F2' },
    darkVars: { '--accent': '#FB7185', '--accent-light': '#4C0519' } },
  { name: 'Sakura', colors: ['#D4859A', '#E8A0B0', '#FDF0F3'],
    vars: { '--accent': '#D4859A', '--accent-light': '#FDF0F3' },
    darkVars: { '--accent': '#E8A0B0', '--accent-light': '#3D1A22' } },
  { name: 'Dusty Rose', colors: ['#B07080', '#C99AAA', '#FAF0F2'],
    vars: { '--accent': '#B07080', '--accent-light': '#FAF0F2' },
    darkVars: { '--accent': '#C99AAA', '--accent-light': '#2E1018' } },
  { name: 'Lychee', colors: ['#E8607A', '#F08090', '#FEF0F2'],
    vars: { '--accent': '#E8607A', '--accent-light': '#FEF0F2' },
    darkVars: { '--accent': '#F08090', '--accent-light': '#3D0510' } },
  { name: 'Milkshake', colors: ['#E8A0C0', '#F0C0D8', '#FDF5FA'],
    vars: { '--accent': '#E8A0C0', '--accent-light': '#FDF5FA' },
    darkVars: { '--accent': '#F0C0D8', '--accent-light': '#3D0A22' } },
  { name: 'Sunset', colors: ['#F97316', '#FB923C', '#FFF7ED'],
    vars: { '--accent': '#F97316', '--accent-light': '#FFF7ED' },
    darkVars: { '--accent': '#FB923C', '--accent-light': '#7C2D12' } },
  { name: 'Cheesecake', colors: ['#C4A265', '#D4B885', '#FDF8EF'],
    vars: { '--accent': '#C4A265', '--accent-light': '#FDF8EF' },
    darkVars: { '--accent': '#D4B885', '--accent-light': '#2E200A' } },
  { name: 'Oat Milk', colors: ['#C8A882', '#D8C0A0', '#FAF6F0'],
    vars: { '--accent': '#C8A882', '--accent-light': '#FAF6F0' },
    darkVars: { '--accent': '#D8C0A0', '--accent-light': '#2E1E08' } },
  { name: 'Mocha', colors: ['#8B5E3C', '#A87850', '#FBF5F0'],
    vars: { '--accent': '#8B5E3C', '--accent-light': '#FBF5F0' },
    darkVars: { '--accent': '#A87850', '--accent-light': '#1E0E05' } },
  { name: 'Matcha', colors: ['#5C7A5C', '#8FAF8F', '#F0F5F0'],
    vars: { '--accent': '#5C7A5C', '--accent-light': '#F0F5F0' },
    darkVars: { '--accent': '#8FAF8F', '--accent-light': '#1A2E1A' } },
  { name: 'Eucalyptus', colors: ['#4A8C7F', '#6BB5A6', '#EDF5F4'],
    vars: { '--accent': '#4A8C7F', '--accent-light': '#EDF5F4' },
    darkVars: { '--accent': '#6BB5A6', '--accent-light': '#0F2926' } },
  { name: 'Pistachio', colors: ['#8DB870', '#ADDC90', '#F4FAF0'],
    vars: { '--accent': '#8DB870', '--accent-light': '#F4FAF0' },
    darkVars: { '--accent': '#ADDC90', '--accent-light': '#142A08' } },
  { name: 'Fern', colors: ['#15803D', '#22C55E', '#F0FDF4'],
    vars: { '--accent': '#15803D', '--accent-light': '#F0FDF4' },
    darkVars: { '--accent': '#22C55E', '--accent-light': '#14532D' } },
  { name: 'Pastel Pink', colors: ['#F9A8D4', '#FBCFE8', '#FDF2F8'],
    vars: { '--accent': '#EC4899', '--accent-light': '#FDF2F8' },
    darkVars: { '--accent': '#F9A8D4', '--accent-light': '#500724' } },
  { name: 'Pastel Green', colors: ['#86EFAC', '#BBF7D0', '#F0FDF4'],
    vars: { '--accent': '#4ADE80', '--accent-light': '#F0FDF4' },
    darkVars: { '--accent': '#86EFAC', '--accent-light': '#14532D' } },
  { name: 'Pastel Lilac', colors: ['#C4B5FD', '#DDD6FE', '#F5F3FF'],
    vars: { '--accent': '#A78BFA', '--accent-light': '#F5F3FF' },
    darkVars: { '--accent': '#C4B5FD', '--accent-light': '#3B0764' } },
  { name: 'Slate', colors: ['#475569', '#94A3B8', '#F8FAFC'], vars: { '--accent': '#475569', '--accent-light': '#F8FAFC' }, darkVars: { '--accent': '#94A3B8', '--accent-light': '#1E293B' } },
]

const FONT_GROUPS: { group: string; fonts: { name: string; family: string }[] }[] = [
  { group: 'Sans-serif', fonts: [
    { name: 'System Default', family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
    { name: 'Inter', family: '"Inter", sans-serif' },
    { name: 'Poppins', family: '"Poppins", sans-serif' },
    { name: 'DM Sans', family: '"DM Sans", sans-serif' },
    { name: 'Lexend', family: '"Lexend", sans-serif' },
    { name: 'Lato', family: '"Lato", sans-serif' },
    { name: 'Source Sans Pro', family: '"Source Sans 3", sans-serif' },
    { name: 'IBM Plex Sans', family: '"IBM Plex Sans", sans-serif' },
    { name: 'Raleway', family: '"Raleway", sans-serif' },
    { name: 'Outfit', family: '"Outfit", sans-serif' },
    { name: 'Space Grotesk', family: '"Space Grotesk", sans-serif' },
  ]},
  { group: 'Serif', fonts: [
    { name: 'Georgia', family: 'Georgia, "Times New Roman", serif' },
    { name: 'Playfair Display', family: '"Playfair Display", serif' },
    { name: 'Merriweather', family: '"Merriweather", serif' },
    { name: 'Lora', family: '"Lora", serif' },
  ]},
  { group: 'Monospace', fonts: [
    { name: 'JetBrains Mono', family: '"JetBrains Mono", monospace' },
    { name: 'Fira Code', family: '"Fira Code", monospace' },
    { name: 'Source Code Pro', family: '"Source Code Pro", monospace' },
  ]},
]

// Google Fonts URL for all the fonts we use
const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Lexend:wght@400;500;600;700&family=Lato:wght@400;700&family=Source+Sans+3:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=Raleway:wght@400;500;600;700&family=Outfit:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@400;600;700&family=Merriweather:wght@400;700&family=Lora:wght@400;600;700&family=JetBrains+Mono:wght@400;500;700&family=Fira+Code:wght@400;500;700&family=Source+Code+Pro:wght@400;600;700&display=swap'

export default function SettingsPage() {
  const [currentPalette, setCurrentPalette] = useState('Default')
  const [currentFont, setCurrentFont] = useState('System Default')
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [weekStart, setWeekStart] = useState('sunday')

  useEffect(() => {
    // Load saved settings
    async function loadSettings() {
      const palette = await db.settings.where('key').equals('palette').first()
      const font = await db.settings.where('key').equals('font').first()
      if (palette?.value) setCurrentPalette(palette.value)
      if (font?.value) setCurrentFont(font.value)
    }
    loadSettings()

    // Load week start preference
    const savedWeekStart = localStorage.getItem('week_start')
    if (savedWeekStart) setWeekStart(savedWeekStart)

    // Load Google Fonts
    if (!document.querySelector('link[data-fluent-fonts]')) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = GOOGLE_FONTS_URL
      link.setAttribute('data-fluent-fonts', 'true')
      link.onload = () => setFontsLoaded(true)
      document.head.appendChild(link)
    } else {
      setFontsLoaded(true)
    }
  }, [])

  async function applyPalette(paletteName: string) {
    const palette = PALETTES.find(p => p.name === paletteName)
    if (!palette) return
    const theme = document.documentElement.getAttribute('data-theme') || 'light'
    const vars = theme === 'dark' ? palette.darkVars : palette.vars
    for (const [key, value] of Object.entries(vars)) {
      document.documentElement.style.setProperty(key, value)
    }
    setCurrentPalette(paletteName)
    // Save palette name
    const existing = await db.settings.where('key').equals('palette').first()
    if (existing?.id) {
      await db.settings.update(existing.id, { value: paletteName })
    } else {
      await db.settings.add({ key: 'palette', value: paletteName })
    }
    // Save accent vars for restore on load
    const accentVal = vars['--accent'] || ''
    const accentLightVal = vars['--accent-light'] || ''
    const accentExist = await db.settings.where('key').equals('palette_accent').first()
    if (accentExist?.id) { await db.settings.update(accentExist.id, { value: accentVal }) }
    else { await db.settings.add({ key: 'palette_accent', value: accentVal }) }
    const accentLightExist = await db.settings.where('key').equals('palette_accent_light').first()
    if (accentLightExist?.id) { await db.settings.update(accentLightExist.id, { value: accentLightVal }) }
    else { await db.settings.add({ key: 'palette_accent_light', value: accentLightVal }) }
  }

  async function applyFont(fontName: string) {
    const allFonts = FONT_GROUPS.flatMap(g => g.fonts)
    const font = allFonts.find(f => f.name === fontName)
    if (!font) return
    document.body.style.fontFamily = font.family
    setCurrentFont(fontName)
    const existing = await db.settings.where('key').equals('font').first()
    if (existing?.id) {
      await db.settings.update(existing.id, { value: fontName })
    } else {
      await db.settings.add({ key: 'font', value: fontName })
    }
  }

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'var(--bg-primary)' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 40px 120px' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Settings</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '40px' }}>Customize your workspace.</p>

        {/* Color Palettes */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Accent Color</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>Choose a palette for links, buttons, and highlights.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
            {PALETTES.map(p => (
              <button key={p.name} onClick={() => applyPalette(p.name)} style={{
                padding: '12px',
                borderRadius: '10px',
                border: currentPalette === p.name ? `2px solid ${p.colors[0]}` : `1px solid ${p.colors[1]}40`,
                background: currentPalette === p.name ? p.colors[2] : p.colors[2] + '80',
                cursor: 'pointer',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                  {p.colors.map((c, i) => (
                    <div key={i} style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: c, border: '1px solid rgba(0,0,0,0.08)'
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Custom color
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="color"
                defaultValue="#3B82F6"
                onChange={e => {
                  const hex = e.target.value
                  const r = parseInt(hex.slice(1,3), 16)
                  const g = parseInt(hex.slice(3,5), 16)
                  const b = parseInt(hex.slice(5,7), 16)
                  const light = `rgba(${r},${g},${b},0.12)`
                  document.documentElement.style.setProperty('--accent', hex)
                  document.documentElement.style.setProperty('--accent-light', light)
                  setCurrentPalette('Custom')
                  db.settings.where('key').equals('palette_accent').first().then(ex => {
                    if (ex?.id) db.settings.update(ex.id, { value: hex })
                    else db.settings.add({ key: 'palette_accent', value: hex })
                  })
                  db.settings.where('key').equals('palette_accent_light').first().then(ex => {
                    if (ex?.id) db.settings.update(ex.id, { value: light })
                    else db.settings.add({ key: 'palette_accent_light', value: light })
                  })
                }}
                style={{
                  width: '36px', height: '36px',
                  borderRadius: '8px', border: '1px solid var(--border)',
                  padding: '2px', cursor: 'pointer',
                  background: 'none'
                }}
              />
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Pick any accent color
              </span>
            </div>
          </div>
        </section>

        {/* Week starts on */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Week starts on</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['sunday', 'monday'].map(day => (
              <button
                key={day}
                onClick={() => {
                  localStorage.setItem('week_start', day)
                  setWeekStart(day)
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: weekStart === day ? 'var(--accent)' : 'transparent',
                  color: weekStart === day ? 'white' : 'var(--text-secondary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {day}
              </button>
            ))}
          </div>
        </section>

        {/* Fonts */}
        <section>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Font</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>Choose a typeface for your workspace.</p>
          {FONT_GROUPS.map(group => (
            <div key={group.group} style={{ marginBottom: '20px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--text-tertiary)',
                marginBottom: '8px'
              }}>{group.group}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {group.fonts.map(f => (
                  <button key={f.name} onClick={() => applyFont(f.name)} style={{
                    padding: '8px 14px', borderRadius: '8px',
                    border: currentFont === f.name ? '2px solid var(--accent)' : '1px solid var(--border)',
                    background: currentFont === f.name ? 'var(--accent-light)' : 'transparent',
                    cursor: 'pointer',
                    fontFamily: fontsLoaded ? f.family : undefined,
                    fontSize: '13px',
                    color: 'var(--text-primary)',
                    fontWeight: 500
                  }}>{f.name}</button>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
