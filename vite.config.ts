import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import AutoImport from 'unplugin-auto-import/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
    AutoImport({
      imports: [
        'react',
        'jotai',
        {
          '@mantine/core': [
            'MantineProvider'
          ]
        }
      ],
      dirs: [
        'src/atoms'
      ]
    })
  ],
})
