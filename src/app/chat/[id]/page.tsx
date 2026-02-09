"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Phone, Video, ArrowLeft, Mic, Send } from "lucide-react";
import { chats, messages as mockMessages } from "@/data/mock";

const ChatPage = () => {
  const params = useParams<{ id: string }>();
  const chatId = params.id;
  const chat = chats.find((item) => item.id === chatId);
  const initialMessages = useMemo(
    () => mockMessages.filter((message) => message.chatId === chatId),
    [chatId]
  );
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  const handleSend = () => {
    if (!draft.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    });
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        chatId,
        sender: "Moi",
        text: draft,
        time,
        fromMe: true
      }
    ]);
    setDraft("");
  };

  if (!chat) {
    return (
      <div className="card space-y-2">
        <p className="text-sm text-slate-600">Chat introuvable.</p>
        <Link href="/chats" className="text-sm font-semibold text-nexo-600">
          Retour aux chats
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/chats"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{chat.name}</h1>
            <p className="text-xs text-slate-500">En ligne · Nantes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl bg-nexo-600/10 text-nexo-600">
            <Phone className="h-5 w-5" />
          </button>
          <button className="flex h-10 w-10 items-center justify-center rounded-2xl bg-nexo-600/10 text-nexo-600">
            <Video className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.fromMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                message.fromMe
                  ? "bg-nexo-600 text-white"
                  : "bg-white text-slate-700"
              }`}
            >
              <p>{message.text}</p>
              <span
                className={`mt-2 block text-[11px] ${
                  message.fromMe ? "text-white/70" : "text-slate-400"
                }`}
              >
                {message.time}
              </span>
            </div>
          </div>
        ))}
      </section>

      <section className="card flex items-center gap-3">
        <button className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Mic className="h-5 w-5" />
        </button>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Écrire un message"
          className="flex-1 border-none bg-transparent text-sm focus:outline-none"
        />
        <button
          onClick={handleSend}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-nexo-600 text-white"
        >
          <Send className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
};

export default ChatPage;
