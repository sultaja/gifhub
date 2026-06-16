import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'
import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'

loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'subcategory-seo.json')

// Helper function to try generating with primary model, then fallback
async function generateWithFallback(prompt: string): Promise<string> {
  const models = ['gemini-2.5-pro', 'gemini-2.5-flash']
  
  for (const model of models) {
    let retries = 3
    while (retries > 0) {
      try {
        console.log(`[BlogAI] Trying ${model} (attempt ${4 - retries}/3)...`)
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.7,
          }
        })
        if (response.text) return response.text
      } catch (error: any) {
        if (error?.status === 429) {
          console.log(`[BlogAI] ${model} returned 429, retrying in 5s...`)
          await new Promise(r => setTimeout(r, 5000))
          retries--
        } else if (error?.status === 503) {
          console.log(`[BlogAI] ${model} returned 503, retrying in 2s...`)
          await new Promise(r => setTimeout(r, 2000))
          retries--
        } else {
          console.error(`[BlogAI] ${model} failed:`, error.message)
          break // Try next model immediately
        }
      }
    }
    console.log(`[BlogAI] ${model} exhausted retries, trying next model...`)
  }
  throw new Error('All models failed to generate content')
}

async function run() {
  console.log('Fetching subcategories...')
  
  // We need category name too
  const { data: subcategories, error } = await supabase
    .from('subcategories')
    .select('id, name, slug, categories(name)')
  
  if (error || !subcategories) {
    console.error('Error fetching subcategories:', error)
    return
  }

  console.log(`Found ${subcategories.length} subcategories.`)

  let seoData: Record<string, string> = {}
  if (fs.existsSync(DATA_FILE)) {
    seoData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'))
  }

  let newCount = 0

  for (const sub of subcategories) {
    const categoryName = (sub.categories as any)?.name || 'Professional'
    const subName = sub.name
    const slug = sub.slug

    if (seoData[slug]) {
      console.log(`Skipping ${subName} (already generated)`)
      continue
    }

    console.log(`\nGenerating SEO guide for: ${categoryName} > ${subName}`)
    
    const prompt = `
You are an expert content strategist for a professional platform like Harvard Business Review, but specializing in modern digital workplace communication.
Write a highly professional, engaging, and detailed "Ultimate Guide" (around 400 words) on the topic: "Using GIFs for ${subName} in ${categoryName}".

Focus on:
- The psychology behind visual communication in this specific context (${subName}).
- Why and when professionals should use GIFs for this scenario.
- Best practices and common pitfalls.
- Use a sophisticated, authoritative tone.

OUTPUT FORMAT:
Return ONLY raw, valid HTML. DO NOT wrap it in \`\`\`html or any other markdown block. DO NOT INCLUDE <html>, <head>, or <body> tags.
Start directly with <h2> or <h3> tags and use <p>, <ul>, <li>, <strong>. No CSS classes. 
Example start: <h2>The Strategic Value of GIFs in ${subName}</h2><p>In the fast-paced world of ${categoryName}...</p>
    `

    try {
      let html = await generateWithFallback(prompt)
      
      // Clean up markdown block if it sneaks in
      html = html.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim()
      // Clean up html/body tags if they sneak in
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
      if (bodyMatch) {
        html = bodyMatch[1]
      } else {
        html = html.replace(/<!DOCTYPE html>/gi, '')
                   .replace(/<html[^>]*>/gi, '')
                   .replace(/<\/html>/gi, '')
                   .replace(/<head>[\s\S]*?<\/head>/gi, '')
      }
      html = html.trim()

      seoData[slug] = html
      fs.writeFileSync(DATA_FILE, JSON.stringify(seoData, null, 2))
      
      console.log(`Successfully generated and saved ${subName}`)
      newCount++
      
      // Wait 3 seconds to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 3000))
    } catch (e) {
      console.error(`Error generating for ${subName}:`, e)
    }
  }

  console.log(`\nAll done! Generated ${newCount} new guides.`)
}

run()
