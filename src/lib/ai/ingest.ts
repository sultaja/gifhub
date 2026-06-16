import { supabaseAdmin } from '@/lib/supabase/admin'
import { slugify } from '@/lib/scraper/utils'
import type { ScrapedGif } from '@/lib/scraper/types'
import type { ValidatedGif } from './validator'

const BUCKET = 'gifs-bucket'

interface IngestResult {
  inserted: number
  skipped: number
  errors: string[]
}

export async function ingestGifs(
  pairs: Array<{ scraped: ScrapedGif; validated: ValidatedGif }>
): Promise<IngestResult> {
  const result: IngestResult = { inserted: 0, skipped: 0, errors: [] }

  const categoryMap = await buildCategoryMap()
  const subcategoryMap = await buildSubcategoryMap()

  for (const { scraped, validated } of pairs) {
    try {
      const slug = slugify(validated.seoTitle)

      const { data: existingSlug } = await supabaseAdmin
        .from('gifs')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (existingSlug) {
        result.skipped++
        continue
      }

      const sourceHash = await hashString(scraped.mediaUrl)
      const { data: existingHash } = await supabaseAdmin
        .from('gifs')
        .select('id')
        .eq('source_hash', sourceHash)
        .maybeSingle()

      if (existingHash) {
        result.skipped++
        continue
      }

      const storagePath = await downloadAndUpload(scraped.mediaUrl, slug)

      const categoryId = categoryMap.get(validated.categorySlug) ?? null
      const subcategoryId = subcategoryMap.get(validated.subcategorySlug) ?? null

      const { data: gif, error: gifError } = await supabaseAdmin
        .from('gifs')
        .insert({
          title: validated.seoTitle,
          slug,
          source_url: scraped.mediaUrl,
          storage_path: storagePath,
          alt_text: validated.seoDescription || validated.seoAltText,
          views: 0,
          likes: 0,
          category_id: categoryId,
          subcategory_id: subcategoryId,
          source_hash: sourceHash,
          usage_scenario: validated.usageScenario,
          professionalism_score: validated.professionalismScore,
          suggested_caption: validated.suggestedCaption,
        })
        .select('id')
        .single()

      if (gifError || !gif) {
        result.errors.push(`DB insert failed for "${slug}": ${gifError?.message}`)
        continue
      }

      await upsertTags(gif.id, validated.tags)
      result.inserted++
    } catch (err) {
      result.errors.push(
        `Ingest error: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  return result
}

async function downloadAndUpload(
  mediaUrl: string,
  slug: string
): Promise<string | null> {
  try {
    const response = await fetch(mediaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) return null

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > 20 * 1024 * 1024) return null
    const contentType = response.headers.get('content-type') ?? 'image/gif'
    const ext = contentType.includes('mp4')
      ? 'mp4'
      : contentType.includes('webp')
        ? 'webp'
        : contentType.includes('webm')
          ? 'webm'
          : 'gif'

    const path = `${Date.now()}-${slug}.${ext}`

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType,
        cacheControl: '31536000',
        upsert: false,
      })

    if (error) {
      console.error(`[Storage] Upload failed for ${slug}:`, error.message)
      return null
    }

    return path
  } catch (err) {
    console.error(`[Storage] Download failed for ${mediaUrl}:`, err)
    return null
  }
}

async function upsertTags(gifId: string, tagNames: string[]): Promise<void> {
  for (const name of tagNames) {
    const tagSlug = slugify(name)
    if (!tagSlug) continue

    let tagId: string

    const { data: existing } = await supabaseAdmin
      .from('tags')
      .select('id')
      .eq('slug', tagSlug)
      .maybeSingle()

    if (existing) {
      tagId = existing.id
    } else {
      const { data: newTag, error } = await supabaseAdmin
        .from('tags')
        .insert({ name: name.toLowerCase(), slug: tagSlug })
        .select('id')
        .single()

      if (error || !newTag) continue
      tagId = newTag.id
    }

    await supabaseAdmin
      .from('gif_tags')
      .upsert({ gif_id: gifId, tag_id: tagId }, { onConflict: 'gif_id,tag_id' })
  }
}

async function buildCategoryMap(): Promise<Map<string, string>> {
  const { data } = await supabaseAdmin.from('categories').select('id, slug')
  const map = new Map<string, string>()
  for (const row of data ?? []) {
    map.set(row.slug, row.id)
  }
  return map
}

async function buildSubcategoryMap(): Promise<Map<string, string>> {
  const { data } = await supabaseAdmin.from('subcategories').select('id, slug')
  const map = new Map<string, string>()
  for (const row of data ?? []) {
    map.set(row.slug, row.id)
  }
  return map
}

async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
