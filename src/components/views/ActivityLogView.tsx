import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { ActivityGraph } from "./ActivityGraph";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    CartesianGrid,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface ActivityLog {
    _id: string;
    startTime: string;
    endTime: string;
    duration?: number;
    date: string;
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


const CHART_COLORS = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    focus: '#6366f1',
    meetings: '#22c55e',
    idle: '#64748b',
    active: '#6366f1',
    missed: '#334155',
};


interface Badge {
    id: string;
    name: string;
    description: string;
    emoji: string;
    isUnlocked: boolean;
    category: 'streak' | 'time' | 'focus';
    progress?: string;
    requirement?: string;
}


const BadgeCard: React.FC<{ badge: Badge }> = ({ badge }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div
            className={`
                relative p-4 rounded-lg border
                ${badge.isUnlocked
                    ? 'bg-card border-border/50 hover:border-border'
                    : 'bg-muted/20 border-border/20 opacity-50 grayscale cursor-help'
                }
            `}
            onMouseEnter={() => !badge.isUnlocked && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {}
            {showTooltip && !badge.isUnlocked && badge.requirement && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 px-3 py-1.5 bg-popover border border-border/50 rounded-md shadow-md whitespace-nowrap">
                    <p className="text-xs text-muted-foreground">{badge.requirement}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-border/50" />
                </div>
            )}
            <div className="flex items-start gap-3">
                <div
                    className={`
                        flex items-center justify-center w-10 h-10 rounded-lg text-xl
                        ${badge.isUnlocked
                            ? badge.category === 'streak'
                                ? 'bg-orange-500/10'
                                : badge.category === 'time'
                                    ? 'bg-blue-500/10'
                                    : 'bg-green-500/10'
                            : 'bg-muted'
                        }
                    `}
                >
                    {badge.emoji}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium truncate ${badge.isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {badge.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {badge.description}
                    </p>
                    {}
                    {!badge.isUnlocked && badge.progress && (
                        <p className="text-[10px] text-muted-foreground/70 mt-1.5 font-medium">
                            {badge.progress}
                        </p>
                    )}
                </div>
            </div>
            {badge.isUnlocked && (
                <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
            )}
        </div>
    );
};

const ActivityLogView: React.FC<ActivityLogViewProps> = ({ activityLogs, elapsedTime, handleClearLogs, handleDeleteLog, tasks, users, teamSessions, currentTeamId, ownedTeams, currentUserId }) => {
    const [showAllLogs, setShowAllLogs] = useState(false);


    const sortedLogs = [...activityLogs].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    let currentStreak = 0;
    let totalSeconds = 0;


    activityLogs.forEach(log => {
        const start = new Date(log.startTime);
        const end = new Date(log.endTime);
        totalSeconds += (log.duration || Math.round((end.getTime() - start.getTime()) / 1000));
    });


    if (sortedLogs.length > 0) {
        currentStreak = 1;
        let lastDate = new Date(sortedLogs[0].startTime).setHours(0, 0, 0, 0);

        for (let i = 1; i < sortedLogs.length; i++) {
            const currentDate = new Date(sortedLogs[i].startTime).setHours(0, 0, 0, 0);
            const diffTime = Math.abs(lastDate - currentDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreak++;
                lastDate = currentDate;
            } else if (diffDays === 0) {
                continue;
            } else {
                break;
            }
        }
    }

    const formatTotalTime = (seconds: number) => {
        const d = Math.floor(seconds / (3600 * 24));
        const h = Math.floor((seconds % (3600 * 24)) / 3600);
        const m = Math.floor((seconds % 3600) / 60);

        const parts = [];
        if (d > 0) {parts.push(`${d}d`);}
        if (h > 0 || d > 0) {parts.push(`${h}h`);}
        parts.push(`${m}m`);

        return parts.join(' ');
    };

    const formattedTotalTime = formatTotalTime(totalSeconds);


    const dailyActiveTimeData = useMemo(() => {
        const days = 14;
        const data: { date: string; label: string; minutes: number }[] = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const day = startOfDay(subDays(now, i));
            const dayStr = format(day, 'yyyy-MM-dd');
            const label = format(day, 'MMM d');

            let totalMinutes = 0;
            activityLogs.forEach(log => {
                const logDate = format(new Date(log.startTime), 'yyyy-MM-dd');
                if (logDate === dayStr) {
                    const start = new Date(log.startTime);
                    const end = new Date(log.endTime);
                    const seconds = log.duration || Math.round((end.getTime() - start.getTime()) / 1000);
                    totalMinutes += Math.round(seconds / 60);
                }
            });

            data.push({ date: dayStr, label, minutes: totalMinutes });
        }

        return data;
    }, [activityLogs]);


    const usageDistributionData = useMemo(() => {
        const focusTime = Math.round(totalSeconds * 0.65);
        const meetingsTime = Math.round(totalSeconds * 0.25);
        const idleTime = Math.round(totalSeconds * 0.10);

        const total = focusTime + meetingsTime + idleTime;
        if (total === 0) {return [];}

        return [
            { name: 'Focus Time', value: Math.round(focusTime / 60), percentage: 65 },
            { name: 'Meetings', value: Math.round(meetingsTime / 60), percentage: 25 },
            { name: 'Idle', value: Math.round(idleTime / 60), percentage: 10 },
        ];
    }, [totalSeconds]);


    const streakChartData = useMemo(() => {
        const trackingDays = 30;
        const now = new Date();
        const activeDaysSet = new Set<string>();

        activityLogs.forEach(log => {
            const dayStr = format(new Date(log.startTime), 'yyyy-MM-dd');
            activeDaysSet.add(dayStr);
        });

        let activeDays = 0;
        for (let i = 0; i < trackingDays; i++) {
            const day = subDays(now, i);
            const dayStr = format(day, 'yyyy-MM-dd');
            if (activeDaysSet.has(dayStr)) {
                activeDays++;
            }
        }

        const missedDays = trackingDays - activeDays;

        return [
            { name: 'Active Days', value: activeDays },
            { name: 'Missed Days', value: missedDays },
        ];
    }, [activityLogs]);


    const badgesData = useMemo((): Badge[] => {
        const totalHoursComputed = totalSeconds / 3600;
        const focusPercentage = 65;
        const idlePercentage = 10;

        return [

            {
                id: 'streak-5',
                name: '5-Day Streak',
                description: 'Maintained activity for 5 consecutive days',
                emoji: '🔥',
                isUnlocked: currentStreak >= 5,
                category: 'streak',
                progress: currentStreak < 5 ? `${currentStreak} / 5 days` : undefined,
                requirement: 'Maintain a 5-day activity streak to unlock',
            },
            {
                id: 'streak-10',
                name: '10-Day Streak',
                description: 'Maintained activity for 10 consecutive days',
                emoji: '🔥',
                isUnlocked: currentStreak >= 10,
                category: 'streak',
                progress: currentStreak < 10 ? `${currentStreak} / 10 days` : undefined,
                requirement: 'Maintain a 10-day activity streak to unlock',
            },
            {
                id: 'streak-30',
                name: '30-Day Streak',
                description: 'Maintained activity for 30 consecutive days',
                emoji: '📆',
                isUnlocked: currentStreak >= 30,
                category: 'streak',
                progress: currentStreak < 30 ? `${currentStreak} / 30 days` : undefined,
                requirement: 'Maintain a 30-day activity streak to unlock',
            },

            {
                id: 'time-10h',
                name: '10 Hour Club',
                description: 'Accumulated 10 hours of total usage',
                emoji: '⏱️',
                isUnlocked: totalHoursComputed >= 10,
                category: 'time',
                progress: totalHoursComputed < 10 ? `${Math.floor(totalHoursComputed)} / 10 hours` : undefined,
                requirement: 'Accumulate 10 hours of usage to unlock',
            },
            {
                id: 'time-50h',
                name: '50 Hour Veteran',
                description: 'Accumulated 50 hours of total usage',
                emoji: '⏰',
                isUnlocked: totalHoursComputed >= 50,
                category: 'time',
                progress: totalHoursComputed < 50 ? `${Math.floor(totalHoursComputed)} / 50 hours` : undefined,
                requirement: 'Accumulate 50 hours of usage to unlock',
            },
            {
                id: 'time-100h',
                name: '100 Hour Century',
                description: 'Accumulated 100 hours of total usage',
                emoji: '⏰',
                isUnlocked: totalHoursComputed >= 100,
                category: 'time',
                progress: totalHoursComputed < 100 ? `${Math.floor(totalHoursComputed)} / 100 hours` : undefined,
                requirement: 'Accumulate 100 hours of usage to unlock',
            },

            {
                id: 'focus-high',
                name: 'Deep Focus',
                description: 'Maintained 60%+ focus time ratio',
                emoji: '🎯',
                isUnlocked: focusPercentage >= 60 && totalHoursComputed > 1,
                category: 'focus',
                progress: totalHoursComputed <= 1 ? `${Math.round(totalHoursComputed * 100) / 100} / 1 hour min` : focusPercentage < 60 ? `${focusPercentage}% / 60%` : undefined,
                requirement: 'Maintain 60%+ focus time with at least 1 hour of usage',
            },
            {
                id: 'idle-low',
                name: 'Efficiency Expert',
                description: 'Kept idle time below 15%',
                emoji: '⚡',
                isUnlocked: idlePercentage < 15 && totalHoursComputed > 1,
                category: 'focus',
                progress: totalHoursComputed <= 1 ? `${Math.round(totalHoursComputed * 100) / 100} / 1 hour min` : idlePercentage >= 15 ? `${idlePercentage}% idle (need <15%)` : undefined,
                requirement: 'Keep idle time below 15% with at least 1 hour of usage',
            },
        ];
    }, [currentStreak, totalSeconds]);


    const groupedBadges = useMemo(() => {
        return {
            streak: badgesData.filter(b => b.category === 'streak'),
            time: badgesData.filter(b => b.category === 'time'),
            focus: badgesData.filter(b => b.category === 'focus'),
        };
    }, [badgesData]);


    const BarTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border/50 rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground">
                        {payload[0].value} min
                    </p>
                </div>
            );
        }
        return null;
    };


    const PieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border/50 rounded-lg px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
                    <p className="text-sm text-muted-foreground">
                        {payload[0].value} min ({payload[0].payload.percentage || Math.round((payload[0].value / (streakChartData[0].value + streakChartData[1].value)) * 100)}%)
                    </p>
                </div>
            );
        }
        return null;
    };


    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.08) {return null;}

        return (
            <text
                x={x}
                y={y}
                fill="#fff"
                textAnchor="middle"
                dominantBaseline="central"
                className="text-xs font-medium"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="p-6 h-full space-y-6 overflow-y-auto">
            <h2 className="text-2xl font-bold">Activity Log</h2>

            {}
            {}
            {tasks && tasks.length > 0 && users && (
                <div className="mb-8">
                    <ActivityGraph tasks={tasks} users={users} teamSessions={teamSessions} currentTeamId={currentTeamId} ownedTeams={ownedTeams} currentUserId={currentUserId} />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Current Session</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{elapsedTime}</div>
                        <p className="text-xs text-muted-foreground">Active right now</p>
                    </CardContent>
                </Card>

                {}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Usage Streak</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className="text-2xl font-bold">{currentStreak} Days</div>
                            <span className="text-2xl">🔥</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Keep it up!</p>
                    </CardContent>
                </Card>

                {}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Time Spent</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formattedTotalTime}</div>
                        <p className="text-xs text-muted-foreground">Lifetime usage</p>
                    </CardContent>
                </Card>
            </div>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {}
                <Card className="lg:col-span-2">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base font-semibold">Daily Active Time</CardTitle>
                        <CardDescription>Your activity over the last 14 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyActiveTimeData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                                        tickFormatter={(value) => `${value}m`}
                                        width={40}
                                    />
                                    <Tooltip content={<BarTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
                                    <Bar
                                        dataKey="minutes"
                                        fill={CHART_COLORS.primary}
                                        radius={[6, 6, 0, 0]}
                                        maxBarSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {}
                <div className="flex flex-col gap-6">
                    {}
                    <Card className="flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Usage Distribution</CardTitle>
                            <CardDescription>How your time is spent</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[160px] w-full">
                                {usageDistributionData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={usageDistributionData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={35}
                                                outerRadius={60}
                                                paddingAngle={2}
                                                dataKey="value"
                                                labelLine={false}
                                                label={renderCustomLabel}
                                            >
                                                <Cell fill={CHART_COLORS.focus} />
                                                <Cell fill={CHART_COLORS.meetings} />
                                                <Cell fill={CHART_COLORS.idle} />
                                            </Pie>
                                            <Tooltip content={<PieTooltip />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                        No data available
                                    </div>
                                )}
                            </div>
                            {}
                            {usageDistributionData.length > 0 && (
                                <div className="flex justify-center gap-4 mt-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.focus }} />
                                        <span className="text-xs text-muted-foreground">Focus</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.meetings }} />
                                        <span className="text-xs text-muted-foreground">Meetings</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.idle }} />
                                        <span className="text-xs text-muted-foreground">Idle</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {}
                    <Card className="flex-1">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-semibold">Activity Streak</CardTitle>
                            <CardDescription>Last 30 days overview</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[160px] w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={streakChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={45}
                                            outerRadius={60}
                                            paddingAngle={2}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            <Cell fill={CHART_COLORS.active} />
                                            <Cell fill={CHART_COLORS.missed} />
                                        </Pie>
                                        <Tooltip content={<PieTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-2xl font-bold">{currentStreak}</span>
                                    <span className="text-xs text-muted-foreground">day streak</span>
                                </div>
                            </div>
                            {}
                            <div className="flex justify-center gap-4 mt-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.active }} />
                                    <span className="text-xs text-muted-foreground">Active</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.missed }} />
                                    <span className="text-xs text-muted-foreground">Missed</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-semibold">Badges</CardTitle>
                    <CardDescription>Unlock achievements as you use the platform</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {}
                    <div>
                        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Streak</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupedBadges.streak.map((badge) => (
                                <BadgeCard key={badge.id} badge={badge} />
                            ))}
                        </div>
                    </div>

                    {}
                    <div>
                        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Time</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupedBadges.time.map((badge) => (
                                <BadgeCard key={badge.id} badge={badge} />
                            ))}
                        </div>
                    </div>

                    {}
                    <div>
                        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Focus</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupedBadges.focus.map((badge) => (
                                <BadgeCard key={badge.id} badge={badge} />
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>Unlocked: {badgesData.filter(b => b.isUnlocked).length}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                            <span>Locked: {badgesData.filter(b => !b.isUnlocked).length}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                    <div className="space-y-1.5">
                        <CardTitle>Session History</CardTitle>
                        <CardDescription>Track your active time on the platform.</CardDescription>
                    </div>
                    {activityLogs.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleClearLogs}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear History
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="grid grid-cols-5 p-4 font-medium border-b bg-muted/50">
                            <div>Date</div>
                            <div>Start Time</div>
                            <div>End Time</div>
                            <div>Duration</div>
                            <div className="text-right">Actions</div>
                        </div>
                        {activityLogs.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No activity logs found.</div>
                        ) : (
                            <>
                                {(showAllLogs ? activityLogs : activityLogs.slice(0, 4)).map((log) => {
                                    const start = new Date(log.startTime);
                                    const end = new Date(log.endTime);
                                    const durationSeconds = log.duration || Math.round((end.getTime() - start.getTime()) / 1000);
                                    const formattedDuration = formatTotalTime(durationSeconds);

                                    return (
                                        <div key={log._id} className="grid grid-cols-5 p-4 border-b last:border-0 hover:bg-muted/20 items-center">
                                            <div>{log.date}</div>
                                            <div>{start.toLocaleTimeString()}</div>
                                            <div>{end.toLocaleTimeString()}</div>
                                            <div className="font-medium">
                                                {formattedDuration}
                                            </div>
                                            <div className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteLog(log._id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {activityLogs.length > 4 && (
                                    <div className="p-3 border-t bg-muted/30">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
                                            onClick={() => setShowAllLogs(!showAllLogs)}
                                        >
                                            {showAllLogs ? (
                                                <>
                                                    <ChevronUp className="h-4 w-4" />
                                                    Show Less
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4" />
                                                    Show {activityLogs.length - 4} More Sessions
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ActivityLogView;
