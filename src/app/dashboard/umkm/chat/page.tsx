"use client";

import { useState } from "react";
import { MessageSquare, Search, Send, Paperclip, Check, CheckCheck, MoreHorizontal } from "lucide-react";
import FeaturePage from "@/components/dashboard/FeaturePage";

const conversations = [
  { name: "Kuliner Jalanan", avatar: "KJ", color: "bg-orange-500", lastMsg: "Baik, saya akan revisi sesuai brief.", time: "10:23", unread: 2, online: true },
  { name: "Sarah Beauty", avatar: "SB", color: "bg-pink-500", lastMsg: "Terima kasih untuk kerjasamanya! 🙏", time: "Kemarin", unread: 0, online: false },
  { name: "TechReview ID", avatar: "TR", color: "bg-blue-500", lastMsg: "Saya sudah upload draft video.", time: "Kemarin", unread: 0, online: true },
  { name: "Fitness Journey", avatar: "FJ", color: "bg-green-500", lastMsg: "Untuk tarif, apakah bisa dinegosiasikan?", time: "2 hari lalu", unread: 1, online: false },
];

const messages = [
  { from: "them", text: "Halo! Terima kasih sudah menghubungi saya.", time: "10:15" },
  { from: "them", text: "Saya sudah membaca brief yang diberikan dan tertarik untuk berkolaborasi.", time: "10:16" },
  { from: "me", text: "Senang mendengarnya! Apakah ada yang ingin didiskusikan?", time: "10:18" },
  { from: "them", text: "Untuk konsep konten, apakah boleh saya memberikan beberapa ide alternatif?", time: "10:20" },
  { from: "me", text: "Tentu saja! Silakan share ide-ide yang sudah disiapkan.", time: "10:21" },
  { from: "them", text: "Baik, saya akan revisi sesuai brief.", time: "10:23" },
];

export default function Chat() {
  const [activeChat, setActiveChat] = useState(0);
  const [message, setMessage] = useState("");

  return (
    <FeaturePage
      title="Chat & Messaging"
      description="Komunikasi langsung dengan influencer untuk diskusi, negosiasi, dan koordinasi kampanye."
      icon={MessageSquare}
      gradient="bg-kolabora"
    >
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex h-[500px]">
          <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
            <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input type="text" placeholder="Cari pesan..." className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv, i) => (
                <button key={i} onClick={() => setActiveChat(i)} className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${i === activeChat ? "bg-kolabora/5" : "hover:bg-zinc-50 dark:hover:bg-zinc-800"}`}>
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full ${conv.color} flex items-center justify-center text-white text-xs font-bold`}>{conv.avatar}</div>
                    {conv.online && <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{conv.name}</p>
                      <span className="text-xs text-zinc-400">{conv.time}</span>
                    </div>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">{conv.lastMsg}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-kolabora text-white text-xs font-bold flex items-center justify-center">{conv.unread}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${conversations[activeChat].color} flex items-center justify-center text-white text-xs font-bold`}>{conversations[activeChat].avatar}</div>
                <div>
                  <p className="text-sm font-medium">{conversations[activeChat].name}</p>
                  <p className="text-xs text-emerald-500">Online</p>
                </div>
              </div>
              <button className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><MoreHorizontal className="w-4 h-4 text-zinc-400" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-md p-3 rounded-2xl text-sm ${msg.from === "me" ? "bg-kolabora text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"}`}>
                    <p>{msg.text}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${msg.from === "me" ? "text-white/70" : "text-zinc-400"}`}>
                      <span className="text-xs">{msg.time}</span>
                      {msg.from === "me" && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"><Paperclip className="w-4 h-4 text-zinc-400" /></button>
                <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ketik pesan..." className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50" />
                <button className="p-2 rounded-xl bg-kolabora text-white hover:bg-kolabora-dark transition-all"><Send className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeaturePage>
  );
}
