import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import quoteHandler from './api/quote.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'ALPHA_VANTAGE_')
  if (env.ALPHA_VANTAGE_API_KEY) process.env.ALPHA_VANTAGE_API_KEY = env.ALPHA_VANTAGE_API_KEY
  return {
    plugins: [react(), tailwindcss(), {
      name: 'local-quote-api',
      configureServer(server) {
        server.middlewares.use('/api/quote', (req, res) => {
          req.query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams)
          res.status = code => { res.statusCode = code; return res }
          res.json = data => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)) }
          void quoteHandler(req, res)
        })
      },
    }],
  }
})
