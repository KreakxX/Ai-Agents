"use client";

import { useState } from "react";
import {
  Plus,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Edit2,
  Search,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarInput,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "./components/ui/scroll-area";
import { useLocation, useNavigate } from "react-router-dom";

export interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  icon?: string;
}

interface ChatSidebarProps {
  chats: Chat[];
  activeChat: string;
  onChatSelect: (chatId: string) => void;
  onAddChat: () => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
}

export function ChatSidebar({
  chats,
  activeChat,
  onChatSelect,
  onDeleteChat,
  onRenameChat,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingChat, setEditingChat] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const filteredChats = chats.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRename = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      setEditingChat(chatId);
      setEditTitle(chat.title);
    }
  };

  const saveRename = () => {
    if (editingChat && editTitle.trim()) {
      onRenameChat(editingChat, editTitle.trim());
    }
    setEditingChat(null);
    setEditTitle("");
  };

  const cancelRename = () => {
    setEditingChat(null);
    setEditTitle("");
  };

  return (
    <Sidebar className="w-60 md:w-64 border-r border-white/10 flex flex-col min-h-0 ">
      <div className="flex-1 flex flex-col min-h-0 backdrop-blur-xl bg-black/30">
        <SidebarHeader className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-semibold text-white">Chats</h2>
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
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative px-4 pb-4">
            <Search className="absolute left-6 top-4 h-4 w-4 -translate-y-1/2 text-white/60" />
            <SidebarInput
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-transparent flex-1 flex flex-col min-h-0">
          <SidebarGroup>
            <SidebarGroupLabel className="text-white/80 px-4 py-2">
              Recent Chats
            </SidebarGroupLabel>
            <SidebarGroupContent className="flex-1 flex flex-col min-h-0">
              <ScrollArea className="flex-1 h-full bg-transparent">
                <SidebarMenu className="px-2 mb-10">
                  {filteredChats.map((chat) => (
                    <SidebarMenuItem
                      key={chat.id}
                      className="mb-1 flex items-center"
                    >
                      <SidebarMenuButton
                        onClick={() => onChatSelect(chat.id)}
                        isActive={activeChat === chat.id}
                        className={cn(
                          "group relative w-full justify-start p-4 h-auto rounded-lg transition-all",
                          "hover:bg-white/10 text-white/90 hover:text-white backdrop-blur-sm",
                          "data-[active=true]:bg-white/20 data-[active=true]:text-white data-[active=true]:backdrop-blur-md"
                        )}
                      >
                        {chat.icon ? (
                          <img
                            src={chat.icon}
                            className="h-8 w-8 rounded-full"
                          ></img>
                        ) : (
                          <MessageSquare className="h-5 w-5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0 ml-3 flex items-center gap-2">
                          {editingChat === chat.id ? (
                            <input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={saveRename}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveRename();
                                if (e.key === "Escape") cancelRename();
                              }}
                              className="w-full bg-transparent border-none outline-none text-sm font-medium"
                              autoFocus
                            />
                          ) : (
                            <>
                              <div className="text-sm font-medium truncate">
                                {chat.title}
                              </div>
                            </>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className="ml-2 p-2 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
                              tabIndex={0}
                              aria-label="Open chat menu"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            side="left"
                            align="start"
                            className="bg-black/80 backdrop-blur-xl border-white/20 text-white z-[9999]"
                          >
                            <DropdownMenuItem
                              onClick={() => handleRename(chat.id)}
                              className="hover:bg-white/10"
                            >
                              <Edit2 className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onDeleteChat(chat.id)}
                              className="hover:bg-red-500/20 text-red-400"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
  );
}
