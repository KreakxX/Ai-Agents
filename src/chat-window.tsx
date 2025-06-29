"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  MessageSquare,
  Zap,
  ZapOff,
  MoreVertical,
  Settings,
  Download,
  Trash2,
  Check,
  Copy,
  Paperclip,
  FlipHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
// @ts-ignore
import Highlight from "react-highlight";
import "highlight.js/styles/github-dark.css";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";

export interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  icon?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: string;
  image?: string;
  audio?: string;
}

interface ChatWindowProps {
  chat?: Chat;
  messages: Message[];
  onSendMessage: (content: string) => void;
  loading?: boolean;
  typing: boolean;
}

export function ChatWindow({
  chat,
  messages,
  onSendMessage,
  loading,
  typing,
}: ChatWindowProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [copied, setCopied] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [agentMode, setAgentMode] = useState<boolean>(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white/60 backdrop-blur-sm bg-white/5 p-8 rounded-2xl">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen ">
      {/* Chat Header */}
      <div className="border-b border-white/10 backdrop-blur-xl bg-white/5 p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex justiy-between items-center">
              {chat.icon ? (
                <img
                  src={chat.icon}
                  className="h-8 w-8 rounded-full mr-3"
                ></img>
              ) : (
                <Bot></Bot>
              )}
              <h3 className="text-xl font-semibold text-white">{chat.title}</h3>
            </div>
            <div className="flex items-center gap-2 w-fit mt-2">
              <div className="rounded-full h-4 w-4 bg-green-400 "></div>
              <p className="text-sm text-white/60 ">Online • Ready to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="file"
                multiple
                accept=".txt,.md,.json,.csv,.png,.jpg"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="context-upload"
              />
              <Button
                size="sm"
                variant="ghost"
                className="text-white/70 hover:text-white hover:bg-white/10"
                title="Upload context files"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            {chat.title === "Deepseek" && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/10">
                <Label htmlFor="agent-mode" className="text-sm text-white/80">
                  Agent Mode
                </Label>
                <Switch
                  id="agent-mode"
                  checked={agentMode}
                  onCheckedChange={() => {
                    setAgentMode(!agentMode);
                  }}
                  className="data-[state=checked]:bg-blue-500 bg-white/10 "
                />
                {agentMode ? (
                  <Zap className="h-4 w-4 text-blue-400" />
                ) : (
                  <ZapOff className="h-4 w-4 text-white/50" />
                )}
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-2 p-2 rounded hover:bg-white/10 text-white/60 hover:text-white transition"
                  tabIndex={0}
                  aria-label="Open chat menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <div>
                <DropdownMenuContent
                  align="end"
                  className="bg-black/90 backdrop-blur-xl border-white/20 text-white z-[9999]"
                  sideOffset={5}
                  style={{ zIndex: 9999 }}
                >
                  <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    Export Chat
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem className="hover:bg-red-500/20 text-red-400 cursor-pointer">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </div>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Area - Large and spacious */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-2 sm:px-4 md:px-8 py-4 space-y-4 sm:space-y-6 w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
            {" "}
            {messages.map((message) => {
              const codeBlocks = Array.from(
                message.content.matchAll(/```(?:\w*\n)?([\s\S]*?)```/g)
              ).map((m) => m[1].trim());

              // Text in Teile splitten (zwischen den Codeblöcken)
              const splitParts = message.content.split(
                /```(?:\w*\n)?[\s\S]*?```/g
              );

              // Kombiniere Text- und Code-Teile abwechselnd
              const contentParts: { type: "text" | "code"; value: string }[] =
                [];
              splitParts.forEach((part, i) => {
                if (part.trim())
                  contentParts.push({ type: "text", value: part.trim() });
                if (codeBlocks[i])
                  contentParts.push({ type: "code", value: codeBlocks[i] });
              });
              const output = message.audio || "";
              const path =
                output
                  .split("\n")
                  .find((line) => line.trim().startsWith("/generated/"))
                  ?.trim() || "";
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex  gap-4 max-w-[85%]",
                    message.sender === "user" ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "backdrop-blur-sm",
                        message.sender === "user"
                          ? "bg-blue-500/80 text-white"
                          : "bg-white/20 text-white border border-white/20"
                      )}
                    >
                      {message.sender === "user" ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <img
                          src={chat.icon}
                          className="h-8 w-8 rounded-full"
                        ></img>
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      "flex flex-col gap-2",
                      message.sender === "user" ? "items-end" : "items-start"
                    )}
                  >
                    {message.image && (
                      <img
                        className="h-100 w-100 rounded-lg"
                        src={message.image}
                        alt=""
                      />
                    )}

                    {message.audio && (
                      <audio controls>
                        <source src={path} type="audio/wav" />
                        Dein Browser unterstützt das Audio-Element nicht.
                      </audio>
                    )}

                    {contentParts.map((part, idx) =>
                      part.type === "text" ? (
                        <div
                          key={idx}
                          className={cn(
                            "rounded-2xl px-3 sm:px-6 py-3 sm:py-4 break-words backdrop-blur-sm relative group/message",
                            "max-w-[80vw] sm:max-w-md md:max-w-lg",
                            message.sender === "user"
                              ? "bg-blue-500/80 text-white"
                              : "bg-white/10 text-white border border-white/20"
                          )}
                        >
                          <p className="text-base leading-relaxed">
                            {part.value}
                          </p>
                          <div className="absolute -top-2 -right-2 opacity-0 group-hover/message:opacity-100 transition-opacity flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white"
                              onClick={() => copyToClipboard(part.value)}
                            >
                              {copied ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div key={idx} className="relative group/code">
                          <Highlight className="rounded-2xl px-6 py-4 overflow-x-auto bg-black/80 text-white border border-white/20 font-mono text-sm max-w-[80vw] sm:max-w-md md:max-w-lg">
                            {part.value}
                          </Highlight>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 h-6 w-6 p-0 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover/code:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(part.value)}
                          >
                            {copied ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      )
                    )}
                    <span className="text-sm text-white/50 px-2">
                      {message.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="flex gap-4 max-w-[85%]">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="bg-white/20 text-white border border-white/20 backdrop-blur-sm">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 backdrop-blur-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 backdrop-blur-xl bg-white/5 p-6">
        <div className="flex gap-2 sm:gap-4 w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
          {" "}
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 min-h-[60px] max-h-40 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 resize-none text-base p-4 rounded-xl"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-blue-500/80 hover:bg-blue-600/80 text-white px-6 py-4 h-auto backdrop-blur-sm"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
