'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { GifCard } from '@/components/gif-card'
import { GifGridSkeleton } from '@/components/gif-skeleton'
import { cn } from '@/lib/utils'
import type { GifItem } from '@/lib/types'

type TimeRange = 'all' | 'trending' | 'popular'

const TIME_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: 'trending', label: 'Trending Now' },
  { value: 'popular', label: 'Most Viewed' },
  { value: 'all', label: 'Latest' },
]

export function TrendingGrid() {
  const [range, setRange] = useState<TimeRange>('trending')
  const [gifs, setGifs] = useState<GifItem[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const initialLoad = useRef(true)

  const fetchGifs = useCallback(async (pageNum: number, append: boolean) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pageNum), limit: '16', sort: range })

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
  }, [range])

  useEffect(() => {
    setGifs([])
    setPage(1)
    setHasMore(true)
    fetchGifs(1, false)
  }, [range])

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
      <div className="mb-6 flex flex-wrap gap-2">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRange(opt.value)}
            className={cn(
              'rounded-full px-4 py-2 text-sm font-medium transition-all',
              range === opt.value
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'border border-border text-muted-foreground hover:border-primary/30 hover:text-primary'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

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
          You&apos;ve seen all trending GIFs
        </p>
      )}
    </div>
  )
}
