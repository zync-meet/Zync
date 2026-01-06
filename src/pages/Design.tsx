import React, { useState } from "react";
import DesignGallery from "@/components/DesignGallery";
import Navbar from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function Design() {
  const [query, setQuery] = useState("web design");
  const [inputValue, setInputValue] = useState("web design");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setQuery(inputValue.trim());
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto py-8 space-y-8 px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight">Design Inspiration</h1>
          <p className="text-muted-foreground text-lg">
            Find the perfect design ideas for your next project. Powered by Dribbble.
          </p>
          
          <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2 pt-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search designs..."
                className="pl-9 w-full"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>

        <DesignGallery query={query} />
      </main>
    </div>
  );
}
