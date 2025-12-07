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
  },
  theme: {
    colors: {
      primary: '#1db954',
      'primary-hover': '#1aa34a',
    },
  },
})
