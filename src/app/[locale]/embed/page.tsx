"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useInstagramSession } from "@/hooks/use-instagram-session"
import { Activity, Users, MessageCircle, Zap, Loader2, LayoutDashboard, ChevronRight } from "lucide-react"

interface DashboardStats {
    metrics: {
        totalAutomations: number
        activeTriggers: number
        audienceReached: number
        messagesSent: number
    }
    recentActivity: Array<{
        id: string
        content: string
        created_at: string
        recipient?: {
            recipient_username: string
        }
    }>
}

export default function DashboardPage() {
    const { username, userId, isLoading: isSessionLoading } = useInstagramSession()
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!userId) return

        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/dashboard/stats?userId=${userId}`)
                const data = await res.json()
                if (data && !data.error) {
                    setStats(data)
                }
            } catch (err) {
                console.error("Failed to load dashboard stats", err)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [userId])

    if (isSessionLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
            </div>
        )
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Page header — their pattern: icon chip, title, subtitle */}
            <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <LayoutDashboard className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                    <h1 className="font-serif-display text-2xl text-foreground">Hey, {username}.</h1>
                    <p className="text-[13px] text-muted-foreground">Here&apos;s what your automations did while you were away.</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Automations"
                    value={stats?.metrics.totalAutomations.toString() || "0"}
                    trend="Active rules"
                    icon={<Zap className="w-5 h-5 text-accent-yellow-foreground dark:text-accent-yellow" />}
                />
                <StatCard
                    title="Messages"
                    value={stats?.metrics.messagesSent.toString() || "0"}
                    trend="Sent all-time"
                    icon={<MessageCircle className="w-5 h-5 text-accent-yellow-foreground dark:text-accent-yellow" />}
                />
                <StatCard
                    title="Triggers"
                    value={stats?.metrics.activeTriggers.toString() || "0"}
                    trend="Currently live"
                    icon={<Activity className="w-5 h-5 text-accent-yellow-foreground dark:text-accent-yellow" />}
                />
                <StatCard
                    title="Audience"
                    value={stats?.metrics.audienceReached.toString() || "0"}
                    trend="Unique people"
                    icon={<Users className="w-5 h-5 text-accent-yellow-foreground dark:text-accent-yellow" />}
                />
            </div>

            {/* Two-up section — their pattern: card with an icon-chip header
                over a list of rows, value or meta right-aligned */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-[20px] border border-border-card bg-card p-5">
                    <SectionHeader
                        icon={<Activity className="h-4.5 w-4.5" />}
                        title="Recent activity"
                        subtitle="Your automation replies"
                    />
                    <div className="space-y-1">
                        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((msg) => (
                                <div key={msg.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-primary-softer">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                                        <MessageCircle className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-medium text-foreground">
                                            Auto-reply to @{msg.recipient?.recipient_username || "user"}
                                        </p>
                                        <p className="truncate text-[11px] text-muted-foreground">{msg.content}</p>
                                    </div>
                                    <span className="shrink-0 text-[11px] text-muted-foreground">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="py-8 text-center text-[13px] text-muted-foreground">No recent activity found.</p>
                        )}
                    </div>
                </div>

                <div className="rounded-[20px] border border-border-card bg-card p-5">
                    <SectionHeader
                        icon={<Zap className="h-4.5 w-4.5" />}
                        title="Quick actions"
                        subtitle="Jump straight into a task"
                    />
                    <div className="space-y-1">
                        {[
                            { icon: <Zap className="h-4 w-4" />, label: "New rule", desc: "Build an automation", href: "/embed/automations" },
                            { icon: <Users className="h-4 w-4" />, label: "View audience", desc: "See who you reached", href: "/embed/inbox" },
                        ].map((a) => (
                            <Link
                                key={a.label}
                                href={a.href}
                                className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-primary-softer"
                            >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                                    {a.icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-medium text-foreground">{a.label}</p>
                                    <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: React.ReactNode }) {
    return (
        <div className="flex items-center gap-4 rounded-[20px] border border-border-card bg-card p-5 transition-colors hover:border-primary/30">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                {icon}
            </div>
            <div className="min-w-0">
                <p className="morfeo-eyebrow text-muted-foreground">{title}</p>
                <p className="font-serif-display text-[28px] leading-tight text-foreground">{value}</p>
                <p className="text-[11px] text-muted-foreground">{trend}</p>
            </div>
        </div>
    )
}

/** Section header used inside cards: icon chip, title, subtitle, optional action. */
function SectionHeader({ icon, title, subtitle, action }: { icon: React.ReactNode, title: string, subtitle: string, action?: React.ReactNode }) {
    return (
        <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="font-serif-display text-lg text-foreground">{title}</h3>
                <p className="text-[12px] text-muted-foreground">{subtitle}</p>
            </div>
            {action}
        </div>
    )
}
