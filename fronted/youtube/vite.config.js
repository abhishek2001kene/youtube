import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({

  server:{
    proxy:{
      'v1/api/users':'http://localhost:8000',
    },
  },
  plugins: [react()],
})
