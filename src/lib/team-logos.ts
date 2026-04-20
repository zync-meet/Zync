import { 
    Rocket, Shield, Zap, Globe, Cpu, Atom, Anchor, 
    Binary, Boxes, Briefcase, Bug, Cloud, Code, 
    Compass, Container, Database, Diamond, Eye, 
    Feather, FileCode, Filter, Flame, FlaskConical, 
    Folder, Gauge, Gem, Ghost, Gift, GraduationCap, 
    HardDrive, Heart, Infinity, Key, Laptop, Layers, 
    Lightbulb, Link, Lock, Map, Megaphone, Microscope, 
    Music, Palette, Paperclip, Phone, PieChart, 
    Puzzle, Radio, Search, Send, Settings, Share2, 
    Smile, Star, Target, Terminal, Trophy, Users, 
    Video, Wallet, Wand2, Watch, Wind, Wrench
} from "lucide-react";

export type TeamLogoId = 
    | "rocket" | "shield" | "zap" | "globe" | "cpu" | "atom" | "anchor" 
    | "binary" | "boxes" | "briefcase" | "bug" | "cloud" | "code" 
    | "compass" | "container" | "database" | "diamond" | "eye" 
    | "feather" | "file-code" | "filter" | "flame" | "flask" 
    | "folder" | "gauge" | "gem" | "ghost" | "gift" | "grad" 
    | "hdd" | "heart" | "infinity" | "key" | "laptop" | "layers" 
    | "bulb" | "link" | "lock" | "map" | "megaphone" | "micro" 
    | "music" | "palette" | "clip" | "phone" | "pie" 
    | "puzzle" | "radio" | "search" | "send" | "settings" | "share" 
    | "smile" | "star" | "target" | "terminal" | "trophy" | "users" 
    | "video" | "wallet" | "wand" | "watch" | "wind" | "wrench";

export interface TeamLogo {
    id: TeamLogoId;
    icon: any;
    label: string;
}

export const TEAM_LOGOS: TeamLogo[] = [
    { id: "rocket", icon: Rocket, label: "Rocket" },
    { id: "shield", icon: Shield, label: "Shield" },
    { id: "zap", icon: Zap, label: "Fast" },
    { id: "globe", icon: Globe, label: "Global" },
    { id: "cpu", icon: Cpu, label: "Tech" },
    { id: "atom", icon: Atom, label: "Science" },
    { id: "anchor", icon: Anchor, label: "Stable" },
    { id: "binary", icon: Binary, label: "Binary" },
    { id: "boxes", icon: Boxes, label: "Storage" },
    { id: "briefcase", icon: Briefcase, label: "Business" },
    { id: "bug", icon: Bug, label: "QA" },
    { id: "cloud", icon: Cloud, label: "Cloud" },
    { id: "code", icon: Code, label: "Code" },
    { id: "compass", icon: Compass, label: "Navigate" },
    { id: "container", icon: Container, label: "Docker" },
    { id: "database", icon: Database, label: "Data" },
    { id: "diamond", icon: Diamond, label: "Premium" },
    { id: "eye", icon: Eye, label: "Vision" },
    { id: "feather", icon: Feather, label: "Light" },
    { id: "file-code", icon: FileCode, label: "Script" },
    { id: "filter", icon: Filter, label: "Filter" },
    { id: "flame", icon: Flame, label: "Hot" },
    { id: "flask", icon: FlaskConical, label: "Lab" },
    { id: "folder", icon: Folder, label: "Assets" },
    { id: "gauge", icon: Gauge, label: "Performance" },
    { id: "gem", icon: Gem, label: "Jewel" },
    { id: "ghost", icon: Ghost, label: "Stealth" },
    { id: "gift", icon: Gift, label: "Rewards" },
    { id: "grad", icon: GraduationCap, label: "Learn" },
    { id: "hdd", icon: HardDrive, label: "Server" },
    { id: "heart", icon: Heart, label: "Care" },
    { id: "infinity", icon: Infinity, label: "Endless" },
    { id: "key", icon: Key, label: "Security" },
    { id: "laptop", icon: Laptop, label: "Hardware" },
    { id: "layers", icon: Layers, label: "Stack" },
    { id: "bulb", icon: Lightbulb, label: "Idea" },
    { id: "link", icon: Link, label: "Network" },
    { id: "lock", icon: Lock, label: "Vault" },
    { id: "map", icon: Map, label: "Route" },
    { id: "megaphone", icon: Megaphone, label: "Alert" },
    { id: "micro", icon: Microscope, label: "Research" },
    { id: "music", icon: Music, label: "Entertainment" },
    { id: "palette", icon: Palette, label: "Art" },
    { id: "clip", icon: Paperclip, label: "Attachment" },
    { id: "phone", icon: Phone, label: "Support" },
    { id: "pie", icon: PieChart, label: "Stats" },
    { id: "puzzle", icon: Puzzle, label: "Logic" },
    { id: "radio", icon: Radio, label: "Signal" },
    { id: "search", icon: Search, label: "Find" },
    { id: "send", icon: Send, label: "Launch" },
    { id: "settings", icon: Settings, label: "Config" },
    { id: "share", icon: Share2, label: "Share" },
    { id: "smile", icon: Smile, label: "Social" },
    { id: "star", icon: Star, label: "Favorite" },
    { id: "target", icon: Target, label: "Goal" },
    { id: "terminal", icon: Terminal, label: "Console" },
    { id: "trophy", icon: Trophy, label: "Win" },
    { id: "users", icon: Users, label: "Social" },
    { id: "video", icon: Video, label: "Media" },
    { id: "wallet", icon: Wallet, label: "Finance" },
    { id: "wand", icon: Wand2, label: "Magic" },
    { id: "watch", icon: Watch, label: "Time" },
    { id: "wind", icon: Wind, label: "Air" },
    { id: "wrench", icon: Wrench, label: "Tools" }
];

export const getLogoById = (id: string): TeamLogo => {
    return TEAM_LOGOS.find(l => l.id === id) || TEAM_LOGOS[0];
};

export const getRandomLogoId = (): TeamLogoId => {
    const randomIndex = Math.floor(Math.random() * TEAM_LOGOS.length);
    return TEAM_LOGOS[randomIndex].id;
};

// Deterministic logo for consistent assignment to existing teams
export const getDeterministicLogoId = (seed: string): TeamLogoId => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % TEAM_LOGOS.length);
    return TEAM_LOGOS[index].id;
};
