import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export const LoadingSpinner = ({ className, size = 24, ...props }: LoadingSpinnerProps) => {
  return (
    <Loader2
      className={cn("animate-spin text-primary", className)}
      size={size}
      {...props}
    />
  );
};
