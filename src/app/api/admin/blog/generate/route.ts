import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/admin-auth'
import { GoogleGenAI } from '@google/genai'
import { supabaseAdmin } from '@/lib/supabase/admin'

const TEXT_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash']
const IMAGE_MODEL = 'imagen-3.0-generate-002'
const MAX_RETRIES = 2
const BASE_DELAY = 2000

function getAI(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY is not set')
  return new GoogleGenAI({ apiKey: key })
}

async function generateTextWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  addLog: (msg: string) => void
): Promise<string> {
  let lastError: Error | null = null

  for (const model of TEXT_MODELS) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        addLog(`Trying ${model} (attempt ${attempt + 1}/${MAX_RETRIES})...`)
        const response = await ai.models.generateContent({ model, contents: prompt })
        addLog(`${model} responded successfully`)
        return response.text ?? ''
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err))
        const status = err?.status ?? err?.response?.status ?? err?.error?.code ?? 0
        const isRetryable = status === 503 || status === 429 || status === 500

        if (!isRetryable) throw lastError

        const delay = BASE_DELAY * Math.pow(2, attempt) + Math.random() * 1000
        addLog(`${model} returned ${status}, retrying in ${Math.round(delay / 1000)}s...`)
        await new Promise((r) => setTimeout(r, delay))
      }
    }
    addLog(`${model} exhausted retries, trying next model...`)
  }

  throw lastError || new Error('All text models failed')
}

