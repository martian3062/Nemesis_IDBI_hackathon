import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served under /nemesis_idbi on the deployment VM so it can coexist with other
// apps on the same host. Dev server also runs under this base.
// https://vite.dev/config/
export default defineConfig({
  base: '/nemesis_idbi/',
  plugins: [react()],
})
