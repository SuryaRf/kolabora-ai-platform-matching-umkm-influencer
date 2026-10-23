"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCheck,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import type { CollabDTO } from "@/lib/collab";
import { getStatusMeta } from "@/lib/collab";
import { colorForName, initialsOf, participantLabel } from "@/lib/avatar";

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  type: string;
  fileUrl: string | null;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null; role: string | null };
}

interface ChatRoomProps {
  role: "UMKM" | "INFLUENCER";
  meId: string;
  initialId?: string;
  emptyHint?: string;
}

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dayOf(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ChatRoom({
  role,
  meId,
  initialId,
  emptyHint,
}: ChatRoomProps) {
  const [conversations, setConversations] = useState<CollabDTO[]>([]);
  const [activeId, setActiveId] = useState<string | null>(initialId ?? null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const lastTimestamp = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/collaborations", { cache: "no-store" });
      if (!res.ok) return;
      const data: CollabDTO[] = await res.json();
      setConversations(data);
      setActiveId((current) => current ?? data[0]?.id ?? null);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
    const id = setInterval(() => void loadConversations(), 15000);
    return () => clearInterval(id);
  }, [loadConversations]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );

  const other = useMemo(
    () => active?.participants.find((p) => p.id !== meId),
    [active, meId],
  );

  const mergeMessages = useCallback((incoming: ChatMessage[]) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const m of incoming) map.set(m.id, m);
      return Array.from(map.values()).sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
    const last = incoming[incoming.length - 1];
    if (last) lastTimestamp.current = last.createdAt;
  }, []);

  const loadMessages = useCallback(
    async (collabId: string, since?: string | null) => {
      const res = await fetch(
        `/api/messages?collaborationId=${collabId}${
          since ? `&since=${encodeURIComponent(since)}` : ""
        }`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data: ChatMessage[] = await res.json();
      if (!since) {
        setMessages(data);
        lastTimestamp.current = data[data.length - 1]?.createdAt ?? null;
      } else if (data.length > 0) {
        mergeMessages(data);
      }
    },
    [mergeMessages],
  );

  useEffect(() => {
    if (!activeId) return;
    setLoadingMessages(true);
    setMessages([]);
    lastTimestamp.current = null;

    let cancelled = false;
    void loadMessages(activeId).finally(() => {
      if (!cancelled) setLoadingMessages(false);
    });

    const id = setInterval(() => {
      void loadMessages(activeId, lastTimestamp.current);
    }, 3500);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  const send = async () => {
    const content = draft.trim();
    if (!content || !activeId || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collaborationId: activeId, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Gagal mengirim pesan");
        return;
      }
      const message: ChatMessage = await res.json();
      mergeMessages([message]);
      setDraft("");
      void loadConversations();
    } catch {
      setError("Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const name =
      c.participants
        .filter((p) => p.id !== meId)
        .map((p) => participantLabel(p))
        .join(" ") ?? "";
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
    );
  });

  if (loadingList) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memuat percakapan...
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center">
        <MessageSquare className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
        <h3 className="font-semibold">Belum ada percakapan</h3>
        <p className="text-sm text-zinc-500 mt-1 mb-5">
          {emptyHint ??
            "Chat akan aktif otomatis setelah ada kolaborasi yang disetujui."}
        </p>
        <Link
          href={
            role === "UMKM"
              ? "/dashboard/umkm/smart-matching"
              : "/dashboard/influencer/discover"
          }
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-kolabora hover:bg-kolabora-dark"
        >
          <Sparkles className="w-4 h-4" /> Mulai cari kolaborasi
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="flex h-[560px]">
        <div
          className={`w-full sm:w-80 border-r border-zinc-200 dark:border-zinc-800 flex-col flex-shrink-0 ${
            active ? "hidden sm:flex" : "flex"
          }`}
        >
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari percakapan..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((conv) => {
              const peer = conv.participants.find((p) => p.id !== meId);
              const name = participantLabel(
                peer ?? {
                  name: "Kolaborasi",
                  email: "",
                },
              );
              const status = getStatusMeta(conv.status, role);
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveId(conv.id)}
                  className={`w-full flex items-start gap-3 p-3 text-left transition-colors ${
                    conv.id === activeId
                      ? "bg-kolabora/5"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full ${colorForName(
                      name,
                    )} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                  >
                    {initialsOf(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{name}</p>
                      <span className="text-[10px] text-zinc-400 flex-shrink-0">
                        {conv.lastMessage ? timeOf(conv.lastMessage.createdAt) : ""}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {conv.title}
                    </p>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {conv.lastMessage?.senderId === meId ? "Anda: " : ""}
                      {conv.lastMessage?.content ?? "Belum ada pesan"}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && conv.id !== activeId && (
                    <span className="w-5 h-5 rounded-full bg-kolabora text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                  <span
                    className={`sr-only ${status.className}`}
                    aria-hidden
                  >
                    {status.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {active && (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between gap-3 p-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setActiveId(null)}
                  className="sm:hidden p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  aria-label="Kembali"
                >
                  <ArrowLeft className="w-4 h-4 text-zinc-500" />
                </button>
                <div
                  className={`w-9 h-9 rounded-full ${colorForName(
                    participantLabel(
                      other ?? { name: active.title, email: "" },
                    ),
                  )} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                >
                  {initialsOf(
                    participantLabel(other ?? { name: active.title, email: "" }),
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {participantLabel(
                      other ?? { name: active.title, email: "" },
                    )}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {active.title} • {getStatusMeta(active.status, role).label}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-50/60 dark:bg-zinc-950/30">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-zinc-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Memuat pesan...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-sm text-zinc-500">
                  Belum ada pesan. Mulai percakapan dengan brief singkat.
                </div>
              ) : (
                messages.map((msg, i) => {
                  const mine = msg.senderId === meId;
                  const showDay =
                    i === 0 ||
                    dayOf(messages[i - 1].createdAt) !== dayOf(msg.createdAt);
                  return (
                    <div key={msg.id}>
                      {showDay && (
                        <div className="flex items-center justify-center my-3">
                          <span className="text-[10px] text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-full">
                            {dayOf(msg.createdAt)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-md p-3 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                            mine
                              ? "bg-kolabora text-white rounded-br-md"
                              : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-bl-md"
                          }`}
                        >
                          {msg.type === "BRIEF" && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide mb-1 ${
                                mine ? "text-white/80" : "text-kolabora"
                              }`}
                            >
                              <Sparkles className="w-3 h-3" /> Brief
                            </span>
                          )}
                          {msg.fileUrl && (
                            <a
                              href={msg.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-xs underline mb-1"
                            >
                              Lampiran
                            </a>
                          )}
                          <p>{msg.content}</p>
                          <div
                            className={`flex items-center justify-end gap-1 mt-1 ${
                              mine ? "text-white/70" : "text-zinc-400"
                            }`}
                          >
                            <span className="text-[10px]">
                              {timeOf(msg.createdAt)}
                            </span>
                            {mine && <CheckCheck className="w-3 h-3" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {error && (
              <p className="px-4 py-1 text-[11px] text-red-500">{error}</p>
            )}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Ketik pesan..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-kolabora/50"
                />
                <button
                  onClick={() => void send()}
                  disabled={sending || !draft.trim()}
                  className="p-2.5 rounded-xl bg-kolabora text-white hover:bg-kolabora-dark transition-all disabled:opacity-40"
                  aria-label="Kirim pesan"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