export async function POST(request: NextRequest) {
  const denied = adminAuth(request)
  if (denied) return denied

  const body = await request.json()
  const {
    topic,
    tone = 'professional',
    length = 'medium',
    category_ids = [],
    tag_ids = [],
    generate_image = true,
  } = body

  if (!topic?.trim()) {
    return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
  }

  const log: string[] = []
  const addLog = (msg: string) => { console.log(`[BlogAI] ${msg}`); log.push(msg) }

  try {
    const ai = getAI()

    // Fetch category/tag names for context
    let categoryNames: string[] = []
    let tagNames: string[] = []

    if (category_ids.length) {
      const { data } = await supabaseAdmin.from('blog_categories').select('name').in('id', category_ids)
      categoryNames = (data ?? []).map((c) => c.name)
    }
    if (tag_ids.length) {
      const { data } = await supabaseAdmin.from('blog_tags').select('name').in('id', tag_ids)
      tagNames = (data ?? []).map((t) => t.name)
    }

    // Step 1: Generate blog post with Gemini 2.5 Pro
    addLog(`Generating blog post with Gemini 2.5 Pro (with fallback)...`)

    const wordTarget = length === 'short' ? '600-800' : length === 'long' ? '1500-2000' : '1000-1300'

    const prompt = `You are a Senior Editor at Harvard Business Review and an expert in digital workplace culture. You are writing for GifHub.App, a professional GIF platform for business communication. Write a deep, insightful, and highly actionable SEO-optimized blog post.

TOPIC: ${topic}
TONE: ${tone} (Maintain a highly professional, expert, yet engaging voice)
TARGET LENGTH: ${wordTarget} words

REQUIREMENTS:
1. Write in HTML format (no markdown).
2. Use <h2> and <h3> tags for headings (DO NOT use <h1> — it's handled by the page).
3. Add id attributes to all h2/h3 tags for anchor linking (lowercase, hyphenated).
4. Use <p>, <ul>, <li>, <ol>, <strong>, <em>, <a>, and <blockquote> tags appropriately.
5. Content Depth: Do not write generic advice. Provide psychological insights, real-world corporate scenarios, and actionable frameworks. 
6. Include 3-5 internal links to GifHub pages using these paths:
   - /explore — Browse all GIFs
   - /trending — Trending GIFs
   - /category/marketing — Marketing GIFs
   - /category/saas — SaaS GIFs
   - /category/fintech — Fintech GIFs
   - /category/ecommerce — eCommerce GIFs
   - /category/human-resources — HR GIFs
   - /category/product-engineering — Engineering GIFs
   - /category/team-communication — Team Communication GIFs
7. Structure:
   - Introduction (Hook the reader, state the problem)
   - The Psychology / Strategy (Deep dive into the topic)
   - Practical Application (How to apply this in Slack/Teams/Email)
   - Common Mistakes to Avoid
   - Conclusion & Call-to-Action (Link to relevant GifHub pages)

SEO REQUIREMENTS:
- Primary keyword should appear naturally in the first paragraph and 3-5 more times.
- Use semantic variations and LSI keywords throughout.
- Write for featured snippets — use clear question-answer patterns where appropriate.
- Include a compelling hook in the first paragraph.

Respond in this exact JSON format:
{
  "title": "SEO-optimized title (50-60 chars ideal)",
  "slug": "url-friendly-slug",
  "excerpt": "Compelling meta description (140-155 chars)",
  "body": "<h2>...</h2><p>...</p>...",
  "meta_title": "SEO title for search engines (50-60 chars)",
  "meta_description": "Meta description for search engines (140-155 chars)",
  "reading_time": 5,
  "suggested_image_prompt": "A detailed prompt for generating a featured image for this blog post. The image should be professional, modern, and suitable as a blog header. Describe the style, colors, and composition."
}

Return ONLY valid JSON, no other text.`

    const rawText = await generateTextWithFallback(ai, prompt, addLog)
    addLog(`Text generated (${rawText.length} chars)`)

    // Parse JSON from response
    let postData: any
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON found in response')
      postData = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      addLog(`Failed to parse Gemini response: ${parseErr}`)
      return NextResponse.json({
        success: false,
        error: 'Failed to parse AI response. Try again.',
        raw: rawText.substring(0, 500),
        log,
      }, { status: 500 })
    }

    addLog(`Post: "${postData.title}" (${postData.reading_time} min read)`)

    // Step 2: Generate featured image
    let featuredImageUrl: string | null = null

    if (generate_image && postData.suggested_image_prompt) {
      addLog(`Generating featured image with ${IMAGE_MODEL}...`)
      try {
        const imageResponse = await ai.models.generateImages({
          model: IMAGE_MODEL,
          prompt: postData.suggested_image_prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: '16:9',
          },
        })

        const generatedImage = imageResponse.generatedImages?.[0]
        if (generatedImage?.image?.imageBytes) {
          addLog('Image generated, uploading to Supabase...')

          const buffer = Buffer.from(generatedImage.image.imageBytes, 'base64')
          const filename = `blog-ai-${Date.now()}-${postData.slug.substring(0, 30)}.png`

          const { error: uploadError } = await supabaseAdmin.storage
            .from('blog-images')
            .upload(filename, buffer, {
              contentType: 'image/png',
              upsert: false,
            })

          if (uploadError) {
            addLog(`Image upload failed: ${uploadError.message}`)
          } else {
            const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
            featuredImageUrl = `${SUPABASE_URL}/storage/v1/object/public/blog-images/${filename}`
            addLog(`Image uploaded: ${filename}`)
          }
        } else {
          addLog('No image bytes in response')
        }
      } catch (imgErr: any) {
        addLog(`Image generation failed: ${imgErr?.message ?? imgErr}`)
      }
    }

    // Step 3: Create the blog post in database
    addLog('Saving to database...')

    const insertData: any = {
      title: postData.title,
      slug: postData.slug,
      excerpt: postData.excerpt ?? null,
      body: postData.body,
      featured_image: featuredImageUrl,
      status: 'draft',
      author: 'GifHub Team',
      reading_time: postData.reading_time ?? 5,
      meta_title: postData.meta_title ?? null,
      meta_description: postData.meta_description ?? null,
      og_image: featuredImageUrl,
      is_featured: false,
    }

    const { data: post, error: insertError } = await supabaseAdmin
      .from('blog_posts')
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      addLog(`DB insert failed: ${insertError.message}`)
      return NextResponse.json({
        success: false,
        error: insertError.message,
        generated: { ...postData, featured_image: featuredImageUrl },
        log,
      }, { status: 500 })
    }

    // Link categories and tags
    if (category_ids.length) {
      await supabaseAdmin.from('blog_post_categories').insert(
        category_ids.map((cid: string) => ({ post_id: post.id, category_id: cid }))
      )
    }
    if (tag_ids.length) {
      await supabaseAdmin.from('blog_post_tags').insert(
        tag_ids.map((tid: string) => ({ post_id: post.id, tag_id: tid }))
      )
    }

    addLog(`Post saved as draft: ${post.id}`)
    addLog('Done!')

    return NextResponse.json({
      success: true,
      post: {
        id: post.id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        featured_image: featuredImageUrl,
      },
      log,
    })
  } catch (err: any) {
    addLog(`Fatal error: ${err?.message ?? err}`)
    return NextResponse.json({
      success: false,
      error: err?.message ?? 'Blog generation failed',
      log,
    }, { status: 500 })
  }
}
