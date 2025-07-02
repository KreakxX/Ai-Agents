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
  huggingface?: boolean;

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
    title: "tinyllama",
    lastMessage: "",

    icon: new URL("./assets/ollama.png", import.meta.url).href,
  },
  {
    id: "2",
    title: "SDXL",
    lastMessage: "",

    icon: new URL("./assets/Stability.png", import.meta.url).href,
  },
  {
    id: "3",
    title: "deepseek-coder-v2:16b",
    lastMessage: "",

    icon: new URL("./assets/Deepseek.png", import.meta.url).href,
  },
  {
    id: "4",
    title: "TTS",
    lastMessage: "",
    icon: new URL("./assets/XTTS.jpg", import.meta.url).href,
  },
  {
    id: "5",
    title: "gemma:2b",
    lastMessage: "",

    icon: new URL("./assets/Gemma.jpg", import.meta.url).href,
  },
  // {
  //   id: "6",
  //   title: "Qwen/Qwen3-0.6B",
  //   lastMessage: "",
  //   huggingface: true,
  //   icon: new URL("./assets/Qwen.png", import.meta.url).href,
  // },
  // {
  //   id: "7",
  //   title: "Qwen/Qwen3-4B",
  //   lastMessage: "",
  //   huggingface: true,
  //   icon: new URL("./assets/Qwen.png", import.meta.url).href,
  // },
  {
    id: "9",
    title: "deepseek-coder-v2:16b",
    lastMessage: "",
    icon: new URL("./assets/deepseek.png", import.meta.url).href,
  },
  {
    id: "10",
    title: "codellama:13b",
    lastMessage: "",
    icon: new URL("./assets/ollama.png", import.meta.url).href,
  },
  {
    id: "12",
    title: "qwen2.5vl:7b",
    lastMessage: "",
    icon: new URL("./assets/Qwen.png", import.meta.url).href,
  },
];

interface model {
  name: string;
  systemprompt: string;
}

const chatModels: model[] = [
  { name: "tinyllama", systemprompt: "test" },
  { name: "deepseek-coder:6.7b", systemprompt: "test" },
  { name: "gemma:2b", systemprompt: "test" },
  { name: "deepseek-coder-v2:16b", systemprompt: "test" },
  { name: "codellama:13b", systemprompt: "test" },
];

const chatImageModels: model[] = [
  {
    name: "qwen2.5vl:7b",
    systemprompt: "und pack die Antwort in ```math und ende mit ```.",
  },
];

const initialMessages: Record<string, Message[]> = {};

export default function ChatApp() {
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [activeChat, setActiveChat] = useState<string>("1");
  const [loading, setLoading] = useState<boolean>(false);
  const [typing, setTyping] = useState<boolean>(false);

  const [messages, setMessages] =
    useState<Record<string, Message[]>>(initialMessages);

  const addNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Chat",
      lastMessage: "Start a conversation...",
    };
    setChats((prev) => [newChat, ...prev]);
    setActiveChat(newChat.id);
    setMessages((prev) => ({
      ...prev,
      [newChat.id]: [],
    }));
  };

  const generateTextResponse = async (
    modelName: string,
    systemPrompt: string,
    content: string,
    image?: string[]
  ) => {
    try {
      setTyping(true);
      const fetchFn = getFetch();

      // const chatMessages = messages[activeChat] || [];
      // const systemPrompt =
      //   "<|system|>\nYou are a helpful coding assistant.";
      // const formattedMessages = chatMessages
      //   .map((msg) =>                                        // für Kontext etc
      //     msg.sender === "user"
      //       ? `<|user|>\n${msg.content}`
      //       : `<|assistant|>\n${msg.content}`
      //   )
      //   .join("\n");
      //  prompt = `${systemPrompt}\n${formattedMessages}\n<|user|>\n${content}\n<|assistant|>\n`;

      let fullprompt = content + " " + systemPrompt;
      let response: Response;

      if (image) {
        response = await fetchFn("http://localhost:11434/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "",
          },
          body: JSON.stringify({
            model: modelName,
            prompt: fullprompt,
            stream: false,
            images: image,
          }),
        });
      } else {
        response = await fetchFn("http://localhost:11434/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: "",
          },
          body: JSON.stringify({
            model: modelName,
            prompt: fullprompt,
            stream: false,
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      const responseText = json.response;
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
      console.log(error);
    } finally {
      setTyping(false);
    }
  };

  const generateTextResponseHuggingFace = async (
    prompt: string,
    model_name: string
  ) => {
    try {
      setTyping(true);
      setLoading(true);
      invoke("generate_text", { prompt: prompt, modelName: model_name })
        .then((result) => {
          const newAnswer: Message = {
            id: Date.now().toString(),
            content: String(result),
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
  };

  const sendMessage = async (content: string, img?: string[]) => {
    const models = chatModels;

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

    if (Chat == "SDXL") {
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
      const currentModel = models.find((m) =>
        m.name.toLowerCase().includes(Chat.toLowerCase())
      );
      if (currentModel) {
        const chatModel = initialChats.find((m) =>
          m.title.toLowerCase().includes(Chat.toLowerCase())
        );

        if (chatModel?.huggingface) {
          generateTextResponseHuggingFace(content, chatModel.title);
        }

        generateTextResponse(
          currentModel.name,
          currentModel.systemprompt,
          content
        );
      } else {
        const currentModel = chatImageModels.find((m) =>
          m.name.toLowerCase().includes(Chat.toLowerCase())
        );
        if (!currentModel) {
          return;
        }

        generateTextResponse(
          currentModel.name,
          currentModel.systemprompt,
          content,
          img
        );
      }
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
