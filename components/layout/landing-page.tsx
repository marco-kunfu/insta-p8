"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Zap, MessageCircle, Sparkles, ArrowUpRight, Github, Star,
  Send, AtSign, Brain, Inbox, Lock, Terminal,
} from "lucide-react"

const TELEGRAM_URL = "https://t.me/instagramautomationp8"
const GITHUB_URL = "https://github.com/ayuuxh2/insta-p8"

/** Telegram's own brand blue. Deliberately not a Morfeo token — it identifies
 *  someone else's product, so recolouring it would be wrong. */
const TELEGRAM_BLUE = "#2AABEE"

export function LandingPage() {
  const [stars, setStars] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("https://api.github.com/repos/ayuuxh2/insta-p8")
      .then(r => r.json())
      .then(d => { if (typeof d.stargazers_count === "number") setStars(d.stargazers_count) })
      .catch(() => {})
  }, [])

  const handleLogin = () => {
    // Instagram Business Login (Instagram API with Instagram Login). client_id must be the
    // Instagram app ID from the Instagram product page, not the parent Meta app ID.
    window.location.href = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID}&redirect_uri=${process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI}&response_type=code&scope=instagram_business_basic%2Cinstagram_business_manage_messages%2Cinstagram_business_manage_comments`
  }

  const handleTestLogin = () => {
    localStorage.setItem("ig_user_id", "9999999999")
    localStorage.setItem("ig_username", "test_creator")
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-x-hidden antialiased">
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .marquee-track { animation: marquee 30s linear infinite; }
        @keyframes fade-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-up .7s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      {/* Morfeo puts atmosphere in the upper corners instead of film grain, which
          only reads as texture on a near-black surface. */}
      <div className="morfeo-atmosphere pointer-events-none fixed inset-0 z-0" />

      {/* Nav */}
      <nav className="relative z-50 flex items-center justify-between px-5 md:px-10 h-16 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="morfeo-avatar-gradient w-7 h-7 text-white flex items-center justify-center rounded-md">
            <Zap className="w-3.5 h-3.5" strokeWidth={2.5} />
          </div>
          <span className="font-mono-ui text-sm font-bold tracking-tight">insta-p8</span>
          <span className="hidden sm:inline-block font-mono-ui text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">open source</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={GITHUB_URL} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 font-mono-ui text-xs text-muted-foreground hover:text-foreground border border-border hover:border-primary/40 rounded-full px-3.5 py-1.5 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Star</span>
            {stars !== null && <span className="text-primary font-bold">{stars}</span>}
          </a>
          {process.env.NODE_ENV === "development" && (
            <button
              onClick={handleTestLogin}
              className="font-mono-ui text-xs font-bold text-primary border border-primary/30 rounded-full px-4 py-1.5 hover:bg-primary-soft transition-colors"
            >
              Dev Login
            </button>
          )}
          <button
            onClick={handleLogin}
            className="font-mono-ui text-xs font-bold bg-secondary text-secondary-foreground border border-primary-300 rounded-full px-4 py-1.5 hover:bg-primary-200 transition-colors"
          >
            Log in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10">
        <section className="px-5 md:px-10 pt-16 md:pt-28 pb-16 max-w-6xl mx-auto">
          <div className="fade-up" style={{ animationDelay: "0ms" }}>
            <p className="font-mono-ui text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-6">
              Instagram automation // self-hosted // no monthly fees
            </p>
          </div>

          <h1 className="fade-up font-serif-display text-[15vw] md:text-[7.5rem] leading-[0.95] tracking-tight" style={{ animationDelay: "80ms" }}>
            Your DMs,
            <br />
            <span className="italic text-primary">on autopilot.</span>
          </h1>

          <div className="fade-up mt-10 flex flex-col md:flex-row md:items-end gap-8 md:gap-16" style={{ animationDelay: "160ms" }}>
            <p className="text-muted-foreground text-base md:text-lg max-w-md leading-relaxed">
              Comment-to-DM funnels, keyword triggers, story reactions, AI replies, a live inbox,
              and Reels scheduling. The open-source ManyChat alternative — your data stays in your own Supabase.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleLogin}
                className="morfeo-cta group flex items-center gap-2 font-mono-ui text-sm font-bold px-7 py-4 rounded-full shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                Connect Instagram
                <ArrowUpRight className="w-4 h-4 group-hover:rotate-45 transition-transform" />
              </button>
              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={handleTestLogin}
                  className="group flex items-center gap-2 font-mono-ui text-sm font-bold text-primary border border-primary/25 px-7 py-4 rounded-full hover:bg-primary-soft active:scale-[0.98] transition-all"
                >
                  <Terminal className="w-4 h-4" />
                  Dev Login
                </button>
              )}
              <a
                href={TELEGRAM_URL} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 font-mono-ui text-sm text-muted-foreground border border-border px-6 py-4 rounded-full transition-colors hover:text-[#2AABEE] hover:border-[#2AABEE]/60"
              >
                <Send className="w-4 h-4" />
                Telegram support
              </a>
            </div>
          </div>
        </section>

        {/* Marquee — carries Morfeo's 1px light edge on its top border */}
        <div className="morfeo-edge-light relative border-y border-border py-3 overflow-hidden">
          <div className="marquee-track flex whitespace-nowrap font-mono-ui text-xs uppercase tracking-[0.2em] text-muted-foreground gap-8 w-max">
            {Array.from({ length: 2 }).map((_, copy) => (
              <div key={copy} className="flex gap-8">
                {["comment → DM", "keyword triggers", "story reactions", "AI auto-reply", "live inbox", "ice breakers", "follow gate", "quick replies", "media attachments", "public + private replies"].map((t) => (
                  <span key={t} className="flex items-center gap-8">
                    {t} <span className="text-primary">✦</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Feature grid */}
        <section className="px-5 md:px-10 py-20 max-w-6xl mx-auto">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="font-serif-display text-4xl md:text-5xl">Everything the paid tools do.</h2>
            <span className="hidden md:block font-mono-ui text-xs text-muted-foreground">$0/month</span>
          </div>

          {/* The 1px gap shows the container through as hairlines between cards.
              2 and 4 columns both divide the 8 features evenly — 3 would leave a
              ninth cell empty, which reads as a lavender hole on a light surface. */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border rounded-xl overflow-hidden shadow-md">
            <Feature icon={<MessageCircle className="w-4 h-4" />} title="Comment → DM funnels"
              desc="Keyword or reply-all triggers on any post. Choose DM only, public reply only, or both — with your own rotating public replies." />
            <Feature icon={<Send className="w-4 h-4" />} title="DM keyword automation"
              desc="Auto-respond to DMs with text, media, or rich cards with buttons. Quick-reply chips guide people through your funnel." />
            <Feature icon={<AtSign className="w-4 h-4" />} title="Story triggers"
              desc="React to story mentions, emoji reactions, and story replies. Filter by emoji or keyword." />
            <Feature icon={<Brain className="w-4 h-4" />} title="AI auto-reply"
              desc="Feed it your account context — niche, products, tone — and let AI handle unmatched DMs like a human." />
            <Feature icon={<Inbox className="w-4 h-4" />} title="Live inbox"
              desc="Every conversation in one dashboard. Jump in manually anytime, fire quick responses from your saved automations." />
            <Feature icon={<Lock className="w-4 h-4" />} title="Follow gate"
              desc="Lock content behind a follow. Non-followers get a follow prompt; one tap later they unlock the goods." />
            <Feature icon={<Sparkles className="w-4 h-4" />} title="Human-like sending"
              desc="Optional typing indicators and randomized delays so replies land natural, not botty." />
            <Feature icon={<Terminal className="w-4 h-4" />} title="Self-hosted & hackable"
              desc="Next.js + Supabase. Deploy on free tiers. Read every line, fork it, own your data and your tokens." />
          </div>
        </section>

        {/* Community strip */}
        <section className="px-5 md:px-10 pb-24 max-w-6xl mx-auto">
          <div className="morfeo-halo border border-border-card rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 shadow-lg">
            <div>
              <h3 className="font-serif-display text-3xl md:text-4xl mb-2">Built in the open.</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Stars, sponsors, and testers keep this project alive. Questions, bugs, feature requests —
                the Telegram chat is where it all happens.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={TELEGRAM_URL} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 text-white font-mono-ui text-xs font-bold px-5 py-3 rounded-full hover:brightness-110 transition-all"
                style={{ backgroundColor: TELEGRAM_BLUE }}
              >
                <Send className="w-3.5 h-3.5" /> Join Telegram
              </a>
              <a
                href={GITHUB_URL} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 border border-border bg-card text-foreground font-mono-ui text-xs font-bold px-5 py-3 rounded-full hover:border-primary/40 transition-colors"
              >
                <Star className="w-3.5 h-3.5 text-primary" /> Star on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-5 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="font-mono-ui text-[11px] text-muted-foreground">
          insta-p8 — open-source Instagram automation. MIT licensed.
        </span>
        <div className="flex items-center gap-5 font-mono-ui text-[11px] text-muted-foreground">
          <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
          <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="hover:text-[#2AABEE] transition-colors">Telegram support</a>
        </div>
      </footer>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-card p-7 group hover:bg-primary-softer transition-colors">
      <div className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors mb-5">
        {icon}
      </div>
      <h3 className="font-mono-ui text-sm font-bold text-foreground mb-2">{title}</h3>
      <p className="text-[13px] text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  )
}
