//import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default {
  plugins: [react()],
  base: "/kaspa-archive-project/",
  resolve: {
    alias: {
      stream: "stream-browserify"
    }
  },
  define: {
    global: {}
  }
}
