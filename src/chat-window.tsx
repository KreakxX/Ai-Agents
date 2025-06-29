"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  MessageSquare,
  Zap,
  ZapOff,
  MoreVertical,
  Download,
  Trash2,
  Paperclip,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { open } from "@tauri-apps/plugin-dialog";

import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
// @ts-ignore
import Highlight from "react-highlight";
import "highlight.js/styles/github-dark.css";
import { Label } from "./components/ui/label";
import { Switch } from "./components/ui/switch";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import MessageList from "./MessageList";

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

export const ChatWindow = React.memo(function ChatWindow({
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

  const selectFile = async () => {
    const selected = await open({
      multiple: false,
      filters: [
        { name: "Code files", extensions: ["ts", "js", "py", "txt", "tsx"] },
      ],
    });

    console.log(selected);
    const content = await readTextFile(selected || "");
    console.log(content);
  };

  const replaceByLineRange = (
    code: string,
    startLine: number,
    endLine: number,
    newCode: string
  ) => {
    const lines = code.split("\n");

    const before = lines.slice(0, startLine - 1);
    const after = lines.slice(endLine);
    const newLines = newCode.split("\n");

    return [...before, ...newLines, ...after].join("\n");
  };

  // Zeilen finden und dann gucken ob das geht und ansonsten halt mal gucken

  // const smartReplace = (
  //   originalCode: string,
  //   oldCodeSnippet: string,
  //   newCodeSnippet: string
  // ) => {
  //   // Normalisiere Whitespace für bessere Matches
  //   const normalize = (code: string) =>
  //     code
  //       .replace(/\s+/g, " ") // Mehrere Leerzeichen zu einem
  //       .replace(/\s*{\s*/g, " { ") // Spaces um geschweifte Klammern
  //       .replace(/\s*}\s*/g, " } ")
  //       .replace(/\s*;\s*/g, "; ") // Spaces um Semikolons
  //       .trim();

  //   const normalizedOriginal = normalize(originalCode);
  //   const normalizedOld = normalize(oldCodeSnippet);

  //   // Prüfe ob der alte Code im Original vorhanden ist
  //   if (!normalizedOriginal.includes(normalizedOld)) {
  //     // Fallback: Versuche direkten Match ohne Normalisierung
  //     if (originalCode.includes(oldCodeSnippet.trim())) {
  //       return originalCode.replace(oldCodeSnippet.trim(), newCodeSnippet);
  //     }

  //     throw new Error(
  //       `Code-Snippet nicht gefunden!\n\nSuchtext: ${oldCodeSnippet.substring(
  //         0,
  //         100
  //       )}...`
  //     );
  //   }
  //   const createFlexiblePattern = (code: string) => {
  //     return code
  //       .replace(/[.*+?^${}()|[\]\\]/g, "\\$&") // Escape special chars
  //       .replace(/\s+/g, "\\s*") // Flexible whitespace
  //       .replace(/\\\{/g, "\\s*\\{\\s*") // Flexible braces
  //       .replace(/\\\}/g, "\\s*\\}\\s*")
  //       .replace(/\\\;/g, "\\s*;\\s*"); // Flexible semicolons
  //   };

  //   const flexiblePattern = createFlexiblePattern(oldCodeSnippet);
  //   const regex = new RegExp(flexiblePattern, "gs");

  //   const result = originalCode.replace(regex, newCodeSnippet);

  //   if (result === originalCode) {
  //     throw new Error("Keine Änderungen durchgeführt - Pattern nicht gefunden");
  //   }

  //   return result;
  // };

  const writeFile = async (content: string, filePath: string) => {
    await writeTextFile(filePath, content, {});
    // patch ding angucekn babel für TS und JS
    // Treesitter für alle aber deutlich komplizierter
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

            <div className="relative">
              <Button
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={selectFile}
              >
                <Workflow className="h-4 w-4"></Workflow>
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

      <MessageList
        messages={messages}
        chat={chat}
        copyToClipboard={copyToClipboard}
        copied={copied}
        typing={typing}
        messagesEndRef={messagesEndRef}
      ></MessageList>

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
});
