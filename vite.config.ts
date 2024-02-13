import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const hash = Math.floor(Math.random() * 90000) + 10000;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
