import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import AutoImport from 'unplugin-auto-import/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import jotaiDebugLabel from 'jotai/babel/plugin-debug-label'
import jotaiReactRefresh from 'jotai/babel/plugin-react-refresh'
import UnoCSS from 'unocss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [jotaiDebugLabel, jotaiReactRefresh]
      }
    }),
    UnoCSS(),
    TanStackRouterVite(),
    AutoImport({
      imports: [
        'react',
        'jotai',
        {
          '@mantine/core': [
            'MantineProvider',
            'Title',
            'Button',
            ['Text', 'MText'],
          ],
          '@tanstack/react-router': [
            'createRootRoute',
            'createLazyFileRoute',
          ],
        }
      ],
      dirs: [
        'src/atoms'
      ]
    })
  ],
})
