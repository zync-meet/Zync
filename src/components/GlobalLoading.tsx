import { useIsFetching } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export const GlobalLoading = () => {
  const isFetching = useIsFetching();
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isFetching > 0) {
      // If not already showing, wait 200ms before showing
      if (!showLoading) {
        timeout = setTimeout(() => {
          setShowLoading(true);
        }, 200);
      }
    } else {
      // Hide immediately when fetching stops
      setShowLoading(false);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [isFetching, showLoading]);

  if (!showLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm transition-opacity duration-300">
      <LoadingSpinner className="h-12 w-12 text-primary" />
    </div>
  );
};
