"use client";

import type React from "react";
import { memo, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ScrollArea } from "./components/ui/scroll-area";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { cn } from "./lib/utils";
import { Bot, Check, Copy, User } from "lucide-react";
import { Button } from "./components/ui/button";
// @ts-ignore
import Highlight from "react-highlight";
import "highlight.js/styles/github-dark.css";

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

interface MessageListProps {
  messages: Message[];
  chat: Chat;
  copyToClipboard: (value: string) => void;
  typing: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  copied: boolean;
}

const MessageItem = memo(
  ({
    message,
    chat,
    copyToClipboard,
    copied,
  }: {
    message: Message;
    chat: Chat;
    copyToClipboard: (value: string) => void;
    copied: boolean;
  }) => {
    const contentParts = useMemo(() => {
      const codeBlocks = Array.from(
        message.content.matchAll(/```(?:\w*\n)?([\s\S]*?)```/g)
      ).map((m) => m[1].trim());
      const splitParts = message.content.split(/```(?:\w*\n)?[\s\S]*?```/g);
      const parts: { type: "text" | "code"; value: string }[] = [];
      splitParts.forEach((part, i) => {
        if (part.trim()) parts.push({ type: "text", value: part.trim() });
        if (codeBlocks[i]) parts.push({ type: "code", value: codeBlocks[i] });
      });
      return parts;
    }, [message.content]);

    const audioPath = useMemo(() => {
      if (!message.audio) return "";
      return (
        message.audio
          .split("\n")
          .find((line) => line.trim().startsWith("/generated/"))
          ?.trim() || ""
      );
    }, [message.audio]);

    return (
      <div
        className={cn(
          "flex gap-4 max-w-[85%] ",
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
                src={chat.icon || "/placeholder.svg"}
                className="h-8 w-8 rounded-full"
                alt="Chat icon"
              />
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
              src={message.image || "/placeholder.svg"}
              alt=""
            />
          )}
          {message.audio && (
            <audio controls preload="metadata">
              {" "}
              <source src={audioPath} type="audio/wav" />
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
                <p className="text-base leading-relaxed">{part.value}</p>
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
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.copied === nextProps.copied &&
      prevProps.chat.icon === nextProps.chat.icon
    );
  }
);

const MessageList = memo(function MessageList({
  messages,
  chat,
  copyToClipboard,
  typing,
  messagesEndRef,
  copied,
}: MessageListProps) {
  const [visibleStartIndex, setVisibleStartIndex] = useState(() =>
    Math.max(0, messages.length - 50)
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isAutoScrolling = useRef(false);

  const visibleMessages = useMemo(
    () => messages.slice(visibleStartIndex),
    [messages, visibleStartIndex]
  );

  const loadMoreMessages = useCallback(() => {
    if (isLoadingMore || visibleStartIndex <= 0) return;

    setIsLoadingMore(true);
    setTimeout(() => {
      const newStartIndex = Math.max(0, visibleStartIndex - 25);
      setVisibleStartIndex(newStartIndex);
      setIsLoadingMore(false);
    }, 100);
  }, [visibleStartIndex, isLoadingMore]);

  useEffect(() => {
    if (!topSentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isAutoScrolling.current) {
          loadMoreMessages();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px 0px 0px 0px",
      }
    );

    observerRef.current.observe(topSentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreMessages]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isAutoScrolling.current) return;

    const target = e.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;

    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setHasScrolledToBottom(isAtBottom);
  }, []);

  useEffect(() => {
    if (!hasScrolledToBottom || !messagesEndRef.current) return;

    isAutoScrolling.current = true;
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
      setTimeout(() => {
        isAutoScrolling.current = false;
      }, 500);
    });
  }, [messages.length, hasScrolledToBottom]);

  const hasMoreMessages = visibleStartIndex > 0;

  return (
    <div className="h-full overflow-hidden">
      <ScrollArea className="h-full " onScrollCapture={handleScroll}>
        <div
          ref={containerRef}
          className="px-2 sm:px-4 md:px-8 py-4 space-y-4 sm:space-y-6 w-full max-w-full md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto"
        >
          {hasMoreMessages && (
            <div
              ref={topSentinelRef}
              className="h-1 w-full"
              style={{ marginTop: "-1px" }}
            />
          )}
          {hasMoreMessages && !isLoadingMore && (
            <div className="flex justify-center py-4">
              <button
                onClick={loadMoreMessages}
                className="px-4 py-2 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Load {Math.min(25, visibleStartIndex)} earlier messages
              </button>
            </div>
          )}

          {visibleMessages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              chat={chat}
              copyToClipboard={copyToClipboard}
              copied={copied}
            />
          ))}

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
  );
});

MessageItem.displayName = "MessageItem";

export default MessageList;
