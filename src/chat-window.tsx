"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  MessageSquare,
  MoreVertical,
  Download,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import "highlight.js/styles/github-dark.css";
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
  const messagesEndRef = useRef<HTMLDivElement>(null!);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const [copied, setCopied] = useState(false);

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
    <div className="relative h-screen w-full">
      {/* Fixed Header */}
      <div className="absolute top-0 left-0 right-0 z-10 border-b border-white/10 backdrop-blur-xl bg-white/5 p-6 ">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex justify-between items-center">
              {chat.icon ? (
                <img
                  src={chat.icon || "/placeholder.svg"}
                  className="h-8 w-8 rounded-full mr-3"
                  alt="Chat icon"
                />
              ) : (
                <Bot />
              )}
              <h3 className="text-xl font-semibold text-white">{chat.title}</h3>
            </div>
            <div className="flex items-center gap-2 w-fit mt-2">
              <div className="rounded-full h-4 w-4 bg-green-400"></div>
              <p className="text-sm text-white/60">Online • Ready to help</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
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
              <DropdownMenuContent
                align="end"
                className="bg-black/90 backdrop-blur-xl border-white/20 text-white z-[9999]"
                sideOffset={5}
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
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* MessageList - positioned between header and input */}
      <div className="absolute top-30 bottom-32 left-0 right-0">
        <MessageList
          messages={messages}
          chat={chat}
          copyToClipboard={copyToClipboard}
          copied={copied}
          typing={typing}
          messagesEndRef={messagesEndRef}
        />
      </div>

      {/* Fixed Input */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 backdrop-blur-xl bg-white/5 p-6">
        <div className="flex gap-2 sm:gap-4 w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
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
