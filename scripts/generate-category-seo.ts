import { createClient } from '@supabase/supabase-js'
import { GoogleGenAI } from '@google/genai'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const geminiKey = process.env.GEMINI_API_KEY!
const ai = new GoogleGenAI({ apiKey: geminiKey })

async function run() {
  console.log('Fetching categories...')
  const { data: categories, error } = await supabase.from('categories').select('id, name, slug')
  
  if (error || !categories) {
    console.error('Error fetching categories:', error)
    return
  }

  console.log(`Found ${categories.length} categories. Starting generation...`)

  for (const cat of categories) {
    console.log(`\nGenerating SEO guide for: ${cat.name}`)
    
    const prompt = `You are a Senior Editor at Harvard Business Review and an expert in digital workplace culture.
We are building the "Ultimate Guide to ${cat.name} Communication" using GIFs.
Write a highly professional, deep, and actionable 400-500 word SEO-optimized guide about how to use GIFs effectively in ${cat.name}.

REQUIREMENTS:
1. Format as valid HTML (no markdown syntax, just raw HTML).
2. Use <h2> and <h3> for headings. Do NOT use <h1>. Add id attributes to headings.
3. Include sections like: "The Psychology of GIFs in ${cat.name}", "Best Practices", "Common Mistakes to Avoid".
4. Include actionable advice for professionals working in ${cat.name}.
5. Use <p>, <ul>, <li>, <strong> tags.
6. The tone must be authoritative, expert, and professional.

Return ONLY the raw HTML string, no markdown code blocks, no wrapping JSON.`

    try {
      let html = ''
      let retries = 3
      while (retries > 0) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
          })
          html = response.text || ''
          break
        } catch (err: any) {
          if (err.status === 429) {
            console.log('Rate limited. Waiting 10s...')
            await new Promise(r => setTimeout(r, 10000))
            retries--
          } else {
            throw err
          }
        }
      }
      
      html = html.replace(/^```html\n/, '').replace(/\n```$/, '').trim()
      
      console.log(`Generated ${html.length} chars of HTML. Saving to database...`)
      
      const { error: updateError } = await supabase
        .from('categories')
        .update({ description: html })
        .eq('id', cat.id)
        
      if (updateError) {
        console.error(`Failed to update ${cat.name}:`, updateError)
      } else {
        console.log(`Successfully updated ${cat.name}`)
      }
      
    } catch (err) {
      console.error(`Error generating for ${cat.name}:`, err)
    }
    
    // Add a small delay between Gemini calls
    await new Promise(r => setTimeout(r, 2000))
  }
  
  console.log('\nAll done!')
}

run()
