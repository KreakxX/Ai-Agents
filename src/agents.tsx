import type React from "react";
import { useEffect, useState } from "react";
import { Search, Plus, Minus, Bot, Star, Code, StepBack } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInput,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  downloads: string;
  tags: string[];
  icon: React.ReactNode;
  isInstalled: boolean;
  featured?: boolean;
  model?: string;
}

const aiAgents: AIAgent[] = [
  {
    id: "1",
    name: "TinyLlama",
    description:
      "Kompaktes Llama3-Modell für schnelle und ressourcensparende Aufgaben.",
    category: "Development",
    rating: 4.3,
    downloads: "2.1K",
    tags: ["Llama", "Tiny", "Efficient"],
    icon: <Bot className="h-5 w-5" />,
    isInstalled: false,
    featured: false,
    model: "tinyllama:latest",
  },
  {
    id: "2",
    name: "DeepSeek Coder",
    description:
      "Leistungsstarkes Coding-Modell für komplexe Programmieraufgaben.",
    category: "Development",
    rating: 4.7,
    downloads: "3.8K",
    tags: ["Coding", "DeepSeek", "AI"],
    icon: <Code className="h-5 w-5" />,
    isInstalled: false,
    featured: false,
    model: "deepseek-coder:latest",
  },
  {
    id: "3",
    name: "Qwen2.5-Coder 0.5B",
    description:
      "Kleines, effizientes Qwen2.5-Modell für Coding-Aufgaben und schnelle Inferenz.",
    category: "Development",
    rating: 4.1,
    downloads: "1.2K",
    tags: ["Qwen", "Coding", "Efficient"],
    icon: <Code className="h-5 w-5" />,
    isInstalled: false,
    featured: false,
    model: "qwen2.5-coder:0.5b",
  },
];

const categories = [
  "All",
  "Development",
  "Creative",
  "Communication",
  "Analytics",
  "Productivity",
];

async function fetchInstalledModels(): Promise<string[]> {
  const res = await fetch("http://localhost:11434/api/tags");
  const data = await res.json();
  return data.models.map((m: any) => m.name);
}

