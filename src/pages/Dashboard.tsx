import { useIsMobile } from "@/hooks/use-mobile";
import DesktopView from "@/components/views/layout/DesktopView";
import MobileView from "@/components/views/layout/MobileView";

const Dashboard = () => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileView />;
  }

  return <DesktopView />;
};

export default Dashboard;
