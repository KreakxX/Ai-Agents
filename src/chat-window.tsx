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
  Paperclip,
  X,
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
} from "@/components/ui/dropdown-menu";
import MessageList from "./MessageList";
import { invoke } from "@tauri-apps/api/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import katex from "katex";
import "katex/dist/katex.min.css";

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
  onSendMessage: (content: string, img?: string[]) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [image, setImage] = useState<string[]>([]);
  const [contextImage, setContextImage] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  const handleFileInput = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];

    if (file.type == "application/pdf") {
      console.log("test");
      const arrayBuffer = await file.arrayBuffer();
      console.log("step 1");
      const base64 = arrayBufferToBase64(arrayBuffer);
      console.log("step 2");
      const pngbase64: [] = await invoke("pdf_to_png", { pdfBase64: base64 });
      console.log("step 3");
      console.log("step 4");
      pngbase64.map((png) => {
        setImage((prev) => [...prev, png]);
        setContextImage((prev) => [...prev, `data:image/png;base64,${png}`]);
      });
      setFileName((prev) => [...prev, file.name]);
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const base64 = reader.result.split(",")[1];
          setImage((prev) => [...prev, base64 as string]);
          setContextImage((prev) => [
            ...prev,
            `data:image/png;base64,${base64}`,
          ]);
          setFileName((prev) => [...prev, file.name]);
        }
      };
    }
  };

  const removeImage = (index: number) => {
    setImage((prev) => prev.filter((_, i) => i !== index));
    setContextImage((prev) => prev.filter((_, i) => i !== index));
    setFileName((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
    if (input.trim() || image) {
      onSendMessage(input.trim(), image);
      setInput("");
      setImage([]);
      setContextImage([]);
      setFileName([]);
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
      <div className="absolute top-0 left-0 right-0 z-10 border-b border-white/10 backdrop-blur-xl bg-white/5 p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              {chat.icon ? (
                <img
                  src={chat.icon || "/placeholder.svg"}
                  className="h-8 w-8 rounded-full mr-3"
                  alt="Chat icon"
                />
              ) : (
                <Bot className="h-8 w-8 mr-3 text-white/80" />
              )}
              <h3 className="text-xl font-semibold text-white">{chat.title}</h3>
            </div>
            <div className="flex items-center gap-2 w-fit mt-2">
              <div className="rounded-full h-4 w-4 bg-green-400"></div>
              <p className="text-sm text-white/60">Online • Ready to help</p>
            </div>
          </div>

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

      {/* MessageList */}
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
        <div className="w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
          {/* Image Preview with ScrollArea */}
          {contextImage.length > 0 && (
            <div className="mb-4">
              <ScrollArea className="h-[100px] w-full rounded-lg border border-white/10">
                <div className="p-2 space-y-2">
                  {contextImage.map((image, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={image || "/placeholder.svg"}
                            alt="Preview"
                            className="w-16 h-16 rounded-lg object-cover border border-white/20"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
                            aria-label="Remove image"
                          >
                            <X className="h-3 w-3 text-white" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80 font-medium truncate">
                            {fileName[index]}
                          </p>
                          <p className="text-xs text-white/60 mt-1">
                            Image attached • Click X to remove
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Input Area */}
          <div className="relative bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden">
            <div className="flex items-end gap-2 p-2">
              {/* File Upload Button */}
              <div className="flex-shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInput}
                  className="hidden"
                  accept="image/*,application/pdf"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 p-0 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Attach image"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>

              {/* Text Input */}
              <div className="flex-1">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="min-h-[44px] max-h-32 bg-transparent border-0 text-white placeholder:text-white/60 resize-none text-base p-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                  rows={1}
                />
              </div>

              <div className="flex-shrink-0">
                <Button
                  onClick={handleSend}
                  disabled={(!input.trim() && !image) || loading}
                  size="sm"
                  className="h-10 w-10 p-0 bg-blue-500/80 hover:bg-blue-600/80 text-white backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-xs text-white/40"></p>
            {(input.length > 0 || image.length > 0) && (
              <p className="text-xs text-white/40">
                {input.length > 0 && `${input.length} characters`}
                {input.length > 0 && image.length > 0 && " • "}
                {image.length > 0 &&
                  `${image.length} image${
                    image.length > 1 ? "s" : ""
                  } attached`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

const MessageContent = ({ content }: { content: string }) => {
  const contentParts = JSON.parse(content);

  return (
    <div className="space-y-2">
      {contentParts.map((part: any, idx: number) =>
        part.type === "text" ? (
          <p key={idx} className="text-white text-base">
            {part.value}
          </p>
        ) : part.type === "code" ? (
          <pre key={idx} className="bg-black/80 p-4 rounded-lg overflow-x-auto">
            <code className="text-white text-sm">{part.value}</code>
          </pre>
        ) : part.type === "math" ? (
          <div
            key={idx}
            className="rounded-2xl px-4 py-3 bg-black/80 text-white text-base max-w-[80vw] sm:max-w-md md:max-w-lg overflow-x-auto"
            style={{ fontSize: "1.05rem" }} // Optional: noch kleiner machen
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part.value, {
                throwOnError: false,
                displayMode: true,
              }),
            }}
          />
        ) : null
      )}
    </div>
  );
};
