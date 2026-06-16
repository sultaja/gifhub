'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Download, Eye, Heart, Check, Share2 } from 'lucide-react'
import Image from 'next/image'
import type { GifItem } from '@/lib/types'
import { Link } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { copyToClipboard } from '@/lib/clipboard'
import { useToast } from '@/components/ui/toast'

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export function GifCard({ gif, index = 0 }: { gif: GifItem; index?: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/gif/${gif.slug}`
    const ok = await copyToClipboard(url)
    if (ok) {
      setCopied(true)
      toast('Link copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 1500)
    }
  }, [gif.slug, toast])

  const handleDownload = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const a = document.createElement('a')
    a.href = gif.url
    a.download = `${gif.slug}.gif`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast('Download started', 'success')
  }, [gif.url, gif.slug, toast])

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/gif/${gif.slug}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: gif.title, url })
        return
      } catch { /* cancelled */ }
    }
    const ok = await copyToClipboard(url)
    if (ok) {
      setCopied(true)
      toast('Link copied to clipboard', 'success')
      setTimeout(() => setCopied(false), 1500)
    }
  }, [gif.slug, gif.title, toast])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.3), ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-2xl bg-card transition-all duration-300 hover:shadow-xl dark:hover:glow-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/gif/${gif.slug}`} className="block">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          <Image
            src={gif.url}
            alt={gif.altText}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            unoptimized
          />

          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
              >
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <div className="flex items-center gap-3 text-xs text-white/80">
                    <span className="flex items-center gap-1">
                      <Eye size={11} /> {formatCount(gif.views)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart size={11} /> {formatCount(gif.likes)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <ActionBtn onClick={handleShare} label="Share">
                      <Share2 size={12} />
                    </ActionBtn>
                    <ActionBtn onClick={handleCopy} label="Copy link">
                      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    </ActionBtn>
                    <ActionBtn onClick={handleDownload} label="Download">
                      <Download size={12} />
                    </ActionBtn>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>

      <div className="px-3.5 py-3">
        <Link href={`/gif/${gif.slug}`}>
          <h3 className="truncate text-[13px] font-medium text-card-foreground transition-colors group-hover:text-primary">
            {gif.title}
          </h3>
        </Link>
        {gif.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {gif.tags.slice(0, 2).map((tag) => (
              <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`}>
                <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-primary dark:bg-muted/60">
                  #{tag}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ActionBtn({ onClick, label, children }: {
  onClick: (e: React.MouseEvent) => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex h-7 w-7 items-center justify-center rounded-lg text-white/90 transition-all',
        'bg-white/15 backdrop-blur-md hover:bg-white/30 active:scale-90'
      )}
      aria-label={label}
    >
      {children}
    </button>
  )
}
