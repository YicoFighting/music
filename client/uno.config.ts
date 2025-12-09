import {
  defineConfig,
  presetUno,
  presetIcons,
  presetAttributify,
} from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      cdn: 'https://esm.sh/',
    }),
  ],
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'btn-primary': 'bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg cursor-pointer transition-colors',
    'btn-icon': 'w-10 h-10 rounded-full flex-center cursor-pointer transition-all hover:bg-gray-100',
    'text-fluid-title': 'font-semibold tracking-tight text-[clamp(1.75rem,2.5vw,2.5rem)] leading-tight',
    'text-fluid-subtitle': 'tracking-wide text-[clamp(1.125rem,1.7vw,1.75rem)] leading-snug text-gray-500',
    'text-fluid-body': 'text-[clamp(0.95rem,1.1vw,1.1rem)] leading-relaxed text-gray-600',
  },
  theme: {
    colors: {
      primary: '#1db954',
      'primary-hover': '#1aa34a',
    },
    breakpoints: {
      xs: '360px',
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    fontFamily: {
      display: '"Poppins", "HarmonyOS Sans", sans-serif',
      body: '"Inter", "SF Pro", -apple-system, BlinkMacSystemFont, sans-serif',
    },
  },
  rules: [
    ['text-fluid-caption', { fontSize: 'clamp(0.75rem, 0.9vw, 0.875rem)', lineHeight: '1.4', color: '#6b7280' }],
    ['shadow-elevated', { boxShadow: '0 12px 32px -12px rgba(17, 24, 39, 0.35)' }],
    ['container-responsive', { 'max-width': 'min(1200px, 100%)', width: '100%', margin: '0 auto', padding: '0 clamp(16px, 4vw, 48px)' }],
  ],
})
