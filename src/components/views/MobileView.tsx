import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { signOutAndClearState } from "@/lib/auth-signout";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  LayoutDashboard,
  Folder,
  CheckSquare,
  Users,
  Calendar,
  FileText,
  Video,
  Settings,
  LogOut,
  Bell
} from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import Workspace from "@/components/workspace/Workspace";
import DashboardView from "./DashboardView";
import TasksView from "./TasksView";
import PeopleView from "./PeopleView";
import ActivityLogView from "./ActivityLogView";
import CalendarView from "./CalendarView";
import { NotesView } from "@/components/notes/NotesView";
import MeetView from "./MeetView";
import SettingsView from "./SettingsView";
import { API_BASE_URL, getFullUrl } from "@/lib/utils";
import { useMe } from "@/hooks/useMe";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WifiOff, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MobileView = () => {
  const [activeTab, setActiveTab] = useState("Home");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const { isError: userMeError, refetch: refetchMe } = useMe();
  const [usersList, setUsersList] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (currentUser) {
      const fetchUsers = async () => {
        try {
          const token = await currentUser.getIdToken();
          const response = await fetch(`${API_BASE_URL}/api/users`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUsersList(data);
          }
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };
      fetchUsers();
    }
  }, [currentUser]);

  const handleNavigate = (path: string) => {
    if (path === "New Project") {
      navigate("/new-project");
    } else if (path === "Projects") {
      setActiveTab("Projects");
    }
  };

  const handleSelectProject = (id: string) => {
    navigate(`/projects/${id}`, { state: { from: '/dashboard/workspace' } });
  };

  const handleSignOut = async () => {
    try {
      await signOutAndClearState(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };


  const drawerItems = [
    { id: 'Home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Projects', label: 'Projects', icon: Folder },
    { id: 'Tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'People', label: 'Team', icon: Users },
    { id: 'Activity', label: 'Activity', icon: Bell },
    { id: 'Calendar', label: 'Calendar', icon: Calendar },
    { id: 'Notes', label: 'Notes', icon: FileText },
    { id: 'Meet', label: 'Meet', icon: Video },
    { id: 'Settings', label: 'Settings', icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "Home":
        return currentUser ? <DashboardView currentUser={currentUser} /> : null;
      case "Projects":
        return currentUser ? (
          <div className="p-4">
            <Workspace
              onNavigate={handleNavigate}
              onSelectProject={handleSelectProject}
              currentUser={currentUser}
            />
          </div>
        ) : null;
      case "Tasks":
        return currentUser ? <TasksView currentUser={currentUser} users={usersList} /> : null;
      case "Activity":
        // ActivityLogView needs props. For now using placeholder or minimal props if possible.


        return <div className="p-4 text-center text-muted-foreground">Activity Log (Coming Soon on Mobile)</div>;
      case "People":

        return <PeopleView users={usersList} userStatuses={{}} onChat={() => { }} />;
      case "Calendar":
        return <CalendarView />;
      case "Notes":
        return <NotesView user={currentUser ? { uid: currentUser.uid, displayName: currentUser.displayName || undefined, email: currentUser.email || undefined, photoURL: currentUser.photoURL || undefined } : null} users={usersList} />;
      case "Meet":
        return <MeetView currentUser={currentUser} usersList={usersList} userStatuses={{}} />;
      case "Settings":
        return <SettingsView />;
      case "Profile":
        return (
          <div className="flex flex-col items-center p-6 space-y-6">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-24 w-24">
                <AvatarImage src={getFullUrl(currentUser?.photoURL)} />
                <AvatarFallback>{currentUser?.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{currentUser?.displayName}</h2>
              <p className="text-muted-foreground">{currentUser?.email}</p>
            </div>
            <Button variant="destructive" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const DrawerContent = (
    <ScrollArea className="h-full py-2">
      <div className="space-y-1 px-2">
        <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Menu
        </div>
        {drawerItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={`w-full justify-start gap-3 h-11 font-medium ${activeTab === item.id ? "bg-secondary/50 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => setActiveTab(item.id)}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <MobileLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      user={currentUser ? {
        displayName: currentUser.displayName || undefined,
        email: currentUser.email || undefined,
        photoURL: currentUser.photoURL ? getFullUrl(currentUser.photoURL) : undefined
      } : null}
      drawerContent={DrawerContent}
      onFabClick={() => navigate("/new-project")}
      headerTitle={activeTab === 'Home' ? 'Dashboard' : activeTab}
    >
      {userMeError && currentUser && (
        <div className="p-3 border-b border-destructive/30 bg-destructive/10 shrink-0">
          <Alert className="border-destructive/40 bg-background/80 text-foreground">
            <WifiOff className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive text-sm">Can&apos;t reach the server</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 text-xs text-muted-foreground">
              <span>We couldn&apos;t load your account data. Try again later or refresh the page.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit gap-2"
                onClick={() => void refetchMe()}
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}
      {renderContent()}
    </MobileLayout>
  );
};

export default MobileView;
