'use client'
import { useEffect } from 'react'
import { db } from '@/db/schema'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function loadSettings() {
      const font = await db.settings.where('key').equals('font').first()
      if (font?.value && font.value !== 'System Default') {
        // Load Google Fonts
        if (!document.querySelector('link[data-fluent-fonts]')) {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(font.value).replace(/%20/g, '+') + ':wght@400;500;600;700&display=swap'
          link.setAttribute('data-fluent-fonts', 'true')
          document.head.appendChild(link)
        }
        const fontMap: Record<string, string> = {
          'Inter': '"Inter", sans-serif',
          'Poppins': '"Poppins", sans-serif',
          'DM Sans': '"DM Sans", sans-serif',
          'Lexend': '"Lexend", sans-serif',
          'Lato': '"Lato", sans-serif',
          'Source Sans Pro': '"Source Sans 3", sans-serif',
          'IBM Plex Sans': '"IBM Plex Sans", sans-serif',
          'Raleway': '"Raleway", sans-serif',
          'Outfit': '"Outfit", sans-serif',
          'Space Grotesk': '"Space Grotesk", sans-serif',
          'Georgia': 'Georgia, "Times New Roman", serif',
          'Playfair Display': '"Playfair Display", serif',
          'Merriweather': '"Merriweather", serif',
          'Lora': '"Lora", serif',
          'JetBrains Mono': '"JetBrains Mono", monospace',
          'Fira Code': '"Fira Code", monospace',
          'Source Code Pro': '"Source Code Pro", monospace',
        }
        if (fontMap[font.value]) {
          document.body.style.fontFamily = fontMap[font.value]
        }
      }

      const palette = await db.settings.where('key').equals('palette').first()
      if (palette?.value && palette.value !== 'Default') {
        // Re-apply palette vars on load — import the palette list dynamically would be heavy,
        // so we store just accent + accent-light in settings
        const accentSetting = await db.settings.where('key').equals('palette_accent').first()
        const accentLightSetting = await db.settings.where('key').equals('palette_accent_light').first()
        if (accentSetting?.value) document.documentElement.style.setProperty('--accent', accentSetting.value)
        if (accentLightSetting?.value) document.documentElement.style.setProperty('--accent-light', accentLightSetting.value)
      }
    }
    loadSettings()
  }, [])

  return <>{children}</>
}
