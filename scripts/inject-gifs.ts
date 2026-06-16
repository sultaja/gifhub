import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const GIPHY_API_KEY = process.env.GIPHY_API_KEY

async function run() {
  if (!GIPHY_API_KEY) {
    console.error('GIPHY_API_KEY missing in .env.local')
    return
  }

  console.log('Fetching all categories...')
  const { data: categories, error } = await supabase.from('categories').select('id, name, slug')
  
  if (error || !categories) {
    console.error('Failed to fetch categories:', error)
    return
  }

  let totalInserted = 0

  for (const category of categories) {
    console.log(`\n========================================`)
    console.log(`Fetching 50 GIFs for category: ${category.name}`)
    console.log(`========================================`)

    // Map category to a better search term for Giphy
    let searchTerm = `${category.name} reaction`
    if (category.name === 'eCommerce') searchTerm = 'shopping reaction'
    if (category.name === 'Human Resources') searchTerm = 'office reaction'
    if (category.name === 'Fintech') searchTerm = 'money reaction'

    const query = encodeURIComponent(searchTerm)
    const offset = Math.floor(Math.random() * 200)
    const url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${query}&limit=100&offset=${offset}&rating=g`

    try {
      const res = await fetch(url)
      if (!res.ok) {
        console.error(`Giphy API failed for ${category.name}:`, res.status)
        continue
      }

      const json = await res.json()
      const gifs = json.data || []

      console.log(`Found ${gifs.length} GIFs from Giphy. Inserting into DB...`)

      for (const gif of gifs) {
        const imageUrl = gif.images?.original?.url
        if (!imageUrl) continue

        const title = gif.title || `${category.name} reaction`

        const insertData = {
          title: title.substring(0, 100),
          slug: `${category.slug}-reaction-${Math.random().toString(36).substring(2, 9)}`,
          source_url: imageUrl,
          storage_path: null,
          category_id: category.id,
          subcategory_id: null,
          professionalism_score: Math.floor(Math.random() * 20) + 80,
          usage_scenario: `Perfect for expressing ${title.replace(' GIF', '')} in Slack or Teams during a ${category.name} discussion.`,
          views: Math.floor(Math.random() * 1000),
          likes: Math.floor(Math.random() * 100)
        }

        const { error: insertError } = await supabase.from('gifs').insert(insertData)
        
        if (insertError) {
          // Ignore duplicate source_id errors
          if (!insertError.message.includes('unique constraint')) {
            console.error(`Failed to insert ${gif.id}:`, insertError.message)
          }
        } else {
          totalInserted++
        }
      }

      console.log(`Successfully added GIFs for ${category.name}!`)
    } catch (e) {
      console.error(`Error processing ${category.name}:`, e)
    }
  }

  console.log(`\nDONE! Inserted a total of ${totalInserted} new GIFs across all categories.`)
}

run()
