'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Loader2, SlidersHorizontal } from 'lucide-react'
import { GifCard } from '@/components/gif-card'
import { GifGridSkeleton } from '@/components/gif-skeleton'
import { cn } from '@/lib/utils'
import type { GifItem } from '@/lib/types'

type SortOption = 'latest' | 'trending' | 'popular'

interface CategoryOption {
  id: string
  name: string
  slug: string
}

interface ExploreGridProps {
  categories: CategoryOption[]
  totalCount: number
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'trending', label: 'Trending' },
  { value: 'popular', label: 'Most Viewed' },
]

export function ExploreGrid({ categories, totalCount }: ExploreGridProps) {
  const [sort, setSort] = useState<SortOption>('latest')
  const [categoryId, setCategoryId] = useState<string>('')
  const [gifs, setGifs] = useState<GifItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const initialLoad = useRef(true)

  const fetchGifs = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pageNum), limit: '16', sort })
    if (categoryId) params.set('category_id', categoryId)

    try {
      const res = await fetch(`/api/gifs?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (append) {
          setGifs((prev) => {
            const existingIds = new Set(prev.map((g) => g.id))
            const newGifs = (data.gifs as GifItem[]).filter((g) => !existingIds.has(g.id))
            return [...prev, ...newGifs]
          })
        } else {
          setGifs(data.gifs)
        }
        setHasMore(data.hasMore)
        setPage(pageNum)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [sort, categoryId])

  useEffect(() => {
    fetchGifs(1, false)
  }, [sort, categoryId])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || initialLoad.current) {
      initialLoad.current = false
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchGifs(page + 1, true)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, page, fetchGifs])

  return (
    <div>
      {/* Filters bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <SlidersHorizontal size={14} />
          <span className="font-medium">Filter:</span>
        </div>

        {/* Sort pills */}
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSort(opt.value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                sort === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryId('')}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
              !categoryId
                ? 'bg-foreground text-background'
                : 'border border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                categoryId === cat.id
                  ? 'bg-foreground text-background'
                  : 'border border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {gifs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {gifs.map((gif, i) => (
            <GifCard key={gif.id} gif={gif} index={i} />
          ))}
        </div>
      )}

      {loading && gifs.length === 0 && <GifGridSkeleton count={8} />}

      {loading && gifs.length > 0 && (
        <div className="mt-8 flex justify-center">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      )}

      {hasMore && !loading && <div ref={sentinelRef} className="h-1" />}

      {!hasMore && gifs.length > 0 && (
        <p className="mt-10 text-center text-xs text-muted-foreground">
          You&apos;ve explored all GIFs
        </p>
      )}

      {!loading && gifs.length === 0 && (
        <div className="flex flex-col items-center py-20">
          <p className="text-lg font-semibold">No GIFs found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters</p>
        </div>
      )}
    </div>
  )
}
