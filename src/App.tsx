import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { queryPersister } from "./lib/query-persister";
import { queryClient } from "./lib/query-client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import NewProject from "./pages/NewProject";
import ProjectDetails from "./pages/ProjectDetails";

import PrivacyPolicy from "./pages/PrivacyPolicy";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { useActivityTracker } from "./hooks/use-activity-tracker";
import { useChatNotifications } from "./hooks/use-chat-notifications";
import { useUserSync } from "./hooks/use-user-sync";
import { WakeUpService } from "@/components/WakeUpService";
import { GlobalLoading } from "@/components/GlobalLoading";

const AppContent = () => {
  useActivityTracker();
  useChatNotifications();
  useUserSync();
  const location = useLocation();


  const getPageKey = (pathname: string) => {
    if (pathname.startsWith('/dashboard')) {
      return 'dashboard-layout';
    }
    return pathname;
  };

  return (
    <>
      <WakeUpService />
      <GlobalLoading />
      <AnimatePresence mode="wait">
        <motion.div
          key={getPageKey(location.pathname)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="h-full w-full"
        >
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/workspace" element={<Dashboard />} />
            <Route path="/dashboard/projects" element={<Dashboard />} />
            <Route path="/dashboard/calendar" element={<Dashboard />} />
            <Route path="/dashboard/design" element={<Dashboard />} />
            <Route path="/dashboard/tasks" element={<Dashboard />} />
            <Route path="/dashboard/notes" element={<Dashboard />} />
            <Route path="/dashboard/files" element={<Dashboard />} />
            <Route path="/dashboard/activity" element={<Dashboard />} />
            <Route path="/dashboard/people" element={<Dashboard />} />
            <Route path="/dashboard/meet" element={<Dashboard />} />
            <Route path="/dashboard/settings" element={<Dashboard />} />
            <Route path="/dashboard/chat" element={<Dashboard />} />
            <Route path="/dashboard/new-project" element={<Dashboard />} />
            <Route path="/new-project" element={<NewProject />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />

            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

const App = () => (
  <PersistQueryClientProvider
    client={queryClient}
    persistOptions={{
      persister: queryPersister,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    }}
  >
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </PersistQueryClientProvider>
);

export default App;
