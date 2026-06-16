import { useState } from "react";
import {
    Home,
    FolderKanban,
    Calendar,
    CheckSquare,
    FileText,
    Clock,
    Users,
    Video,
    Settings,
    Star,
    Search,
    Bell,
    Plus,
    ChevronDown,
    ArrowRight,
    Github,
    Calendar as CalendarIcon,
    User
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    ContributionGraph,
    ContributionGraphBlock,
    ContributionGraphCalendar,
    ContributionGraphFooter,
    ContributionGraphLegend,
    ContributionGraphTotalCount,
} from "@/components/kibo-ui/contribution-graph";
import { eachDayOfInterval, formatISO } from "date-fns";


const DesktopPreview = () => {
    const [activeSection, setActiveSection] = useState("My Workspace");


    const mockProjects = [
        {
            id: 1,
            name: "Zync Dashboard",
            description: "Main dashboard application with GitHub integration and team collaboration features.",
            created: "Jan 15, 2026",
            owner: true,
            githubRepo: "ChitkulLakshya/zync-dashboard"
        },
        {
            id: 2,
            name: "Mobile App",
            description: "Cross-platform mobile application for iOS and Android.",
            created: "Jan 10, 2026",
            owner: true,
            githubRepo: null
        },
        {
            id: 3,
            name: "API Gateway",
            description: "Central API gateway for microservices architecture.",
            created: "Jan 5, 2026",
            owner: false,
            githubRepo: "team/api-gateway"
        },
    ];

    const sidebarItems = [
        { icon: Home, label: "Dashboard" },
        { icon: FolderKanban, label: "My Workspace" },
        { icon: Calendar, label: "Calendar" },
        { icon: Star, label: "Design" },
        { icon: CheckSquare, label: "Tasks" },
        { icon: FileText, label: "Notes" },
        { icon: Clock, label: "Activity" },
        { icon: Users, label: "People" },
        { icon: Video, label: "Meet" },
        { icon: Settings, label: "Settings" },
    ];


    const yearStart = new Date(2026, 0, 1);
    const yearEnd = new Date(2026, 11, 31);
    const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

    const graphData = days.map((date) => {
        const dateStr = formatISO(date, { representation: "date" });

        const dayNum = date.getDate() + date.getMonth() * 30;
        const seed = (dayNum * 17) % 100;
        const count = seed < 40 ? 0 : seed < 70 ? 2 : seed < 90 ? 5 : 12;

        const level = count === 0 ? 0 : count < 3 ? 1 : count < 6 ? 2 : count < 10 ? 3 : 4;
        return {
            date: dateStr,
            count,
            level,
        };
    });

    return (
        <div 
            className="w-full aspect-[16/10] bg-background rounded-2xl border-0 overflow-hidden flex"
            style={{ boxShadow: 'var(--shadow-xl), var(--glass-bevel)' }}
        >
            {/* Sidebar */}
            <aside className="w-48 bg-secondary/20 backdrop-blur-md border-r border-border/10 flex flex-col hidden md:flex shrink-0">
                {}
                <div className="p-3 border-b border-border h-12 flex items-center">
                    <div className="flex items-center px-1">
                        <img
                            src="/zync-dark.webp"
                            alt="Zync"
                            className="h-9 w-auto rounded-lg"
                        />
                    </div>
                </div>

                {}
                <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto custom-scrollbar">
                    {sidebarItems.map(item => (
                        <button
                            key={item.label}
                            onClick={() => setActiveSection(item.label)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${activeSection === item.label
                                ? "bg-secondary text-foreground shadow-sm"
                                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                }`}
                        >
                            <item.icon className="w-3.5 h-3.5" />
                            {item.label}
                        </button>
                    ))}
                </nav>

                {}
                <div className="p-2 border-t border-border/10">
                    <div className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-secondary/40 cursor-pointer transition-colors">
                        <Avatar className="w-6 h-6 border-0">
                            <AvatarFallback className="text-[9px] bg-foreground text-background">YU</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-medium text-foreground truncate">Your Name</div>
                            <div className="text-[9px] text-muted-foreground truncate">Premium</div>
                        </div>
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                </div>
            </aside>

            {}
            <main className="flex-1 flex flex-col overflow-hidden bg-background">
                {/* Header */}
                <header className="h-10 border-b border-border/10 flex items-center justify-between px-4 bg-background/60 backdrop-blur-md">
                    <Input
                        placeholder="Search..."
                        className="h-6 w-36 text-[10px] bg-secondary/30 border-0 shadow-none focus-visible:ring-1 focus-visible:ring-border rounded-full"
                    />
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                            <Bell className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </header>

                {}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {activeSection === "My Workspace" && (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">My Workspace</h2>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Manage your AI-generated projects and assignments.
                                    </p>
                                </div>
                                <Button size="sm" className="h-7 text-[10px] gap-1 px-3">
                                    <Plus className="w-3 h-3" /> Add Project
                                </Button>
                            </div>

                            {}
                            <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                                {mockProjects.map(project => (
                                    <Card
                                        key={project.id}
                                        className="group hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col bg-secondary/5 border-border/10 rounded-2xl"
                                    >
                                        <CardHeader className="p-3 pb-2 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal">Project</Badge>
                                                {project.owner && (
                                                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-normal">Owner</Badge>
                                                )}
                                            </div>
                                            <CardTitle className="text-xs font-semibold line-clamp-1 group-hover:text-foreground transition-colors">
                                                {project.name}
                                            </CardTitle>
                                            <CardDescription className="text-[10px] line-clamp-2 min-h-[30px]">
                                                {project.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-0 flex-1 flex flex-col justify-end">
                                            <div className="flex flex-col gap-1.5 text-[9px] text-muted-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarIcon className="w-3 h-3" />
                                                    <span>Created {project.created}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-3 h-3" />
                                                    <span>{project.owner ? "By You" : "By Team Member"}</span>
                                                </div>
                                            </div>
                                            {project.githubRepo ? (
                                                <div className="flex items-center gap-1.5 mt-2.5 p-1.5 bg-secondary/30 rounded text-[9px] group/repo border border-transparent hover:border-border transition-colors">
                                                    <Github className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{project.githubRepo}</span>
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full mt-2.5 h-7 text-[9px] gap-1.5 border-dashed"
                                                >
                                                    <Github className="w-3 h-3" />
                                                    Link GitHub
                                                </Button>
                                            )}
                                        </CardContent>
                                        <CardFooter className="p-2 border-t bg-secondary/10 mt-auto">
                                            <Button
                                                variant="ghost"
                                                className="flex-1 justify-between hover:bg-transparent px-1 text-foreground h-6 text-[9px] w-full"
                                            >
                                                View Architecture
                                                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeSection === "Dashboard" && (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {}
                            <Card className="bg-secondary/10 border-border/10 rounded-2xl shadow-sm">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-14 w-14 border border-border/10 shadow-sm">
                                            <AvatarFallback className="text-sm bg-foreground/5 text-foreground font-medium">GH</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold">Your GitHub</span>
                                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-secondary/20 text-foreground">
                                                    <Github className="h-3 w-3 mr-1" />
                                                    @username
                                                </Badge>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-1 max-w-sm line-clamp-1">
                                                Full stack developer passionate about building tools.
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-semibold text-foreground">128</span> followers
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-semibold text-foreground">45</span> repos
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {}
                            <Card className="p-5 overflow-hidden rounded-2xl border-border/10 shadow-sm bg-secondary/5">
                                <ContributionGraph data={graphData} blockSize={9} blockMargin={2} blockRadius={1}>
                                    <div className="flex items-center justify-between mb-3">
                                        <ContributionGraphTotalCount className="text-xs font-semibold" />
                                        <span className="text-[10px] text-muted-foreground font-medium">2026</span>
                                    </div>

                                    {}
                                    <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                                        <ContributionGraphCalendar>
                                            {({ activity, dayIndex, weekIndex }) => (
                                                <ContributionGraphBlock
                                                    key={`${weekIndex}-${dayIndex}`}
                                                    activity={activity}
                                                    dayIndex={dayIndex}
                                                    weekIndex={weekIndex}
                                                />
                                            )}
                                        </ContributionGraphCalendar>
                                    </div>

                                    <ContributionGraphFooter className="mt-2 pt-2 border-t">
                                        <span className="text-[9px] text-muted-foreground">Learn how we count contributions</span>
                                        <ContributionGraphLegend className="scale-75 origin-right" />
                                    </ContributionGraphFooter>
                                </ContributionGraph>
                            </Card>
                        </div>
                    )}

                    {activeSection === "Calendar" && (
                        <div className="space-y-4 max-w-lg mx-auto">
                            <h2 className="text-base font-bold">Calendar</h2>
                            <Card className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium">January 2026</span>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-xs">←</Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-xs">→</Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                    {["S", "M", "T", "W", "T", "F", "S"].map(d => (
                                        <div key={d} className="text-[9px] text-muted-foreground font-medium">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1 text-center">
                                    {[...Array(35)].map((_, i) => {
                                        const day = i - 3;
                                        const isToday = day === 19;
                                        const hasEvent = [5, 12, 22].includes(day);
                                        return (
                                            <div
                                                key={i}
                                                className={`aspect-square flex flex-col items-center justify-center rounded text-[10px] cursor-pointer transition-colors ${day < 1 || day > 31 ? "text-muted-foreground/20" :
                                                    isToday ? "bg-primary text-foreground-foreground font-medium" :
                                                        "text-foreground hover:bg-secondary"
                                                    }`}
                                            >
                                                {day >= 1 && day <= 31 && (
                                                    <>
                                                        {day}
                                                        {hasEvent && !isToday && <div className="w-1 h-1 rounded-full bg-task-orange mt-0.5" />}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeSection === "People" && (
                        <div className="space-y-4 max-w-2xl mx-auto">
                            <h2 className="text-base font-bold">People</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { name: "Alex Johnson", role: "Admin", status: "online", avatar: "AJ" },
                                    { name: "Sarah Chen", role: "Developer", status: "online", avatar: "SC" },
                                    { name: "Mike Wilson", role: "Designer", status: "away", avatar: "MW" },
                                    { name: "Emily Davis", role: "Developer", status: "offline", avatar: "ED" },
                                ].map(person => (
                                    <Card key={person.name} className="p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarFallback className="text-[10px] bg-secondary/20 text-foreground">{person.avatar}</AvatarFallback>
                                                </Avatar>
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-card ${person.status === "online" ? "bg-task-green" : person.status === "away" ? "bg-task-yellow" : "bg-muted"
                                                    }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-medium text-foreground">{person.name}</div>
                                                <div className="text-[9px] text-muted-foreground">{person.role}</div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Design Section */}
                    {activeSection === "Design" && (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">Design Inspiration</h2>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Cached Behance and Dribbble inspirations for design-to-code workflow.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { title: "Liquid Glass UI Dashboard", platform: "Dribbble", likes: "142", gradient: "from-purple-500/80 to-indigo-600/80" },
                                    { title: "AI Collaboration App", platform: "Behance", likes: "89", gradient: "from-pink-500/80 to-rose-600/80" },
                                    { title: "Real-time Chat Component", platform: "Dribbble", likes: "213", gradient: "from-cyan-500/80 to-blue-600/80" },
                                    { title: "Dark Mode Design System", platform: "Behance", likes: "305", gradient: "from-emerald-500/80 to-teal-600/80" },
                                    { title: "Kanban Board Interaction", platform: "Dribbble", likes: "97", gradient: "from-orange-500/80 to-amber-600/80" },
                                    { title: "AI Assistant Interface", platform: "Behance", likes: "154", gradient: "from-violet-500/80 to-purple-700/80" }
                                ].map((item, idx) => (
                                    <Card key={idx} className="overflow-hidden border-border/10 bg-secondary/5 group hover:border-border/30 transition-all duration-300">
                                        <div className={`aspect-video w-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-[10px] font-bold text-white relative`}>
                                            <span className="bg-black/40 px-2 py-0.5 rounded backdrop-blur-md">{item.platform}</span>
                                        </div>
                                        <div className="p-2.5">
                                            <h4 className="text-[10px] font-semibold text-foreground truncate">{item.title}</h4>
                                            <div className="flex items-center justify-between mt-1 text-[9px] text-muted-foreground">
                                                <span>{item.platform}</span>
                                                <span>❤️ {item.likes}</span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tasks Section */}
                    {activeSection === "Tasks" && (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">Kanban Board</h2>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Task tracking integrated directly with GitHub events.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    {
                                        title: "To Do",
                                        color: "border-t-blue-500",
                                        tasks: [
                                            { id: "TASK-102", title: "Setup Redis caching for scraper", priority: "Medium", assignee: "MW" },
                                            { id: "TASK-104", title: "Add light mode support", priority: "Low", assignee: "ED" }
                                        ]
                                    },
                                    {
                                        title: "In Progress",
                                        color: "border-t-amber-500",
                                        tasks: [
                                            { id: "TASK-89", title: "Implement Yjs editor syncing", priority: "High", assignee: "SC" },
                                            { id: "TASK-95", title: "Google Meet OAuth linking", priority: "High", assignee: "AJ" }
                                        ]
                                    },
                                    {
                                        title: "Done",
                                        color: "border-t-emerald-500",
                                        tasks: [
                                            { id: "TASK-78", title: "Landing page layout refactor", priority: "Medium", assignee: "SC" },
                                            { id: "TASK-62", title: "Database schema migration", priority: "High", assignee: "AJ" }
                                        ]
                                    }
                                ].map((col, idx) => (
                                    <div key={idx} className={`bg-secondary/5 rounded-xl border border-border/10 p-2.5 border-t-2 ${col.color} space-y-2`}>
                                        <div className="flex items-center justify-between pb-1.5 border-b border-border/5">
                                            <span className="text-[10px] font-bold text-foreground">{col.title}</span>
                                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-secondary/15">{col.tasks.length}</Badge>
                                        </div>
                                        {col.tasks.map((t, tid) => (
                                            <Card key={tid} className="p-2 border-border/10 bg-background/50 space-y-1.5 shadow-sm hover:border-border/20 transition-all">
                                                <div className="flex justify-between items-center text-[8px] text-muted-foreground">
                                                    <span className="font-mono text-foreground/75">{t.id}</span>
                                                    <Badge className={`text-[7px] px-1 py-0 h-3.5 font-normal ${t.priority === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : t.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>{t.priority}</Badge>
                                                </div>
                                                <h4 className="text-[10px] font-medium leading-snug line-clamp-2">{t.title}</h4>
                                                <div className="flex items-center justify-between pt-1 border-t border-border/5">
                                                    <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                                                        <Github className="w-2.5 h-2.5" />
                                                        <span>Syncing</span>
                                                    </div>
                                                    <Avatar className="w-4 h-4 border-0">
                                                        <AvatarFallback className="text-[7px] bg-secondary text-foreground">{t.assignee}</AvatarFallback>
                                                    </Avatar>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Notes Section */}
                    {activeSection === "Notes" && (
                        <div className="space-y-4 max-w-4xl mx-auto h-[300px] flex flex-col">
                            <div className="flex items-center justify-between shrink-0">
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">Collaborative Notes</h2>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Multiplayer document editing powered by Yjs conflict-free sync.
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1 flex gap-3 min-h-0 bg-secondary/5 rounded-xl border border-border/10 overflow-hidden">
                                {/* Left Folder Explorer */}
                                <div className="w-1/3 border-r border-border/10 bg-secondary/5 p-2 flex flex-col space-y-1">
                                    <span className="text-[8px] font-bold text-muted-foreground uppercase px-1 pb-1">Workspaces</span>
                                    <div className="space-y-0.5">
                                        {[
                                            { name: "📁 Product Roadmap", active: true },
                                            { name: "📁 System Architecture", active: false },
                                            { name: "📄 Sprint 4 Spec", active: false },
                                            { name: "📄 API Reference docs", active: false }
                                        ].map((item, idx) => (
                                            <div key={idx} className={`text-[10px] px-2 py-1 rounded cursor-pointer ${item.active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:bg-secondary/40'}`}>
                                                {item.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Right Editor View */}
                                <div className="flex-1 p-3 flex flex-col bg-background/50 relative overflow-y-auto custom-scrollbar">
                                    <div className="border-b border-border/10 pb-2 mb-2">
                                        <h3 className="text-xs font-bold text-foreground">📁 Product Roadmap</h3>
                                        <div className="flex items-center gap-1.5 mt-1 text-[8px] text-muted-foreground">
                                            <span>Active Users:</span>
                                            <div className="flex -space-x-1.5">
                                                <span className="w-4 h-4 rounded-full bg-blue-500 border border-background flex items-center justify-center text-[7px] text-white">AJ</span>
                                                <span className="w-4 h-4 rounded-full bg-purple-500 border border-background flex items-center justify-center text-[7px] text-white">SC</span>
                                            </div>
                                            <span className="text-task-green ml-1">● Synced</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2 text-[10px] leading-relaxed">
                                        <p className="font-semibold text-foreground">## Zync Platform v1.0 Launch Roadmap</p>
                                        <p className="text-muted-foreground">This roadmap outlines the milestones for the real-time team collaboration app.</p>
                                        <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-[9px] text-blue-400 relative">
                                            <span className="absolute -top-2 left-2 px-1 bg-background text-[7px] border border-blue-500/20 rounded font-semibold">Alex Johnson</span>
                                            "Working on finalizing the meeting integration schemas and testing Google Meet token refresh scripts."
                                        </div>
                                        <p className="text-muted-foreground">1. Refactor WebSocket namespace connections (Done)</p>
                                        <p className="text-muted-foreground flex items-center">
                                            2. Integrate collaborative block editing
                                            <span className="w-1.5 h-3 bg-purple-500 ml-0.5 animate-pulse" />
                                            <span className="text-[7px] px-1 bg-purple-500 text-white rounded scale-90 ml-1">Sarah Chen</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Activity Section */}
                    {activeSection === "Activity" && (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">Team Activity Log</h2>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Real-time session updates and Git commit synchronization log.
                                    </p>
                                </div>
                            </div>
                            <div className="bg-secondary/5 rounded-xl border border-border/10 p-3 space-y-2.5">
                                {[
                                    { user: "Sarah Chen", action: "merged pull request #124", target: "feature/multiplayer-yjs-editor", time: "10 mins ago", avatar: "SC", color: "bg-purple-500/10 text-purple-400" },
                                    { user: "Alex Johnson", action: "completed task", target: "TASK-62: Database schema migration", time: "1 hour ago", avatar: "AJ", color: "bg-emerald-500/10 text-emerald-400" },
                                    { user: "Mike Wilson", action: "pushed commit 68d3e51", target: "fix(collab): force isShared to enable real-time sync", time: "2 hours ago", avatar: "MW", color: "bg-blue-500/10 text-blue-400" },
                                    { user: "Emily Davis", action: "joined the project", target: "Zync Dashboard", time: "1 day ago", avatar: "ED", color: "bg-orange-500/10 text-orange-400" }
                                ].map((act, idx) => (
                                    <div key={idx} className="flex gap-3 items-start p-2 hover:bg-secondary/20 rounded-lg transition-colors">
                                        <Avatar className="w-7 h-7 border-0 mt-0.5">
                                            <AvatarFallback className="text-[9px] bg-secondary text-foreground">{act.avatar}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px]">
                                                <span className="font-semibold text-foreground">{act.user}</span>
                                                <span className="text-muted-foreground"> {act.action} </span>
                                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-semibold inline-block ${act.color}`}>{act.target}</span>
                                            </div>
                                            <span className="text-[8px] text-muted-foreground">{act.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Meet Section */}
                    {activeSection === "Meet" && (
                        <div className="space-y-4 max-w-4xl mx-auto">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">Video Meetings</h2>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Schedule calls and auto-generate Google Meet invitations inside chat.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { title: "Daily Standup Meeting", time: "Every weekday at 10:00 AM", status: "Scheduled", link: "meet.google.com/abc-defg-hij" },
                                    { title: "Sprint 4 Review & Demo", time: "Friday, June 19 at 3:00 PM", status: "Upcoming", link: "meet.google.com/xyz-1234-uvw" }
                                ].map((meet, idx) => (
                                    <Card key={idx} className="p-3 border-border/10 bg-secondary/5 space-y-2.5">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xs font-bold text-foreground">{meet.title}</h3>
                                            <Badge variant="outline" className="text-[8px] h-4 bg-task-green/10 text-task-green border-task-green/20">{meet.status}</Badge>
                                        </div>
                                        <div className="text-[9px] text-muted-foreground space-y-1">
                                            <div>📅 {meet.time}</div>
                                            <div className="text-[8px] font-mono select-all text-blue-400 bg-secondary/30 p-1 rounded mt-1 overflow-x-auto">{meet.link}</div>
                                        </div>
                                        <div className="flex items-center justify-between pt-1">
                                            <div className="flex -space-x-1.5">
                                                <span className="w-4 h-4 rounded-full bg-blue-500 border border-background flex items-center justify-center text-[7px] text-white">AJ</span>
                                                <span className="w-4 h-4 rounded-full bg-purple-500 border border-background flex items-center justify-center text-[7px] text-white">SC</span>
                                                <span className="w-4 h-4 rounded-full bg-orange-500 border border-background flex items-center justify-center text-[7px] text-white">MW</span>
                                            </div>
                                            <Button size="sm" className="h-6 text-[8px] bg-foreground text-background hover:bg-foreground/90">
                                                Join Meet
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Settings Section */}
                    {activeSection === "Settings" && (
                        <div className="space-y-4 max-w-lg mx-auto">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-bold tracking-tight text-foreground">Settings</h2>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        Configure your profile, integrations, and preferences.
                                    </p>
                                </div>
                            </div>
                            <Card className="p-4 border-border/10 bg-secondary/5 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Integrations</label>
                                    <div className="space-y-1.5">
                                        {[
                                            { name: "GitHub Integration", connected: true, details: "Connected as @username" },
                                            { name: "Google Calendar Sync", connected: true, details: "Sync enabled with your.email@gmail.com" },
                                            { name: "LinkedIn OAuth Login", connected: false, details: "Quick login connection" }
                                        ].map((int, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-2 bg-background/50 rounded-lg border border-border/5">
                                                <div>
                                                    <h4 className="text-[10px] font-semibold text-foreground">{int.name}</h4>
                                                    <span className="text-[8px] text-muted-foreground">{int.details}</span>
                                                </div>
                                                <Badge className={`text-[8px] px-1 py-0 h-3.5 font-normal ${int.connected ? 'bg-task-green/10 text-task-green border-task-green/20' : 'bg-secondary text-muted-foreground'}`}>{int.connected ? "Active" : "Connect"}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2 pt-2 border-t border-border/10">
                                    <label className="text-[9px] font-bold text-muted-foreground uppercase">Preferences</label>
                                    <div className="flex justify-between items-center text-[10px]">
                                        <span>Application Theme</span>
                                        <Badge className="text-[8px]">Dark Mode</Badge>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default DesktopPreview;
