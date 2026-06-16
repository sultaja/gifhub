import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Fetching categories...')
  const { data: categories, error } = await supabase.from('categories').select('id, name, description')
  
  if (error || !categories) {
    console.error('Error fetching categories:', error)
    return
  }

  console.log(`Found ${categories.length} categories. Starting cleanup...`)

  for (const cat of categories) {
    if (!cat.description) continue

    let html = cat.description
    
    // Check if it has <body> tags
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
      console.log(`Found <body> tag in ${cat.name}, extracting contents...`)
      html = bodyMatch[1]
    } else {
      // Just in case it has <html> but no body
      html = html.replace(/<!DOCTYPE html>/gi, '')
                 .replace(/<html[^>]*>/gi, '')
                 .replace(/<\/html>/gi, '')
                 .replace(/<head>[\s\S]*?<\/head>/gi, '')
    }

    html = html.trim()
    
    if (html !== cat.description) {
      const { error: updateError } = await supabase
        .from('categories')
        .update({ description: html })
        .eq('id', cat.id)
        
      if (updateError) {
        console.error(`Failed to update ${cat.name}:`, updateError)
      } else {
        console.log(`Successfully cleaned ${cat.name}`)
      }
    } else {
      console.log(`${cat.name} is already clean.`)
    }
  }
  
  console.log('\nAll done!')
}

run()
