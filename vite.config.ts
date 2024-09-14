import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import AutoImport from 'unplugin-auto-import/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import jotaiDebugLabel from 'jotai/babel/plugin-debug-label'
import jotaiReactRefresh from 'jotai/babel/plugin-react-refresh'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [jotaiDebugLabel, jotaiReactRefresh]
      }
    }),
    TanStackRouterVite(),
    AutoImport({
      imports: [
        'react',
        'jotai',
        {
          '@mantine/core': [
            'MantineProvider'
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
