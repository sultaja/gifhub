import { createClient } from '@/lib/supabase/server'
import type {
  CategoryWithSubs,
  DbCategory,
  DbSubcategory,
  DbGif,
  DbTag,
  GifItem,
  GifWithRelations,
} from './types'
import { mockCategories, mockGifs } from './mock-data'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_URL !== 'https://your-project.supabase.co')
}

function resolveGifUrl(gif: DbGif): string {
  if (gif.storage_path) {
    if (gif.storage_path.startsWith('http')) return gif.storage_path
    if (SUPABASE_URL) return `${SUPABASE_URL}/storage/v1/object/public/gifs-bucket/${gif.storage_path}`
  }
  return gif.source_url ?? ''
}

function toGifItem(gif: DbGif, tags: DbTag[], catSlug: string, subSlug: string): GifItem {
  return {
    id: gif.id,
    title: gif.title,
    slug: gif.slug,
    url: resolveGifUrl(gif),
    altText: gif.alt_text ?? gif.title,
    views: gif.views,
    likes: gif.likes,
    categorySlug: catSlug,
    subcategorySlug: subSlug,
    usageScenario: gif.usage_scenario,
    professionalismScore: gif.professionalism_score,
    suggestedCaption: gif.suggested_caption,
    tags: tags.map((t) => t.name),
  }
}

// ─── Categories ──────────────────────────────────────────────

export async function getCategories(): Promise<CategoryWithSubs[]> {
  if (!isSupabaseConfigured()) {
    return mockCategories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      created_at: new Date().toISOString(),
      subcategories: c.subcategories.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        category_id: c.id,
        created_at: new Date().toISOString(),
      })),
    }))
  }

  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (!categories?.length) return []

  const { data: subcategories } = await supabase
    .from('subcategories')
    .select('*')
    .order('name')

  return categories.map((cat: DbCategory) => ({
    ...cat,
    subcategories: (subcategories ?? []).filter(
      (s: DbSubcategory) => s.category_id === cat.id
    ),
  }))
}

