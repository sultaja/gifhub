import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = parseInt(url.searchParams.get('limit') ?? '12')
  const sort = url.searchParams.get('sort') ?? 'latest'
  const categoryId = url.searchParams.get('category_id') ?? ''

  const offset = (page - 1) * limit
  const supabase = await createClient()

  let query = supabase
    .from('gifs')
    .select('*, category:categories(slug), subcategory:subcategories(slug)', { count: 'exact' })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (sort === 'trending') {
    query = query.order('likes', { ascending: false })
  } else if (sort === 'popular') {
    query = query.order('views', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: rawGifs, count } = await query.range(offset, offset + limit - 1)

  if (!rawGifs?.length) {
    return NextResponse.json({ gifs: [], total: 0, hasMore: false })
  }

  const seen = new Set<string>()
  const gifs = rawGifs.filter((g: any) => {
    if (seen.has(g.id)) return false
    seen.add(g.id)
    return true
  })

  const gifIds = gifs.map((g: any) => g.id)
  const { data: gifTags } = await supabase
    .from('gif_tags')
    .select('gif_id, tag_id')
    .in('gif_id', gifIds)

  let tagMap: Record<string, string[]> = {}

  if (gifTags?.length) {
    const tagIds = [...new Set(gifTags.map((gt: any) => gt.tag_id))]
    const { data: tags } = await supabase.from('tags').select('*').in('id', tagIds)
    const tagNameById: Record<string, string> = {}
    for (const t of tags ?? []) tagNameById[t.id] = t.name

    for (const gt of gifTags) {
      if (!tagMap[gt.gif_id]) tagMap[gt.gif_id] = []
      const name = tagNameById[gt.tag_id]
      if (name) tagMap[gt.gif_id].push(name)
    }
  }

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

  const items = gifs.map((g: any) => {
    let gifUrl = g.source_url ?? ''
    if (g.storage_path) {
      if (g.storage_path.startsWith('http')) gifUrl = g.storage_path
      else if (SUPABASE_URL) gifUrl = `${SUPABASE_URL}/storage/v1/object/public/gifs-bucket/${g.storage_path}`
    }
    return {
      id: g.id,
      title: g.title,
      slug: g.slug,
      url: gifUrl,
      altText: g.alt_text ?? g.title,
      views: g.views,
      likes: g.likes,
      categorySlug: g.category?.slug ?? '',
      subcategorySlug: g.subcategory?.slug ?? '',
      tags: tagMap[g.id] ?? [],
    }
  })

  const total = count ?? 0

  return NextResponse.json({
    gifs: items,
    total,
    hasMore: offset + limit < total,
  })
}
