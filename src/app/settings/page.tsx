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
  { name: 'Forest', colors: ['#16A34A', '#4ADE80', '#F0FDF4'],
    vars: { '--accent': '#16A34A', '--accent-light': '#F0FDF4' },
    darkVars: { '--accent': '#4ADE80', '--accent-light': '#14532D' } },
  { name: 'Sunset', colors: ['#F97316', '#FB923C', '#FFF7ED'],
    vars: { '--accent': '#F97316', '--accent-light': '#FFF7ED' },
    darkVars: { '--accent': '#FB923C', '--accent-light': '#7C2D12' } },
  { name: 'Lavender', colors: ['#8B5CF6', '#A78BFA', '#F5F3FF'],
    vars: { '--accent': '#8B5CF6', '--accent-light': '#F5F3FF' },
    darkVars: { '--accent': '#A78BFA', '--accent-light': '#3B0764' } },
  { name: 'Rose', colors: ['#E11D48', '#FB7185', '#FFF1F2'],
    vars: { '--accent': '#E11D48', '--accent-light': '#FFF1F2' },
    darkVars: { '--accent': '#FB7185', '--accent-light': '#4C0519' } },
  { name: 'Slate', colors: ['#475569', '#94A3B8', '#F8FAFC'],
    vars: { '--accent': '#475569', '--accent-light': '#F8FAFC' },
    darkVars: { '--accent': '#94A3B8', '--accent-light': '#1E293B' } },
  { name: 'Midnight', colors: ['#1E40AF', '#3B82F6', '#EFF6FF'],
    vars: { '--accent': '#1E40AF', '--accent-light': '#EFF6FF' },
    darkVars: { '--accent': '#3B82F6', '--accent-light': '#172554' } },
  { name: 'Clay', colors: ['#C2410C', '#EA580C', '#FFF7ED'],
    vars: { '--accent': '#C2410C', '--accent-light': '#FFF7ED' },
    darkVars: { '--accent': '#EA580C', '--accent-light': '#431407' } },
  { name: 'Sage', colors: ['#15803D', '#22C55E', '#F0FDF4'],
    vars: { '--accent': '#15803D', '--accent-light': '#F0FDF4' },
    darkVars: { '--accent': '#22C55E', '--accent-light': '#14532D' } },
  { name: 'Coffee', colors: ['#78350F', '#A16207', '#FEFCE8'],
    vars: { '--accent': '#78350F', '--accent-light': '#FEFCE8' },
    darkVars: { '--accent': '#A16207', '--accent-light': '#422006' } },
  { name: 'Mint', colors: ['#0D9488', '#2DD4BF', '#F0FDFA'],
    vars: { '--accent': '#0D9488', '--accent-light': '#F0FDFA' },
    darkVars: { '--accent': '#2DD4BF', '--accent-light': '#134E4A' } },
  // Pastels
  { name: 'Pastel Pink', colors: ['#F9A8D4', '#FBCFE8', '#FDF2F8'],
    vars: { '--accent': '#EC4899', '--accent-light': '#FDF2F8' },
    darkVars: { '--accent': '#F9A8D4', '--accent-light': '#500724' } },
  { name: 'Pastel Blue', colors: ['#93C5FD', '#BFDBFE', '#EFF6FF'],
    vars: { '--accent': '#60A5FA', '--accent-light': '#EFF6FF' },
    darkVars: { '--accent': '#93C5FD', '--accent-light': '#1E3A5F' } },
  { name: 'Pastel Green', colors: ['#86EFAC', '#BBF7D0', '#F0FDF4'],
    vars: { '--accent': '#4ADE80', '--accent-light': '#F0FDF4' },
    darkVars: { '--accent': '#86EFAC', '--accent-light': '#14532D' } },
  { name: 'Pastel Lilac', colors: ['#C4B5FD', '#DDD6FE', '#F5F3FF'],
    vars: { '--accent': '#A78BFA', '--accent-light': '#F5F3FF' },
    darkVars: { '--accent': '#C4B5FD', '--accent-light': '#3B0764' } },
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
                border: currentPalette === p.name ? `2px solid ${p.colors[0]}` : '1px solid var(--border)',
                background: currentPalette === p.name ? 'var(--accent-light)' : 'var(--bg-primary)',
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
