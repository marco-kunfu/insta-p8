"use client"

import { useState, useCallback, useEffect } from "react"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { AutomationList } from "@/components/dashboard/AutomationList"
import { CreateRuleForm } from "@/components/dashboard/CreateRuleForm"
import { MessageCircle, Send, Sparkles, Plus, Brain, Loader2 } from "lucide-react"
import type { Automation } from "@/lib/types"

export default function AutomationsPage() {
    const { userId, isLoading: isSessionLoading } = useInstagramSession()
    const [automations, setAutomations] = useState<Automation[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'comment' | 'dm' | 'story'>('comment')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editRule, setEditRule] = useState<Automation | null>(null)
    const [aiEnabled, setAiEnabled] = useState(false)
    const [aiLoading, setAiLoading] = useState(true)
    const [aiToggling, setAiToggling] = useState(false)
    const [showAiContext, setShowAiContext] = useState(false)
    const [aiContext, setAiContext] = useState("")
    const [aiContextSaving, setAiContextSaving] = useState(false)
    const [aiContextSaved, setAiContextSaved] = useState(false)
    const [groqApiKey, setGroqApiKey] = useState("")
    const [hasApiKey, setHasApiKey] = useState(false)
    const [showApiKey, setShowApiKey] = useState(false)
    const [aiBaseUrl, setAiBaseUrl] = useState("")
    const [aiModel, setAiModel] = useState("")

    useEffect(() => {
        if (!userId) return
        fetch(`/api/groq/auto-reply?userId=${userId}`)
            .then(res => res.json())
            .then(data => {
                setAiEnabled(data.enabled ?? false)
                setAiContext(data.ai_context ?? "")
                setHasApiKey(data.has_api_key ?? false)
                setAiBaseUrl(data.ai_base_url ?? "")
                setAiModel(data.ai_model ?? "")
            })
            .catch(() => {})
            .finally(() => setAiLoading(false))
    }, [userId])

    const handleSaveAiContext = async () => {
        if (aiContextSaving) return
        setAiContextSaving(true)
        try {
            await fetch("/api/groq/auto-reply", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    enabled: aiEnabled,
                    ai_context: aiContext,
                    ai_base_url: aiBaseUrl,
                    ai_model: aiModel,
                    ...(groqApiKey !== "" ? { groq_api_key: groqApiKey } : {}),
                }),
            })
            if (groqApiKey) { setHasApiKey(true); setGroqApiKey(""); setShowApiKey(false) }
            setAiContextSaved(true)
            setTimeout(() => setAiContextSaved(false), 2000)
        } catch {}
        setAiContextSaving(false)
    }

    const handleToggleAI = async () => {
        if (aiToggling) return
        setAiToggling(true)
        const newState = !aiEnabled
        try {
            const res = await fetch("/api/groq/auto-reply", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, enabled: newState }),
            })
            if (res.ok) setAiEnabled(newState)
        } catch {}
        setAiToggling(false)
    }

    const fetchAutomations = useCallback(async () => {
        if (!userId) return
        try {
            const res = await fetch(`/api/automations?userId=${userId}`)
            const data = await res.json()
            if (res.ok) setAutomations(Array.isArray(data) ? data : [])
        } catch (err) {
            console.error("Fetch error:", err)
        } finally {
            setIsLoading(false)
        }
    }, [userId])

    useEffect(() => {
        if (userId) fetchAutomations()
    }, [userId, fetchAutomations])

    const handleDeleteRule = async (id: string) => {
        await fetch(`/api/automations?id=${id}`, { method: "DELETE" })
        fetchAutomations()
    }

    const handleEditRule = (rule: Automation) => {
        setEditRule(rule)
        setShowCreateForm(true)
    }

    if (isSessionLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
        )
    }
    if (!userId) {
        return (
            <div className="h-screen flex items-center justify-center bg-background text-muted-foreground">
                Please log in
            </div>
        )
    }

    const filteredAutomations = automations.filter(a => a.trigger_source === activeTab)
    const counts = {
        comment: automations.filter(a => a.trigger_source === 'comment').length,
        dm: automations.filter(a => a.trigger_source === 'dm').length,
        story: automations.filter(a => a.trigger_source === 'story').length,
    }

    const tabs = [
        { key: 'comment' as const, icon: <MessageCircle className="w-4 h-4" />, label: 'Comments', count: counts.comment },
        { key: 'dm' as const, icon: <Send className="w-4 h-4" />, label: 'DMs', count: counts.dm },
        { key: 'story' as const, icon: <Sparkles className="w-4 h-4" />, label: 'Stories', count: counts.story },
    ]

    return (
        <div className="min-h-screen bg-background text-foreground">
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
                {/* Header */}
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <p className="morfeo-eyebrow text-muted-foreground mb-2">Rules engine</p>
                        <h1 className="font-serif-display text-4xl md:text-5xl text-foreground leading-none">Automations</h1>
                    </div>
                    {/* Theme toggle lives in the sidebar — keep this header clean */}
                    <div className="flex items-center gap-2">
                        {aiLoading ? (
                            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                        ) : (
                            <>
                                <button
                                                                    onClick={() => setShowAiContext(!showAiContext)}
                                                                    aria-expanded={showAiContext}
                                                                    aria-controls="ai-context-panel"
                                                                    className="w-9 h-9 flex items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                    title="AI settings"
                                                                    aria-label="AI settings"
                                                                >
                                                                    <Brain className="w-4 h-4" />
                                                                </button>
                                <button
                                    onClick={handleToggleAI}
                                    disabled={aiToggling}
                                    aria-pressed={aiEnabled}
                                    className={`flex items-center gap-2 h-9 px-4 rounded-full font-mono-ui text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                        aiEnabled
                                            ? 'bg-primary text-primary-foreground border border-primary'
                                            : 'bg-card text-muted-foreground border border-border hover:text-foreground hover:bg-accent'
                                    }`}
                                >
                                    <Sparkles className={`w-3.5 h-3.5 ${aiToggling ? 'animate-pulse' : ''}`} />
                                    {aiToggling ? '...' : aiEnabled ? 'AI ON' : 'AI OFF'}
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => {
                                if (showCreateForm) setEditRule(null)
                                setShowCreateForm(!showCreateForm)
                            }}
                            aria-expanded={showCreateForm}
                            className={`flex items-center gap-2 h-9 px-5 rounded-full font-mono-ui text-sm font-semibold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                showCreateForm
                                    ? 'bg-card text-foreground border border-border hover:bg-accent'
                                    : 'bg-primary text-primary-foreground hover:opacity-90'
                            }`}
                        >
                            <Plus className={`w-4 h-4 transition-transform duration-200 ${showCreateForm ? 'rotate-45' : ''}`} />
                            {showCreateForm ? 'Close' : 'New Rule'}
                        </button>
                    </div>
                </div>

                {/* AI Context Panel */}
                {showAiContext && (
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-5 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-primary">AI Settings</span>
                        </div>

                        {/* API Key */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs text-neutral-400 font-medium">API Key</label>
                                {hasApiKey && !showApiKey && (
                                    <span className="text-[10px] text-emerald-500 font-mono">● key saved</span>
                                )}
                            </div>
                            {showApiKey || !hasApiKey ? (
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        value={groqApiKey}
                                        onChange={e => setGroqApiKey(e.target.value)}
                                        placeholder={hasApiKey ? "Enter new key to replace…" : "sk_… or gsk_…"}
                                        className="flex-1 bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
                                    />
                                    {hasApiKey && (
                                        <button onClick={() => setShowApiKey(false)} className="px-3 py-2.5 rounded-xl border border-border text-muted-foreground text-xs hover:text-foreground transition-colors">Cancel</button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowApiKey(true)}
                                    className="w-full text-left px-4 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:border-border hover:text-foreground transition-colors"
                                >
                                    •••••••••••••••••••• <span className="text-xs ml-2 text-neutral-600">click to replace</span>
                                </button>
                            )}
                        </div>

                        {/* API Base URL */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-neutral-400 font-medium">API Base URL <span className="text-neutral-600 font-normal">(optional)</span></label>
                            <input
                                type="text"
                                value={aiBaseUrl}
                                onChange={e => setAiBaseUrl(e.target.value)}
                                placeholder="https://api.groq.com/v1  (default) or your own endpoint"
                                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
                            />
                            <p className="text-[11px] text-neutral-600">Any OpenAI-compatible endpoint works — Groq, OpenAI, Together, your own proxy.</p>
                        </div>

                        {/* Model */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-neutral-400 font-medium">Model <span className="text-neutral-600 font-normal">(optional)</span></label>
                            <input
                                type="text"
                                value={aiModel}
                                onChange={e => setAiModel(e.target.value)}
                                placeholder="llama-3.1-8b-instant  (Groq default)"
                                className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors font-mono"
                            />
                        </div>

                        {/* AI Personality Context */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-neutral-400 font-medium">AI Personality Context</label>
                            <p className="text-[11px] text-neutral-600">Tell AI about your account — niche, products, tone, what to say/avoid.</p>
                            <textarea
                                value={aiContext}
                                onChange={e => setAiContext(e.target.value)}
                                placeholder={`e.g. This is a fitness coaching account. I sell online training programs (₹2999/mo). My tone is motivating but chill. If someone asks about pricing, tell them to DM for a free consultation. Never promise specific results.`}
                                rows={4}
                                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-colors"
                            />
                        </div>

                        <button
                            onClick={handleSaveAiContext}
                            disabled={aiContextSaving}
                            className="px-4 py-2 rounded-xl bg-primary hover:brightness-95 text-white text-xs font-bold transition-all disabled:opacity-50"
                        >
                            {aiContextSaving ? 'Saving...' : aiContextSaved ? 'Saved ✓' : 'Save'}
                        </button>
                    </div>
                )}

                {/* Tabs — Morfeo segmented control: pill container, violet gradient on
                    the selected item. The previous row was the fork's editorial
                    underline, and its -mb-px against overflow-x-auto overflowed the
                    container by 1px vertically; since one axis set to auto forces the
                    other, that rendered a stray vertical scrollbar. */}
                <div className="max-w-full overflow-x-auto">
                    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-muted p-1">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.key
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    aria-pressed={isActive}
                                    className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                        isActive
                                            ? 'bg-gradient-to-br from-primary to-primary-active text-white shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    {tab.icon}
                                    <span>{tab.label}</span>
                                    {tab.count > 0 && (
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                            isActive
                                                ? 'bg-white/25 text-white'
                                                : 'bg-background text-muted-foreground'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Create Form (Collapsible) */}
                {showCreateForm && (
                    <div className="rounded-2xl border border-border bg-card p-6 md:p-8 animate-in fade-in slide-in-from-top-2 duration-300">
                        <CreateRuleForm
                            userId={userId}
                            triggerSource={editRule ? editRule.trigger_source : activeTab}
                            editRule={editRule}
                            onSuccess={() => {
                                fetchAutomations()
                                setShowCreateForm(false)
                                setEditRule(null)
                            }}
                        />
                    </div>
                )}


                {/* Automation List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
                    </div>
                ) : (
                    <AutomationList
                        automations={filteredAutomations}
                        onDelete={handleDeleteRule}
                        onEdit={handleEditRule}
                        onChanged={fetchAutomations}
                        userId={userId}
                    />
                )}
            </div>
        </div>
    )
}