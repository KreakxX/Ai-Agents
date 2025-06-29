declare global {
  interface Window {
    __TAURI__?: any;
  }
}
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { useState } from "react";
import { ChatSidebar } from "src/chat-sidebar";
import { ChatWindow } from "src/chat-window";
import { invoke } from "@tauri-apps/api/core";
import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
const getFetch = () => {
  const isDev =
    window.location.port === "3000" || window.location.hostname === "localhost";

  if (isDev) {
    return fetch;
  } else {
    return tauriFetch;
  }
};
import { SidebarProvider } from "@/components/ui/sidebar";
import Agents from "./agents";

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

const initialChats: Chat[] = [
  {
    id: "1",
    title: "TinyLlama",
    lastMessage: "How can I help you today?",
    timestamp: "2 min ago",
    unreadCount: 1,
    icon: new URL("./assets/ollama.png", import.meta.url).href,
  },
  {
    id: "2",
    title: "SDXL",
    lastMessage: "Let me help you with that React component",
    timestamp: "1 hour ago",
    icon: new URL("./assets/Stability.png", import.meta.url).href,
  },
  {
    id: "3",
    title: "Deepseek",
    lastMessage: "That's a great story idea! Let's develop it further.",
    timestamp: "3 hours ago",
    icon: new URL("./assets/Deepseek.png", import.meta.url).href,
  },
  {
    id: "4",
    title: "TTS",
    lastMessage: "That's a great story idea! Let's develop it further.",
    timestamp: "3 hours ago",
    icon: new URL("./assets/XTTS.jpg", import.meta.url).href,
  },
];

const initialMessages: Record<string, Message[]> = {};

