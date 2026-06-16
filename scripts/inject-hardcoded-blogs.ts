import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const MANUAL_POSTS = [
  {
    title: "The Manager's Guide to Digital Empathy: Reading the Room When There Is No Room",
    slug: "managers-guide-to-digital-empathy",
    excerpt: "Learn how to foster genuine emotional intelligence and build psychological safety across remote teams when facial expressions and body language are absent.",
    meta_title: "Digital Empathy Guide for Remote Managers | GifHub",
    meta_description: "Learn how to foster genuine emotional intelligence and build psychological safety across remote teams when facial expressions and body language are absent.",
    reading_time: 6,
    body: `
<h2>The Empathy Deficit in Remote Work</h2>
<p>In the transition to remote and hybrid work models, a subtle but profound loss occurred: the evaporation of micro-expressions. In a physical office, a manager can instantly read the room. A slumped posture, a lingering hesitation before a meeting, or a heavy sigh all serve as vital data points for emotional intelligence. In a Slack channel or a Zoom grid, these cues are either absent or distorted.</p>

<p>This creates what we term the "Digital Empathy Deficit." When communication is reduced to pure text—stripped of tone, volume, and cadence—the risk of misinterpretation skyrockets. A hastily typed "Fine." can be read as aggressive, dismissive, or simply hurried. Without context, employees often assume the worst, leading to degraded psychological safety and ultimately, burnout.</p>

<h2>Enter Digital Empathy</h2>
<p>Digital empathy is the deliberate practice of over-communicating intent, tone, and emotional context in asynchronous communication. It requires managers to replace lost physical cues with explicit digital ones. This is where visual communication tools, specifically GIFs and emojis, transition from casual novelties to critical management utilities.</p>

<h3>1. Softening the Blow of Feedback</h3>
<p>Delivering constructive criticism via text is notoriously difficult. A message like "Please rewrite the introduction" can feel cold and demanding. By appending a high-quality, relevant GIF—perhaps one showing a supportive thumbs-up or a collaborative nod—you instantly inject warmth into the directive. It signals: <em>"We are on the same team, and this is a collaborative iteration, not a reprimand."</em></p>

<h3>2. Celebrating Micro-Wins</h3>
<p>In the office, a high-five or a quick "great job" in the hallway builds momentum. Remotely, silence is the default. Managers must actively break the silence to celebrate small victories. A well-timed celebration GIF in a team channel provides public recognition that text alone cannot replicate. It creates a shared moment of joy, anchoring the team's culture.</p>

<h3>3. Vulnerability and Humanization</h3>
<p>The most effective leaders are those who demonstrate vulnerability. When a manager makes a mistake or feels overwhelmed, admitting it through a relatable, self-deprecating GIF (like Homer Simpson backing into the bushes) humanizes them. It breaks down hierarchical barriers and gives employees permission to be human, too.</p>

<h2>Best Practices for the Modern Manager</h2>
<ul>
  <li><strong>Know Your Audience:</strong> Not every team member responds the same way to visual humor. Gauge individual preferences. Some appreciate <a href="/category/saas">SaaS culture GIFs</a>, while others prefer more traditional affirmations.</li>
  <li><strong>Context is King:</strong> Never use a GIF to obscure a difficult conversation. If the topic is serious (e.g., performance issues, layoffs), stick to clear, compassionate text or a video call.</li>
  <li><strong>Avoid the Cliché:</strong> Rely on high-quality, curated platforms like GifHub.App to find professional visuals that elevate your message rather than diminish your authority.</li>
</ul>

<h2>Conclusion</h2>
<p>Digital empathy is not about being "fun"; it is about being effective. By purposefully injecting emotional context into your digital interactions, you can bridge the physical divide, foster deep trust, and build a resilient, highly engaged remote team. Start exploring our <a href="/category/team-communication">Team Communication GIFs</a> to find the perfect visual for your next team update.</p>
    `
  },
  {
    title: "Slack Etiquette 101: When to Thread, When to DM, and When to Use a GIF",
    slug: "slack-etiquette-101-threads-dms-gifs",
    excerpt: "Mastering the unspoken rules of enterprise messaging platforms. Discover the definitive framework for professional Slack communication.",
    meta_title: "Professional Slack Etiquette Guide | GifHub",
    meta_description: "Mastering the unspoken rules of enterprise messaging platforms. Discover the definitive framework for professional Slack communication.",
    reading_time: 5,
    body: `
<h2>The Chaos of the Unregulated Workspace</h2>
<p>Enterprise messaging platforms like Slack and Microsoft Teams have revolutionized corporate communication, promising unprecedented agility. However, without established norms, this agility quickly devolves into chaos. The constant ping of notifications, fragmented conversations, and ambiguous expectations can paralyze productivity.</p>

<p>Mastering Slack etiquette is no longer optional; it is a core competency for the modern professional. This guide outlines the definitive framework for navigating the digital workspace with grace and efficiency.</p>

<h2>The Golden Rules of Threading</h2>
<p>The most common and disruptive mistake in team channels is the failure to use threads. When multiple conversations occur simultaneously in a main channel, important information is buried, and cognitive load skyrockets.</p>
<ul>
  <li><strong>Always Thread Responses:</strong> If you are replying to a specific message, <em>always</em> use the thread feature. This keeps the main channel clean and allows team members to opt-in or opt-out of specific discussions.</li>
  <li><strong>The "@" Rule:</strong> Only use <code>@channel</code> or <code>@here</code> for true emergencies. Misusing these tags is the digital equivalent of shouting in an open-plan office. Use <code>@name</code> sparingly, only when an immediate action or response is required from a specific individual.</li>
</ul>

<h2>Public Channels vs. Direct Messages (DMs)</h2>
<p>Knowing where to have a conversation is as important as the conversation itself.</p>
<h3>When to use Public Channels:</h3>
<p>Default to public channels (or private project channels) for any discussion related to work, decisions, or project updates. This promotes transparency and creates a searchable knowledge base for the company. Even if you are asking a question to a specific person, ask it in the channel so others can learn from the answer.</p>

<h3>When to use DMs:</h3>
<p>Reserve Direct Messages for sensitive information, personal feedback, HR matters, or quick logistical questions ("Are you ready for the meeting?"). If a DM conversation turns into a strategic decision, move it to a channel.</p>

<h2>The Strategic Use of Emojis and GIFs</h2>
<p>In the absence of body language, visual elements are crucial for conveying tone. However, they must be used strategically.</p>

<h3>1. The Acknowledgment Emoji</h3>
<p>The "react" feature is the unsung hero of Slack productivity. Instead of cluttering a channel with messages saying "Got it," "Thanks," or "Will do," simply react to the original message with a 👍 (thumbs up) or ✅ (check mark). This confirms receipt without generating a new notification.</p>

<h3>2. The Tone-Setting GIF</h3>
<p>While emojis are for acknowledgment, GIFs are for tone-setting. Text can easily be misconstrued as aggressive or demanding. A well-placed GIF can soften a request, celebrate a win, or express solidarity during a stressful sprint. For example, if the engineering team just deployed a massive update, a high-quality celebratory GIF from our <a href="/category/product-engineering">Product Engineering collection</a> is far more impactful than a simple "good job."</p>

<h3>3. Professional Boundaries</h3>
<p>Always maintain professional boundaries. Avoid GIFs that are overly colloquial, distracting, or potentially offensive. Utilize curated platforms like GifHub to ensure your visual communication remains polished and appropriate for an enterprise environment. Browse our <a href="/explore">Explore page</a> for safe, high-impact options.</p>

<h2>Conclusion</h2>
<p>Excellent Slack etiquette is about respecting your colleagues' time and attention. By committing to threads, defaulting to transparency, and strategically deploying visual communication, you can transform your messaging platform from a source of anxiety into an engine of productivity.</p>
    `
  }
]

async function run() {
  console.log(`Injecting ${MANUAL_POSTS.length} manual blog posts...`)

  for (const post of MANUAL_POSTS) {
    const insertData = {
      ...post,
      featured_image: null,
      status: 'published', // Publish immediately
      author: 'GifHub Editorial Team',
      is_featured: false
    }

    const { error } = await supabase.from('blog_posts').insert(insertData)
    
    if (error) {
      console.error(`Failed to insert "${post.title}":`, error.message)
    } else {
      console.log(`Successfully injected: "${post.title}"`)
    }
  }

  console.log('\nDone injecting blogs!')
}

run()