export default function Market() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [agents, setAgents] = useState<AIAgent[]>(aiAgents);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInstalledModels().then((models) => {
      setAgents((prev) =>
        prev.map((agent) =>
          agent.model
            ? { ...agent, isInstalled: models.includes(agent.model) }
            : agent
        )
      );
    });
  }, []);

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory =
      selectedCategory === "All" || agent.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredAgents = filteredAgents.filter((agent) => agent.featured);
  const regularAgents = filteredAgents.filter((agent) => !agent.featured);

  const handleToggleAgent = async (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent || !agent.model) {
      setAgents((prev) =>
        prev.map((agent) =>
          agent.id === agentId
            ? { ...agent, isInstalled: !agent.isInstalled }
            : agent
        )
      );
      return;
    }

    if (!agent.isInstalled) {
      await fetch("http://localhost:11434/api/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: agent.model }),
      });
    } else {
      await fetch("http://localhost:11434/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: agent.model }),
      });
    }

    const models = await fetchInstalledModels();
    setAgents((prev) =>
      prev.map((agent) =>
        agent.model
          ? { ...agent, isInstalled: models.includes(agent.model) }
          : agent
      )
    );
  };

  return (
    <div className="h-screen w-full bg-transparent">
      <SidebarProvider defaultOpen>
        <div className="flex h-full w-full">
          <Sidebar className="w-60 md:w-60 border-r border-white/10 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0 backdrop-blur-xl bg-black/30">
              <SidebarHeader className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="flex items-center justify-between p-4">
                  <h2 className="text-xl font-semibold text-white">
                    AI Market
                  </h2>
                  <Button
                    onClick={() => {
                      if (location.pathname === "/agents") {
                        navigate("/");
                      } else {
                        navigate("/agents");
                      }
                    }}
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                  >
                    <StepBack className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative px-4 pb-4">
                  <Search className="absolute left-6 top-4 h-4 w-4 -translate-y-1/2 text-white/60" />
                  <SidebarInput
                    placeholder="Search agents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
                  />
                </div>
              </SidebarHeader>

              <SidebarContent className="bg-transparent flex-1 flex flex-col min-h-0">
                <SidebarGroup>
                  <SidebarGroupLabel className="text-white/80 px-4 py-2">
                    Categories
                  </SidebarGroupLabel>
                  <SidebarGroupContent className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 h-full bg-transparent">
                      <SidebarMenu className="px-2 mb-10">
                        {categories.map((category) => (
                          <SidebarMenuItem
                            key={category}
                            className="mb-1 flex items-center"
                          >
                            <SidebarMenuButton
                              onClick={() => setSelectedCategory(category)}
                              isActive={selectedCategory === category}
                              className={cn(
                                "group relative w-full justify-start p-4 h-auto rounded-lg transition-all",
                                "hover:bg-white/10 text-white/90 hover:text-white backdrop-blur-sm",
                                "data-[active=true]:bg-white/20 data-[active=true]:text-white data-[active=true]:backdrop-blur-md"
                              )}
                            >
                              <Bot className="h-5 w-5 shrink-0" />
                              <div className="flex-1 min-w-0 ml-3 flex items-center gap-2">
                                <div className="text-sm font-medium truncate">
                                  {category}
                                </div>
                              </div>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenu>
                    </ScrollArea>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </div>
          </Sidebar>

          <SidebarInset className="flex-1">
            <div className="flex flex-col min-h-screen">
              <div className="border-b border-white/10 backdrop-blur-xl bg-white/5 p-6">
                <h1 className="text-2xl font-bold text-white">
                  AI Agent Marketplace
                </h1>
                <p className="text-white/60 mt-1">
                  Discover and install powerful AI agents for your workflow
                </p>
              </div>

              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-8">
                    {featuredAgents.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <Star className="h-5 w-5 text-yellow-400" />
                          <h2 className="text-xl font-semibold text-white">
                            Featured Agents
                          </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {featuredAgents.map((agent) => (
                            <AgentCard
                              key={agent.id}
                              agent={agent}
                              onToggle={() => handleToggleAgent(agent.id)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h2 className="text-xl font-semibold text-white mb-4">
                        {selectedCategory === "All"
                          ? "All Agents"
                          : `${selectedCategory} Agents`}
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {regularAgents.map((agent) => (
                          <AgentCard
                            key={agent.id}
                            agent={agent}
                            onToggle={() => handleToggleAgent(agent.id)}
                          />
                        ))}
                      </div>
                    </div>

                    {filteredAgents.length === 0 && (
                      <div className="text-center py-12">
                        <Bot className="h-16 w-16 mx-auto mb-4 text-white/30" />
                        <p className="text-xl text-white/60">No agents found</p>
                        <p className="text-white/40 mt-2">
                          Try adjusting your search or category filter
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}

interface AgentCardProps {
  agent: AIAgent;
  onToggle: () => void;
}

function AgentCard({ agent, onToggle }: AgentCardProps) {
  return (
    <Card className="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-white/20 text-white border border-white/20">
                {agent.icon}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                {agent.name}
                {agent.featured && (
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                )}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-white/70">{agent.rating}</span>
                </div>
                <span className="text-xs text-white/50">•</span>
                <span className="text-xs text-white/70">
                  {agent.downloads} downloads
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-white/70 text-sm mb-4 line-clamp-3">
          {agent.description}
        </CardDescription>

        <div className="flex flex-wrap gap-1 mb-4">
          {agent.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-white/10 text-white/80 border-white/20 text-xs"
            >
              {tag}
            </Badge>
          ))}
          {agent.tags.length > 3 && (
            <Badge
              variant="secondary"
              className="bg-white/10 text-white/80 border-white/20 text-xs"
            >
              +{agent.tags.length - 3}
            </Badge>
          )}
        </div>

        <Button
          onClick={onToggle}
          className={`w-full ${
            agent.isInstalled
              ? "bg-red-500/80 hover:bg-red-600/80 text-white"
              : "bg-blue-500/80 hover:bg-blue-600/80 text-white"
          } backdrop-blur-sm transition-colors`}
        >
          {agent.isInstalled ? (
            <>
              <Minus className="h-4 w-4 mr-2" />
              Remove Agent
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Agent
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
