import React, { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Calendar,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    ListTodo,
    PlayCircle,
    Search,
    Trash2,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import {
    format,
    formatDistanceToNow,
    startOfMonth,
    endOfMonth,
    subMonths,
} from 'date-fns';

/** Design tokens — Activity Log page only */
const T = {
    bgBase: '#060b14',
    bgCard: '#0d1421',
    bgSurface: '#101b2e',
    border: '#1c2a3f',
    blue: '#1a8fd1',
    green: '#22c55e',
    orange: '#fb923c',
    red: '#ef4444',
    text1: '#f0f6ff',
    text2: '#8da2b8',
    text3: '#3a5a78',
    purple: '#a855f7',
    pink: '#ec4899',
} as const;

const FONT_LINK_ID = 'activity-log-dm-fonts';

interface ActivityLog {
    _id: string;
    startTime: string;
    endTime: string;
    duration?: number;
    date: string;
    eventType?: string;
    title?: string | null;
    source?: string | null;
    actorName?: string | null;
}

interface ActivityLogViewProps {
    activityLogs: ActivityLog[];
    elapsedTime: string;
    handleClearLogs: () => void;
    handleDeleteLog: (id: string) => void;
    tasks?: any[];
    users?: any[];
    teamSessions?: any[];
    currentTeamId?: string;
    ownedTeams?: any[];
    currentUserId?: string;
}

function normStatus(s: unknown): string {
    return String(s ?? '')
        .trim()
        .toLowerCase();
}

function isCompletedTask(t: any): boolean {
    const s = normStatus(t?.status);
    return s.includes('complete') || s === 'done';
}

function isInProgressTask(t: any): boolean {
    const s = normStatus(t?.status);
    return s.includes('progress') || s === 'active';
}

function isOverdueTask(t: any): boolean {
    if (isCompletedTask(t)) {
        return false;
    }
    const d = t?.dueDate || t?.deadline;
    if (!d) {
        return false;
    }
    return new Date(d).getTime() < Date.now();
}

function secondsForLogsInRange(logs: ActivityLog[], rangeStart: Date, rangeEnd: Date): number {
    let total = 0;
    logs.forEach((log) => {
        const st = new Date(log.startTime).getTime();
        if (st >= rangeStart.getTime() && st <= rangeEnd.getTime()) {
            const end = new Date(log.endTime);
            const start = new Date(log.startTime);
            total += log.duration ?? Math.round((end.getTime() - start.getTime()) / 1000);
        }
    });
    return total;
}

type FeedTag = 'Commit' | 'Completed' | 'Invite' | 'Deadline' | 'Comment' | 'Session';

interface FeedItem {
    id: string;
    sortTime: number;
    actor: string;
    entity: string;
    timeLabel: string;
    source: string;
    tag: FeedTag;
    iconBg: string;
    onDelete?: () => void;
}

const tagStyles: Record<FeedTag, { bg: string; text: string }> = {
    Commit: { bg: 'rgba(26,143,209,0.2)', text: T.blue },
    Completed: { bg: 'rgba(34,197,94,0.2)', text: T.green },
    Invite: { bg: 'rgba(168,85,247,0.2)', text: T.purple },
    Deadline: { bg: 'rgba(251,146,60,0.2)', text: T.orange },
    Comment: { bg: 'rgba(236,72,153,0.2)', text: T.pink },
    Session: { bg: 'rgba(26,143,209,0.15)', text: T.blue },
};

export default function ActivityLogView({
    activityLogs,
    elapsedTime,
    handleClearLogs,
    handleDeleteLog,
    tasks = [],
}: ActivityLogViewProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [showAllLogs, setShowAllLogs] = useState(false);
    const [projectAnalyticsThisMonth, setProjectAnalyticsThisMonth] = useState(false);

    const doughnutCanvasRef = useRef<HTMLCanvasElement>(null);
    const barCanvasRef = useRef<HTMLCanvasElement>(null);
    const doughnutChartRef = useRef<Chart | null>(null);
    const barChartRef = useRef<Chart | null>(null);

    useEffect(() => {
        if (document.getElementById(FONT_LINK_ID)) {
            return;
        }
        const link = document.createElement('link');
        link.id = FONT_LINK_ID;
        link.rel = 'stylesheet';
        link.href =
            'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=DM+Mono:wght@400;500;600&display=swap';
        document.head.appendChild(link);
    }, []);

    const taskList = tasks ?? [];

    const taskStats = useMemo(() => {
        const total = taskList.length;
        const inProgress = taskList.filter(isInProgressTask).length;
        const completed = taskList.filter(isCompletedTask).length;
        const overdue = taskList.filter(isOverdueTask).length;
        return { total, inProgress, completed, overdue };
    }, [taskList]);

    const totalTasksDelta = useMemo(() => {
        const w = 7 * 24 * 60 * 60 * 1000;
        const t = Date.now();
        let thisWeek = 0;
        let prevWeek = 0;
        taskList.forEach((task) => {
            const c = task?.createdAt ? new Date(task.createdAt).getTime() : 0;
            if (!c) {
                return;
            }
            if (c >= t - w) {
                thisWeek++;
            } else if (c >= t - 2 * w && c < t - w) {
                prevWeek++;
            }
        });
        return thisWeek - prevWeek;
    }, [taskList]);

    const myProgressSegments = useMemo(() => {
        const valuesRaw = [
            taskStats.total,
            taskStats.inProgress,
            taskStats.completed,
            taskStats.overdue,
        ];
        const hasData = valuesRaw.some((v) => v > 0);
        return {
            values: hasData ? valuesRaw : [1, 0, 0, 0],
            displayValues: valuesRaw,
            labels: ['Total Tasks', 'In Progress', 'Completed', 'Overdue'],
            centerValue: taskStats.total,
        };
    }, [taskStats]);

    const sixMonthBars = useMemo(() => {
        const end = new Date();
        const rows: { key: string; label: string; minutes: number; active: boolean }[] = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = subMonths(startOfMonth(end), i);
            const ms = startOfMonth(monthDate);
            const me = endOfMonth(monthDate);
            const secs = secondsForLogsInRange(activityLogs, ms, me);
            const active = format(ms, 'yyyy-MM') === format(end, 'yyyy-MM');
            rows.push({
                key: format(ms, 'yyyy-MM'),
                label: format(ms, 'MMM'),
                minutes: Math.round(secs / 60),
                active,
            });
        }
        return rows;
    }, [activityLogs]);

    const thisMonthBar = useMemo(() => {
        const ms = startOfMonth(new Date());
        const me = endOfMonth(new Date());
        const secs = secondsForLogsInRange(activityLogs, ms, me);
        return {
            label: format(ms, 'MMMM yyyy'),
            minutes: Math.round(secs / 60),
        };
    }, [activityLogs]);

    const feedItems: FeedItem[] = useMemo(() => {
        const out: FeedItem[] = [];

        activityLogs.forEach((log, logIndex) => {
            const start = new Date(log.startTime);
            const end = new Date(log.endTime);
            const dur = log.duration ?? Math.round((end.getTime() - start.getTime()) / 1000);

            if (log.eventType === 'task-assigned') {
                out.push({
                    id: `task-assigned-${log._id ?? logIndex}`,
                    sortTime: start.getTime(),
                    actor: log.actorName || 'Workspace',
                    entity: log.title || 'New task assigned',
                    timeLabel: formatDistanceToNow(start, { addSuffix: true }),
                    source: log.source || 'Tasks',
                    tag: 'Invite',
                    iconBg: T.bgSurface,
                    onDelete: () => handleDeleteLog(log._id),
                });
                return;
            }

            if (log.eventType === 'task-progressed') {
                out.push({
                    id: `task-progressed-${log._id ?? logIndex}`,
                    sortTime: start.getTime(),
                    actor: log.actorName || 'Workspace',
                    entity: log.title || 'Task moved to in progress',
                    timeLabel: formatDistanceToNow(start, { addSuffix: true }),
                    source: log.source || 'Tasks',
                    tag: 'Comment',
                    iconBg: T.bgSurface,
                    onDelete: () => handleDeleteLog(log._id),
                });
                return;
            }

            out.push({
                id: `log-${log._id ?? logIndex}`,
                sortTime: start.getTime(),
                actor: 'You',
                entity: `Session · ${Math.max(1, Math.round(dur / 60))} min`,
                timeLabel: formatDistanceToNow(start, { addSuffix: true }),
                source: 'Activity',
                tag: 'Session',
                iconBg: T.bgSurface,
                onDelete: () => handleDeleteLog(log._id),
            });
        });

        taskList.forEach((t) => {
            const ci = (t as any).commitInfo;
            if (ci?.message) {
                const ts = ci.timestamp ? new Date(ci.timestamp).getTime() : Date.now();
                out.push({
                    id: `commit-${t._id || t.id}`,
                    sortTime: ts,
                    actor: ci.author || 'Git',
                    entity: String(ci.message).slice(0, 80),
                    timeLabel: formatDistanceToNow(ts, { addSuffix: true }),
                    source: t.projectName || 'Project',
                    tag: 'Commit',
                    iconBg: T.bgSurface,
                });
            }
            if (isCompletedTask(t)) {
                const ts = t.updatedAt
                    ? new Date(t.updatedAt).getTime()
                    : t.createdAt
                      ? new Date(t.createdAt).getTime()
                      : Date.now();
                out.push({
                    id: `task-done-${t._id || t.id}`,
                    sortTime: ts,
                    actor: t.assignedToName || 'You',
                    entity: `Completed “${t.title || 'Task'}”`,
                    timeLabel: formatDistanceToNow(ts, { addSuffix: true }),
                    source: t.projectName || 'Tasks',
                    tag: 'Completed',
                    iconBg: T.bgSurface,
                });
            }
            const due = (t as any).dueDate || (t as any).deadline;
            if (due && !isCompletedTask(t)) {
                const d = new Date(due);
                out.push({
                    id: `due-${t._id || t.id}`,
                    sortTime: d.getTime(),
                    actor: 'Deadline',
                    entity: t.title || 'Task',
                    timeLabel: formatDistanceToNow(d, { addSuffix: true }),
                    source: t.projectName || 'Tasks',
                    tag: 'Deadline',
                    iconBg: T.bgSurface,
                });
            }
        });

        out.sort((a, b) => b.sortTime - a.sortTime);
        return out;
    }, [activityLogs, taskList, handleDeleteLog]);

    const filteredFeed = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) {
            return feedItems;
        }
        return feedItems.filter(
            (f) =>
                f.entity.toLowerCase().includes(q) ||
                f.actor.toLowerCase().includes(q) ||
                f.source.toLowerCase().includes(q)
        );
    }, [feedItems, searchQuery]);

    const displayedFeed = showAllLogs ? filteredFeed : filteredFeed.slice(0, 8);

    useEffect(() => {
        if (!doughnutCanvasRef.current) {
            return;
        }
        doughnutChartRef.current?.destroy();
        doughnutChartRef.current = new Chart(doughnutCanvasRef.current, {
            type: 'doughnut',
            data: {
                labels: myProgressSegments.labels,
                datasets: [
                    {
                        data: myProgressSegments.values,
                        backgroundColor: [T.blue, T.orange, T.bgSurface],
                        borderWidth: 0,
                        hoverOffset: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (ctx: any) => {
                                const v = Number(ctx.raw) || 0;
                                return `${ctx.label}: ${v}`;
                            },
                        },
                    },
                },
                animation: {
                        backgroundColor: [T.blue, '#f59e0b', T.green, T.red],
                    easing: 'easeInOutQuart' as const,
                },
            },
        });
        return () => {
            doughnutChartRef.current?.destroy();
            doughnutChartRef.current = null;
        };
    }, [myProgressSegments]);

    useEffect(() => {
        if (!barCanvasRef.current) {
            return;
        }
        barChartRef.current?.destroy();

        const labels = projectAnalyticsThisMonth
            ? [thisMonthBar.label]
            : sixMonthBars.map((b) => b.label);
        const data = projectAnalyticsThisMonth ? [thisMonthBar.minutes] : sixMonthBars.map((b) => b.minutes);
        const colors = projectAnalyticsThisMonth
            ? [T.blue]
            : sixMonthBars.map((b) => (b.active ? T.blue : T.border));

        barChartRef.current = new Chart(barCanvasRef.current, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor: colors,
                        borderRadius: 8,
                        borderSkipped: false,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false, color: T.border },
                        ticks: { color: T.text2, font: { family: 'DM Sans', size: 11 } },
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(28,42,63,0.6)' },
                        ticks: {
                            color: T.text3,
                            font: { family: 'DM Mono', size: 10 },
                            callback: (v: any) => `${v}m`,
                        },
                    },
                },
                plugins: {
                    legend: { display: false },
                },
                animation: {
                    duration: 900,
                    easing: 'easeInOutQuart' as const,
                },
            },
        });
        return () => {
            barChartRef.current?.destroy();
            barChartRef.current = null;
        };
    }, [projectAnalyticsThisMonth, sixMonthBars, thisMonthBar]);

    const dateSubtitle = format(new Date(), 'EEEE, MMMM d, yyyy');

    const statCards = [
        {
            key: 'total',
            title: 'Total Tasks',
            value: taskStats.total,
            delta: totalTasksDelta,
            sub: 'From last week',
            icon: ListTodo,
        },
        {
            key: 'progress',
            title: 'In Progress',
            value: taskStats.inProgress,
            delta: null as number | null,
            sub: 'Active tasks',
            icon: PlayCircle,
        },
        {
            key: 'done',
            title: 'Completed',
            value: taskStats.completed,
            delta: null as number | null,
            sub: 'Finished',
            icon: CheckSquare,
        },
        {
            key: 'overdue',
            title: 'Overdue',
            value: taskStats.overdue,
            delta: null as number | null,
            sub: 'Needs attention',
            icon: Calendar,
        },
    ];

    return (
        <div
            className="min-h-full overflow-y-auto overflow-x-hidden"
            style={{
                background: T.bgBase,
                fontFamily: '"DM Sans", system-ui, sans-serif',
                color: T.text1,
            }}
        >
            <style>{`
        @keyframes al-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .al-fade-up { animation: al-fade-up 0.5s ease forwards; opacity: 0; }
      `}</style>

            <div className="mx-auto max-w-[1400px] px-5 py-6 space-y-6">
                {/* Topbar */}
                <header
                    className="al-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{ animationDelay: '0s' }}
                >
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: T.text1 }}>
                            Activity Log
                        </h1>
                        <p className="mt-1 font-mono text-xs" style={{ color: T.text3 }}>
                            {dateSubtitle}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                            <Search
                                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                                style={{ color: T.text3 }}
                            />
                            <Input
                                placeholder="Search activity…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-10 rounded-[8px] pl-9 font-sans"
                                style={{
                                    background: T.bgSurface,
                                    borderColor: T.border,
                                    color: T.text1,
                                }}
                            />
                        </div>
                    </div>
                </header>

                {/* Stat cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {statCards.map((c, i) => (
                        <div
                            key={c.key}
                            className="al-fade-up rounded-[12px] border p-5 transition-colors"
                            style={{
                                animationDelay: `${0.05 + i * 0.05}s`,
                                background: T.bgCard,
                                borderColor: T.border,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(26,143,209,0.35)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = T.border;
                            }}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div
                                    className="flex h-10 w-10 items-center justify-center rounded-[8px]"
                                    style={{ background: T.bgSurface }}
                                >
                                    <c.icon className="h-5 w-5" style={{ color: T.blue }} />
                                </div>
                                {c.delta != null && (
                                    <span
                                        className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 font-mono text-[11px] font-medium"
                                        style={{
                                            background:
                                                c.delta > 0
                                                    ? 'rgba(34,197,94,0.15)'
                                                    : c.delta < 0
                                                      ? 'rgba(239,68,68,0.15)'
                                                      : 'rgba(58,90,120,0.2)',
                                            color:
                                                c.delta > 0 ? T.green : c.delta < 0 ? T.red : T.text3,
                                        }}
                                    >
                                        {c.delta > 0 ? (
                                            <TrendingUp className="h-3 w-3" />
                                        ) : c.delta < 0 ? (
                                            <TrendingDown className="h-3 w-3" />
                                        ) : null}
                                        {c.delta === 0 ? '—' : `${c.delta > 0 ? '+' : ''}${c.delta}`}
                                    </span>
                                )}
                            </div>
                            <p className="mt-4 font-mono text-[11px] uppercase tracking-wider" style={{ color: T.text3 }}>
                                {c.title}
                            </p>
                            <p className="mt-1 text-3xl font-semibold tabular-nums" style={{ color: T.text1 }}>
                                {c.value}
                            </p>
                            <p className="mt-1 text-xs" style={{ color: T.text2 }}>
                                {c.sub}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Charts row */}
                <div
                    className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]"
                    style={{ alignItems: 'stretch' }}
                >
                    <div
                        className="al-fade-up rounded-[12px] border p-5"
                        style={{ animationDelay: '0.4s', background: T.bgCard, borderColor: T.border }}
                    >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm font-semibold" style={{ color: T.text1 }}>
                                My Progress
                            </h2>
                        </div>
                        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                            <div className="relative mx-auto h-[200px] w-[200px] shrink-0">
                                <canvas ref={doughnutCanvasRef} className="max-h-full max-w-full" />
                                <div
                                    className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
                                    style={{ marginTop: -4 }}
                                >
                                    <span className="text-3xl font-semibold tabular-nums" style={{ color: T.text1 }}>
                                        {myProgressSegments.centerValue}
                                    </span>
                                    <span className="font-mono text-[10px]" style={{ color: T.text3 }}>
                                        tasks
                                    </span>
                                </div>
                            </div>
                            <ul className="flex flex-1 flex-col gap-2 font-mono text-[11px]" style={{ color: T.text2 }}>
                                {myProgressSegments.labels.map((lab, idx) => (
                                    <li key={lab} className="flex items-center gap-2">
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                                            style={{
                                                background: [T.blue, '#f59e0b', T.green, T.red][idx],
                                            }}
                                        />
                                        <span className="flex-1">{lab}</span>
                                        <span style={{ color: T.text3 }}>
                                            {myProgressSegments.displayValues[idx] || 0}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div
                        className="al-fade-up rounded-[12px] border p-5"
                        style={{ animationDelay: '0.45s', background: T.bgCard, borderColor: T.border }}
                    >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <h2 className="text-sm font-semibold" style={{ color: T.text1 }}>
                                Project Analytics
                            </h2>
                            <div
                                className="flex rounded-[8px] border p-0.5 font-mono text-[11px]"
                                style={{ borderColor: T.border, background: T.bgSurface }}
                            >
                                <button
                                    type="button"
                                    className="rounded-[6px] px-2 py-1 transition-colors"
                                    style={{
                                        background: !projectAnalyticsThisMonth ? T.blue : 'transparent',
                                        color: !projectAnalyticsThisMonth ? '#fff' : T.text2,
                                    }}
                                    onClick={() => setProjectAnalyticsThisMonth(false)}
                                >
                                    6 months
                                </button>
                                <button
                                    type="button"
                                    className="rounded-[6px] px-2 py-1 transition-colors"
                                    style={{
                                        background: projectAnalyticsThisMonth ? T.blue : 'transparent',
                                        color: projectAnalyticsThisMonth ? '#fff' : T.text2,
                                    }}
                                    onClick={() => setProjectAnalyticsThisMonth(true)}
                                >
                                    This Month
                                </button>
                            </div>
                        </div>
                        <div className="h-[220px] w-full">
                            <canvas ref={barCanvasRef} className="h-full w-full" />
                        </div>
                    </div>
                </div>

                {/* Recent activity */}
                <section
                    className="al-fade-up rounded-[12px] border"
                    style={{ animationDelay: '0.5s', background: T.bgCard, borderColor: T.border }}
                >
                    <div
                        className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                        style={{ borderColor: T.border }}
                    >
                        <div>
                            <h2 className="text-sm font-semibold" style={{ color: T.text1 }}>
                                Recent Activity
                            </h2>
                            <p className="font-mono text-[11px]" style={{ color: T.text3 }}>
                                Sessions, tasks, and updates · Current session {elapsedTime}
                            </p>
                        </div>
                        {activityLogs.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-[8px] font-medium"
                                style={{ borderColor: T.border, color: T.red, background: 'transparent' }}
                                onClick={handleClearLogs}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear history
                            </Button>
                        )}
                    </div>
                    <div className="divide-y" style={{ borderColor: T.border }}>
                        {displayedFeed.length === 0 ? (
                            <div className="px-5 py-12 text-center text-sm" style={{ color: T.text3 }}>
                                No activity yet.
                            </div>
                        ) : (
                            displayedFeed.map((item) => {
                                const ts = tagStyles[item.tag];
                                return (
                                    <div
                                        key={item.id}
                                        className="flex gap-3 px-5 py-4 transition-colors hover:bg-[rgba(16,27,46,0.5)]"
                                    >
                                        <div
                                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] text-sm font-medium"
                                            style={{ background: item.iconBg, color: T.text2 }}
                                        >
                                            {item.tag === 'Session' ? '⏱' : item.tag[0]}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm" style={{ color: T.text1 }}>
                                                <span className="font-semibold">{item.actor}</span>{' '}
                                                <span style={{ color: T.text2 }}>{item.entity}</span>
                                            </p>
                                            <p className="mt-1 font-mono text-[11px]" style={{ color: T.text3 }}>
                                                {item.timeLabel} · {item.source}
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                            <span
                                                className="rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase"
                                                style={{ background: ts.bg, color: ts.text }}
                                            >
                                                {item.tag}
                                            </span>
                                            {item.onDelete && (
                                                <button
                                                    type="button"
                                                    className="rounded-[8px] p-1.5 transition-colors hover:bg-red-500/10"
                                                    style={{ color: T.red }}
                                                    aria-label="Delete log"
                                                    onClick={item.onDelete}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    {filteredFeed.length > 8 && (
                        <div className="border-t px-3 py-2" style={{ borderColor: T.border }}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full rounded-[8px] font-mono text-[11px]"
                                style={{ color: T.text2 }}
                                onClick={() => setShowAllLogs(!showAllLogs)}
                            >
                                {showAllLogs ? (
                                    <>
                                        <ChevronUp className="mr-1 h-4 w-4" /> Show less
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="mr-1 h-4 w-4" /> Show{' '}
                                        {filteredFeed.length - 8} more
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