export async function getCategoryBySlug(slug: string): Promise<DbCategory | null> {
  if (!isSupabaseConfigured()) {
    const mock = mockCategories.find((c) => c.slug === slug)
    if (!mock) return null
    return { id: mock.id, name: mock.name, slug: mock.slug, description: mock.description, created_at: new Date().toISOString() }
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  return data ?? null
}

export async function getSubcategoryBySlug(slug: string): Promise<DbSubcategory | null> {
  if (!isSupabaseConfigured()) {
    for (const cat of mockCategories) {
      const sub = cat.subcategories.find((s) => s.slug === slug)
      if (sub) {
        return { id: sub.id, name: sub.name, slug: sub.slug, category_id: cat.id, created_at: new Date().toISOString() }
      }
    }
    return null
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('subcategories')
    .select('*')
    .eq('slug', slug)
    .single()

  return data ?? null
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

// ─── GIFs ────────────────────────────────────────────────────

export async function getLatestGifs(limit = 20): Promise<GifItem[]> {
  if (!isSupabaseConfigured()) return mockGifs.slice(0, limit)

  const supabase = await createClient()
  const { data: gifs } = await supabase
    .from('gifs')
    .select('*, category:categories(*), subcategory:subcategories(*)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!gifs?.length) return []

  const results = await Promise.all(dedupeById(gifs).map((g: GifWithRelations) => enrichGif(g)))
  return dedupeById(results)
}

export async function getFeaturedGifs(limit = 8): Promise<GifItem[]> {
  if (!isSupabaseConfigured()) return mockGifs.slice(0, limit)

  const supabase = await createClient()
  const { data: gifs } = await supabase
    .from('gifs')
    .select('*, category:categories(*), subcategory:subcategories(*)')
    .order('views', { ascending: false })
    .limit(limit)

  if (!gifs?.length) return []

  const results = await Promise.all(dedupeById(gifs).map((g: GifWithRelations) => enrichGif(g)))
  return dedupeById(results)
}

export async function getGifsByCategory(categoryId: string, limit = 30): Promise<GifItem[]> {
  if (!isSupabaseConfigured()) {
    const cat = mockCategories.find((c) => c.id === categoryId)
    if (!cat) return []
    return mockGifs.filter((g) => g.categorySlug === cat.slug).slice(0, limit)
  }

  const supabase = await createClient()
  const { data: gifs } = await supabase
    .from('gifs')
    .select('*, category:categories(*), subcategory:subcategories(*)')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!gifs?.length) return []

  const results = await Promise.all(dedupeById(gifs).map((g: GifWithRelations) => enrichGif(g)))
  return dedupeById(results)
}

export async function getGifsBySubcategory(subcategoryId: string, limit = 30): Promise<GifItem[]> {
  if (!isSupabaseConfigured()) return []

  const supabase = await createClient()
  const { data: gifs } = await supabase
    .from('gifs')
    .select('*, category:categories(*), subcategory:subcategories(*)')
    .eq('subcategory_id', subcategoryId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!gifs?.length) return []

  const results = await Promise.all(dedupeById(gifs).map((g: GifWithRelations) => enrichGif(g)))
  return dedupeById(results)
}

export async function getGifBySlug(slug: string): Promise<GifItem | null> {
  if (!isSupabaseConfigured()) {
    return mockGifs.find((g) => g.slug === slug) ?? null
  }

  const supabase = await createClient()
  const { data: gif } = await supabase
    .from('gifs')
    .select('*, category:categories(*), subcategory:subcategories(*)')
    .eq('slug', slug)
    .single()

  if (!gif) return null

  return enrichGif(gif as GifWithRelations)
}

export async function getGifBySlugRaw(slug: string): Promise<GifWithRelations | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = await createClient()
  const { data: gif } = await supabase
    .from('gifs')
    .select('*, category:categories(*), subcategory:subcategories(*)')
    .eq('slug', slug)
    .single()

  return (gif as GifWithRelations) ?? null
}

export async function getAllGifSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return mockGifs.map((g) => g.slug)

  // Uses REST fetch instead of createClient() to avoid cookies() in generateStaticParams
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

  let allSlugs: string[] = []
  let offset = 0
  const limit = 1000
  
  while (true) {
    try {
      const res = await fetch(`${url}/rest/v1/gifs?select=slug&limit=${limit}&offset=${offset}`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      })
      if (!res.ok) break
      const data: Array<{ slug: string }> = await res.json()
      if (!data || data.length === 0) break
      allSlugs.push(...data.map((g) => g.slug))
      if (data.length < limit) break
      offset += limit
    } catch {
      break
    }
  }

  return allSlugs.length > 0 ? allSlugs : mockGifs.map((g) => g.slug)
}

// ─── Tags ────────────────────────────────────────────────────

async function getTagsForGif(gifId: string): Promise<DbTag[]> {
  const supabase = await createClient()
  const { data: gifTags } = await supabase
    .from('gif_tags')
    .select('tag_id')
    .eq('gif_id', gifId)

  if (!gifTags?.length) return []

  const tagIds = gifTags.map((gt: { tag_id: string }) => gt.tag_id)
  const { data: tags } = await supabase
    .from('tags')
    .select('*')
    .in('id', tagIds)

  return tags ?? []
}

async function enrichGif(gif: GifWithRelations): Promise<GifItem> {
  const tags = await getTagsForGif(gif.id)
  return toGifItem(
    gif,
    tags,
    gif.category?.slug ?? '',
    gif.subcategory?.slug ?? ''
  )
}

// ─── Count ────────────────────────────────────────────────────

export async function getGifCount(categoryId?: string): Promise<number> {
  if (!isSupabaseConfigured()) return mockGifs.length

  const supabase = await createClient()
  let query = supabase.from('gifs').select('id', { count: 'exact', head: true })
  if (categoryId) query = query.eq('category_id', categoryId)
  const { count } = await query
  return count ?? 0
}

// ─── Category GIF Counts ─────────────────────────────────────