export default function ChatApp() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChat, setActiveChat] = useState<string>("1");
  const [loading, setLoading] = useState<boolean>(false);
  const [typing, setTyping] = useState<boolean>(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [messages, setMessages] =
    useState<Record<string, Message[]>>(initialMessages);

  const addNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      lastMessage: "Start a conversation...",
      timestamp: "now",
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChat(newChat.id);
    setMessages((prev) => ({
      ...prev,
      [newChat.id]: [],
    }));
  };

  const sendMessage = async (content: string) => {
    try {
      const newMessage: Message = {
        id: Date.now().toString(),
        content,
        sender: "user",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => ({
        ...prev,
        [activeChat]: [...(prev[activeChat] || []), newMessage],
      }));

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChat
            ? { ...chat, lastMessage: content, timestamp: "now" }
            : chat
        )
      );

      let Chat = "";

      chats.forEach((chat) => {
        if (chat.id == activeChat) {
          Chat = chat.title;
        }
      });

      if (Chat == "Deepseek") {
        try {
          setTyping(true);
          const fetchFn = getFetch();
          console.log("Making request to Deepseek with:", {
            model: "deepseek-coder:6.7b",
            prompt: content,
          });

          // const chatMessages = messages[activeChat] || [];
          // const systemPrompt =
          //   "<|system|>\nYou are a helpful coding assistant.";
          // const formattedMessages = chatMessages
          //   .map((msg) =>
          //     msg.sender === "user"
          //       ? `<|user|>\n${msg.content}`
          //       : `<|assistant|>\n${msg.content}`
          //   )
          //   .join("\n");
          //  prompt = `${systemPrompt}\n${formattedMessages}\n<|user|>\n${content}\n<|assistant|>\n`;

          const response = await fetchFn(
            "http://localhost:11434/api/generate",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Origin: "",
              },
              body: JSON.stringify({
                model: "deepseek-coder:6.7b",
                prompt: content,
                stream: false,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const json = await response.json();
          console.log("Response JSON:", json);

          const responseText = json.response;

          if (!responseText) {
            throw new Error("No response text received from API");
          }

          const newAnswer: Message = {
            id: Date.now().toString(),
            content: responseText,
            sender: "assistant",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };

          setMessages((prev) => ({
            ...prev,
            [activeChat]: [...(prev[activeChat] || []), newAnswer],
          }));

          setChats((prev) =>
            prev.map((chat) =>
              chat.id === activeChat
                ? { ...chat, lastMessage: responseText, timestamp: "now" }
                : chat
            )
          );
        } catch (error) {
          // Für HTTP-Fehler (response vorhanden)
          if (error && typeof error === "object" && "status" in error) {
            setMessages((prev) => ({
              ...prev,
              [activeChat]: [
                ...(prev[activeChat] || []),
                {
                  id: Date.now().toString(),
                  content: `HTTP-Fehler: ${error.status} ${
                    "statusText" in error ? (error as any).statusText || "" : ""
                  }`,
                  sender: "assistant",
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ],
            }));
          } else {
            // Für Netzwerkfehler oder andere Fehler

            setMessages((prev) => ({
              ...prev,
              [activeChat]: [
                ...(prev[activeChat] || []),
                {
                  id: Date.now().toString(),
                  content: `Fehler: ${
                    error instanceof Error
                      ? error.message
                      : JSON.stringify(error)
                  }`,
                  sender: "assistant",
                  timestamp: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ],
            }));
          }
        } finally {
          setTyping(false);
        }
      } else if (Chat == "SDXL") {
        try {
          setTyping(true);
          setLoading(true);
          invoke("generate_image", { prompt: content })
            .then((result) => {
              const newAnswer: Message = {
                id: Date.now().toString(),
                content: "",
                sender: "assistant",
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                image: result ? String(result) : "",
              };
              setMessages((prev) => ({
                ...prev,
                [activeChat]: [...(prev[activeChat] || []), newAnswer],
              }));
              setChats((prev) =>
                prev.map((chat) =>
                  chat.id === activeChat
                    ? { ...chat, lastMessage: "Image Done", timestamp: "now" }
                    : chat
                )
              );
            })
            .catch((error) => {
              console.error("Error generating image:", error);
            })
            .finally(() => {
              setLoading(false);
              setTyping(false);
            });
        } catch (error) {
          console.error("Error generating image:", error);
        }
      } else if (Chat == "TTS") {
        try {
          setTyping(true);
          setLoading(true);
          invoke("generate_audio", {
            text: content,
            speaker: "Damien Black",
            language: "en",
          })
            .then((result) => {
              const newAnswer: Message = {
                id: Date.now().toString(),
                content: "",
                sender: "assistant",
                timestamp: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                audio: result ? String(result) : "",
              };
              setMessages((prev) => ({
                ...prev,
                [activeChat]: [...(prev[activeChat] || []), newAnswer],
              }));
              setChats((prev) =>
                prev.map((chat) =>
                  chat.id === activeChat
                    ? { ...chat, lastMessage: "Image Done", timestamp: "now" }
                    : chat
                )
              );
            })
            .catch((error) => {
              console.error("Error generating image:", error);
            })
            .finally(() => {
              setLoading(false);
              setTyping(false);
            });
        } catch (error) {
          console.error("Error generating image:", error);
        }
      } else {
        try {
          setTyping(true);
          const fetchFn = getFetch();
          console.log("Making request to TinyLlama with:", {
            model: "tinyllama",
            prompt: content,
          });

          const chatMessages = messages[activeChat] || [];
          const formattedHistory = chatMessages
            .map(
              (msg) =>
                `${msg.sender === "user" ? "User" : "Assistant"}: ${
                  msg.content
                }`
            )
            .join("\n");

          const prompt = formattedHistory + `\nUser: ${content}\nAssistant:`;

          const response = await fetchFn(
            "http://localhost:11434/api/generate",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Origin: "",
              },
              body: JSON.stringify({
                model: "tinyllama",
                prompt: prompt,
                stream: false,
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const json = await response.json();

          const responseText = json.response;

          if (!responseText) {
            throw new Error("No response text received from TinyLlama API");
          }

          const newAnswer: Message = {
            id: Date.now().toString(),
            content: responseText,
            sender: "assistant",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };

          setMessages((prev) => ({
            ...prev,
            [activeChat]: [...(prev[activeChat] || []), newAnswer],
          }));

          setChats((prev) =>
            prev.map((chat) =>
              chat.id === activeChat
                ? { ...chat, lastMessage: responseText, timestamp: "now" }
                : chat
            )
          );
        } catch (error) {
          console.error("TinyLlama API Error:", error);

          // Add error message to chat
          const errorMessage: Message = {
            id: Date.now().toString(),
            content: `Error: ${
              error instanceof Error ? error.message : "Unknown error occurred"
            }`,
            sender: "assistant",
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };

          setMessages((prev) => ({
            ...prev,
            [activeChat]: [...(prev[activeChat] || []), errorMessage],
          }));
        } finally {
          setTyping(false);
        }
      }
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      setTyping(false);
    }
  };

  const deleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((chat) => chat.id !== chatId));
    if (activeChat === chatId) {
      const remainingChats = chats.filter((chat) => chat.id !== chatId);
      setActiveChat(remainingChats.length > 0 ? remainingChats[0].id : "");
    }
    setMessages((prev) => {
      const newMessages = { ...prev };
      delete newMessages[chatId];
      return newMessages;
    });
  };

  const renameChat = (chatId: string, newTitle: string) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    );
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="h-screen w-full bg-transparent">
              <SidebarProvider defaultOpen>
                <div className="flex h-full w-full">
                  <ChatSidebar
                    chats={chats}
                    activeChat={activeChat}
                    onChatSelect={setActiveChat}
                    onAddChat={addNewChat}
                    onDeleteChat={deleteChat}
                    onRenameChat={renameChat}
                  />
                  <div className="flex-1 relative">
                    <ChatWindow
                      chat={chats.find((c) => c.id === activeChat)}
                      messages={messages[activeChat] || []}
                      onSendMessage={sendMessage}
                      loading={loading}
                      typing={typing}
                    />
                  </div>
                </div>
              </SidebarProvider>
            </div>
          }
        />
        <Route path="/agents" element={<Agents />} />
      </Routes>
    </Router>
  );
}
