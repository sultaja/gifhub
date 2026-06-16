export interface DbCategory {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface DbSubcategory {
  id: string
  name: string
  slug: string
  category_id: string
  created_at: string
}

export interface DbGif {
  id: string
  title: string
  slug: string
  source_url: string | null
  storage_path: string | null
  alt_text: string | null
  views: number
  likes: number
  category_id: string | null
  subcategory_id: string | null
  usage_scenario: string | null
  professionalism_score: number | null
  suggested_caption: string | null
  created_at: string
}

export interface DbTag {
  id: string
  name: string
  slug: string
}

export interface DbGifTag {
  gif_id: string
  tag_id: string
}

export interface CategoryWithSubs extends DbCategory {
  subcategories: DbSubcategory[]
}

export interface GifWithRelations extends DbGif {
  category: DbCategory | null
  subcategory: DbSubcategory | null
  tags: DbTag[]
}

export interface GifItem {
  id: string
  title: string
  slug: string
  url: string
  altText: string
  views: number
  likes: number
  categorySlug: string
  subcategorySlug: string
  usageScenario?: string | null
  professionalismScore?: number | null
  suggestedCaption?: string | null
  tags: string[]
}
