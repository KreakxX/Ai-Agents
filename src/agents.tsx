import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInput,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
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
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon?: string;
}

const aiAgents: AIAgent[] = [
  {
    id: "1",
    name: "Coding Low",
    description: "Lightweight coding agent for simple tasks.",
    category: "Development",
    tags: ["Coding", "Low"],
    icon: "./assets/ollama.png",
  },
  {
    id: "2",
    name: "Coding High",
    description: "Powerful coding agent for complex tasks.",
    category: "Development",
    tags: ["Coding", "High"],
    icon: "./assets/ollama.png",
  },
  {
    id: "3",
    name: "Image Gen",
    description: "AI-powered image generation.",
    category: "Creative",
    tags: ["Image", "Generation"],
    icon: "./assets/ollama.png",
  },
  {
    id: "4",
    name: "Voice Gen",
    description: "AI-powered voice generation.",
    category: "Creative",
    tags: ["Voice", "Generation"],
    icon: "./assets/ollama.png",
  },
];

const categories = ["All", "Development", "Creative"];

export default function Market() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full bg-transparent">
      <SidebarProvider defaultOpen>
        <div className="flex h-full w-full">
          <Sidebar className="w-60 md:w-64 border-r border-white/10 flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0 backdrop-blur-xl bg-black/30">
              <SidebarHeader className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
                <div className="flex items-center justify-between p-4">
                  <h2 className="text-xl font-semibold text-white">
                    Categories
                  </h2>
                  <Button
                    onClick={() => navigate("/")}
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative px-4 pb-4">
                  <Search className="absolute left-6 top-4 h-4 w-4 -translate-y-1/2 text-white/60" />
                  <SidebarInput
                    placeholder="Search categories..."
                    className="pl-10 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
                    disabled
                  />
                </div>
              </SidebarHeader>
              <SidebarContent className="bg-transparent flex-1 flex flex-col min-h-0">
                <SidebarGroup>
                  <SidebarGroupLabel className="text-white/80 px-4 py-2">
                    Categories
                  </SidebarGroupLabel>
                  <SidebarGroupContent className="flex-1 flex flex-col min-h-0">
                    <ScrollArea className="flex-1 h-full bg-transparent [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      <SidebarMenu className="px-2 mb-10">
                        {categories.map((category) => (
                          <SidebarMenuItem
                            key={category}
                            className="mb-1 flex items-center"
                          >
                            <div className="group relative w-full justify-start p-4 h-auto rounded-lg transition-all hover:bg-white/10 text-white/90 hover:text-white backdrop-blur-sm">
                              <div className="flex-1 min-w-0 ml-0 flex items-center gap-2">
                                <div className="text-sm font-medium truncate">
                                  {category}
                                </div>
                              </div>
                            </div>
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
                    <div>
                      <h2 className="text-xl font-semibold text-white mb-4">
                        All Agents
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {aiAgents.map((agent) => (
                          <AgentCard key={agent.id} agent={agent} />
                        ))}
                      </div>
                    </div>
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
}

function AgentCard({ agent }: AgentCardProps) {
  return (
    <Card className="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <img
                src={
                  agent.icon
                    ? new URL(agent.icon, import.meta.url).href
                    : "/assets/ollama.png"
                }
                alt="Agent Avatar"
                className="h-10 w-10 object-cover rounded-full"
              />
              <AvatarFallback className="bg-white/20 text-white border border-white/20" />
            </Avatar>
            <div>
              <CardTitle className="text-lg text-white flex items-center gap-2">
                {agent.name}
              </CardTitle>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-white/70 text-sm mb-4 line-clamp-3">
          {agent.description}
        </CardDescription>
        <div className="flex flex-wrap gap-1 mb-4">
          {agent.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-white/10 text-white/80 border-white/20 text-xs"
            >
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            className="bg-white/20 text-white hover:bg-white/30 border-0"
          >
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
