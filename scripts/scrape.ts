import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const CRON_SECRET = process.env.CRON_SECRET!

async function run() {
  console.log('Triggering background scrape job...')
  try {
    const res = await fetch('http://localhost:3000/api/cron/scrape', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    })
    const data = await res.json()
    console.log('Scrape response:', data)
  } catch (err) {
    console.error('Error triggering scrape:', err)
  }
}

run()
