import React from 'react';
import { Menu, Search, Plus, Home, Folder, CheckSquare, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MobileLayoutProps {
    children: React.ReactNode;
    headerTitle?: React.ReactNode;
    activeTab: string;
    onTabChange: (tab: string) => void;
    drawerContent?: React.ReactNode;
    user?: {
        displayName?: string;
        email?: string;
        photoURL?: string;
    } | null;
    onFabClick?: () => void;
    rightHeaderAction?: React.ReactNode;
}

export const MobileLayout = ({
    children,
    headerTitle = "Lakshya GitConnect",
    activeTab,
    onTabChange,
    drawerContent,
    user,
    onFabClick,
    rightHeaderAction
}: MobileLayoutProps) => {

    const navItems = [
        { id: 'Home', icon: Home, label: 'Home' },
        { id: 'Projects', icon: Folder, label: 'Projects' },
        { id: 'Tasks', icon: CheckSquare, label: 'Tasks' },
        { id: 'Activity', icon: Bell, label: 'Activity' },
        { id: 'Profile', icon: User, label: 'Profile' },
    ];


    const isMainTab = navItems.some(item => item.id === activeTab);

    return (
        <div className="flex flex-col h-screen w-full bg-background text-foreground overflow-hidden">
            {}
            <header className="h-14 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 shrink-0 z-40">
                <div className="flex items-center gap-3">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="-ml-2 h-10 w-10">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Open Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[85%] sm:w-[350px] p-0">
                            {}
                            <div className="flex flex-col h-full bg-background">
                                {user && (
                                    <div className="p-6 border-b flex items-center gap-4 bg-muted/20">
                                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                                            <AvatarImage src={user.photoURL} />
                                            <AvatarFallback>{user.displayName?.substring(0, 1) || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-semibold truncate text-lg">{user.displayName}</span>
                                            <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex-1 overflow-y-auto">
                                    {drawerContent}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div className="font-semibold text-lg tracking-tight">
                        {headerTitle}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {rightHeaderAction ? rightHeaderAction : (
                        <Button variant="ghost" size="icon" className="-mr-2 text-muted-foreground">
                            <Search className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </header>

            {}
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background relative" id="mobile-main-content">
                {children}
            </main>

            {}
            {}
            {onFabClick && (
                <div className="absolute bottom-20 right-4 z-50">
                    <Button
                        onClick={onFabClick}
                        size="icon"
                        className="h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </div>
            )}

            {}
            <nav className="h-16 border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0 z-40 pb-safe">
                <div className="grid grid-cols-5 h-full">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        const Icon = item.icon;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 transition-colors relative group",
                                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <div className={cn(
                                    "p-1.5 rounded-xl transition-all duration-200",
                                    isActive ? "bg-primary/10" : "group-hover:bg-muted"
                                )}>
                                    <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
                                </div>
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        )
                    })}
                </div>
            </nav>
        </div>
    );
};
