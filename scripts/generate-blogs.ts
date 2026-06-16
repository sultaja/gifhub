import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// The blog generator API route URL on our local dev server
const GENERATE_API_URL = 'http://localhost:3000/api/admin/blog/generate'

const TOPICS = [
  "The Manager's Guide to Digital Empathy: Reading the Room When There Is No Room",
  "Slack Etiquette 101: When to Thread, When to DM, and When to Use a GIF",
  "Visual Communication in Agile Standups: Keeping it Brief and Engaging",
  "The ROI of Psychological Safety: How Micro-Interactions Build Macro-Results",
  "Communicating Bad News Remotely: Balancing Compassion and Clarity",
  "The Introvert's Advantage in Asynchronous Communication",
  "Decoding Developer Speak: A Guide for Product Managers and Designers",
  "Sales Follow-Ups That Actually Work (And Don't Annoy Your Prospects)",
  "How to Give Constructive Feedback to Gen Z Employees",
  "The Art of the Virtual Water Cooler: Fostering Spontaneous Connection",
  "Navigating Time Zone Differences: Communication Strategies for Global Teams",
  "Why Your Engineering Team Needs Better Memes",
  "Customer Success in the Digital Age: Using Empathy to Reduce Churn",
  "The Anatomy of a Perfect Out-of-Office Message",
  "From Burnout to Breakthrough: Communicating Boundaries in a 24/7 Workplace"
]

async function run() {
  console.log(`Starting generation of ${TOPICS.length} advanced blog posts...`)

  for (const topic of TOPICS) {
    console.log(`\n========================================`)
    console.log(`Generating: "${topic}"`)
    console.log(`========================================`)

    try {
      const res = await fetch(GENERATE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        },
        body: JSON.stringify({
          topic,
          tone: 'professional, harvard business review, engaging, authoritative, modern'
        })
      })

      if (!res.ok) {
        const errorText = await res.text()
        console.error(`Failed to generate "${topic}":`, res.status, errorText)
        continue
      }

      const data = await res.json()
      
      if (!data.post || !data.post.id) {
        console.error(`Failed to generate "${topic}": Invalid response format`)
        continue
      }

      console.log(`Successfully generated draft post! ID: ${data.post.id}`)
      
      // Auto-publish it immediately
      console.log('Publishing post...')
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({ published: true })
        .eq('id', data.post.id)

      if (updateError) {
        console.error('Failed to publish post:', updateError)
      } else {
        console.log('Post published successfully!')
      }
      
      // Wait 10 seconds before generating the next one to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 10000))

    } catch (e) {
      console.error(`Exception generating "${topic}":`, e)
    }
  }

  console.log('\nAll advanced blogs generated and published!')
}

run()
