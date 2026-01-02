import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ExternalLink, Loader2, Heart } from "lucide-react";
import { API_BASE_URL } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface DribbbleShot {
  id: number;
  title: string;
  images: {
    hidpi: string | null;
    normal: string;
    teaser: string;
  };
  html_url: string;
  user: {
    name: string;
    avatar_url: string;
    html_url: string;
  };
}

const DesignView = () => {
  const [query, setQuery] = useState("");
  const [shots, setShots] = useState<DribbbleShot[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/design/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch designs");
      }
      const data = await response.json();
      setShots(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch design inspiration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-background p-6 overflow-hidden">
      <div className="max-w-5xl mx-auto w-full flex flex-col h-full">
        <div className="mb-8 text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Design Inspiration</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find the perfect design ideas for your next project. Powered by Dribbble.
          </p>
          
          <form onSubmit={handleSearch} className="flex w-full max-w-lg mx-auto items-center space-x-2 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search for UI, mobile apps, branding..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {shots.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>Enter a keyword to start exploring designs</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
              {shots.map((shot) => (
                <Card key={shot.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={shot.images.normal}
                      alt={shot.title}
                      className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                      <a
                        href={shot.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white rounded-full text-black hover:bg-gray-200 transition-colors"
                        title="View on Dribbble"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate mb-2" title={shot.title}>
                      {shot.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <a 
                        href={shot.user.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <img 
                          src={shot.user.avatar_url} 
                          alt={shot.user.name} 
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="truncate max-w-[120px]">{shot.user.name}</span>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesignView;