export async function getCategoryGifCounts(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) return {}

  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('id')
  if (!categories?.length) return {}

  const counts: Record<string, number> = {}
  await Promise.all(
    categories.map(async (cat: { id: string }) => {
      const { count } = await supabase
        .from('gifs')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', cat.id)
      counts[cat.id] = count ?? 0
    })
  )
  return counts
}

// ─── Related & Trending ──────────────────────────────────────

export async function getRelatedGifs(gifId: string, categoryId: string | null, limit = 6): Promise<GifItem[]> {
  if (!isSupabaseConfigured()) return mockGifs.slice(0, limit)

  const supabase = await createClient()

  let query = supabase
    .from('gifs')
    .select('*, category:categories(*), subcategory:subcategories(*)')
    .neq('id', gifId)

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data: gifs } = await query
    .order('views', { ascending: false })
    .limit(limit)

  if (!gifs?.length) {
    const { data: fallback } = await supabase
      .from('gifs')
      .select('*, category:categories(*), subcategory:subcategories(*)')
      .neq('id', gifId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (!fallback?.length) return []
    const results = await Promise.all(dedupeById(fallback).map((g: GifWithRelations) => enrichGif(g)))
    return dedupeById(results)
  }

  const results = await Promise.all(dedupeById(gifs).map((g: GifWithRelations) => enrichGif(g)))
  return dedupeById(results)
}

export async function getTrendingGifs(limit = 8): Promise<GifItem[]> {
  if (!isSupabaseConfigured()) return mockGifs.slice(0, limit)

  const supabase = await createClient()
  const { data: gifs } = await supabase
    .from('gifs')
    .select('*, category:categories(*), subcategory:subcategories(*)')
    .order('likes', { ascending: false })
    .limit(limit)

  if (!gifs?.length) return []

  const results = await Promise.all(dedupeById(gifs).map((g: GifWithRelations) => enrichGif(g)))
  return dedupeById(results)
}

// ─── Search ──────────────────────────────────────────────────

export async function searchGifs(query: string, limit = 20): Promise<GifItem[]> {
  if (!query.trim()) return []

  if (!isSupabaseConfigured()) {
    const q = query.toLowerCase()
    return mockGifs.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.tags.some((t) => t.toLowerCase().includes(q))
    ).slice(0, limit)
  }

  const supabase = await createClient()

  const { data: gifs } = await supabase
    .from('gifs')
    .select('*, category:categories(*), subcategory:subcategories(*)')
    .or(`title.ilike.%${query}%,alt_text.ilike.%${query}%`)
    .order('views', { ascending: false })
    .limit(limit)

  const titleResults = gifs ?? []

  if (titleResults.length >= limit) {
    const results = await Promise.all(dedupeById(titleResults).map((g: GifWithRelations) => enrichGif(g)))
    return dedupeById(results)
  }

  const existingIds = new Set(titleResults.map((g) => g.id))

  const { data: tagMatches } = await supabase
    .from('tags')
    .select('id')
    .ilike('name', `%${query}%`)

  if (tagMatches?.length) {
    const tagIds = tagMatches.map((t: { id: string }) => t.id)
    const { data: gifTagRows } = await supabase
      .from('gif_tags')
      .select('gif_id')
      .in('tag_id', tagIds)

    if (gifTagRows?.length) {
      const tagGifIds = [...new Set(gifTagRows.map((r: { gif_id: string }) => r.gif_id))]
        .filter((id) => !existingIds.has(id))
        .slice(0, limit - titleResults.length)

      if (tagGifIds.length) {
        const { data: tagGifs } = await supabase
          .from('gifs')
          .select('*, category:categories(*), subcategory:subcategories(*)')
          .in('id', tagGifIds)

        if (tagGifs?.length) {
          titleResults.push(...tagGifs)
        }
      }
    }
  }

  if (!titleResults.length) return []
  const results = await Promise.all(dedupeById(titleResults).map((g: GifWithRelations) => enrichGif(g)))
  return dedupeById(results)
}
