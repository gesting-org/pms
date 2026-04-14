"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Plus, Mail, MessageSquare, User, Building2, ArrowUp, ArrowDown, Clock } from "lucide-react";

interface Message {
  id: string;
  type: "guest" | "owner";
  contactName: string;
  subject: string;
  body: string;
  channel: "EMAIL" | "WHATSAPP" | "INTERNAL";
  direction: "INBOUND" | "OUTBOUND";
  status: "DRAFT" | "SENT" | "READ" | "UNREAD" | "FAILED";
  propertyName: string;
  createdAt: string;
}

const CHANNEL_ICON: Record<string, any> = { EMAIL: Mail, WHATSAPP: MessageSquare, INTERNAL: Building2 };
const CHANNEL_LABEL: Record<string, string> = { EMAIL: "Email", WHATSAPP: "WhatsApp", INTERNAL: "Interno" };

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${Math.floor(hours / 24)}d`;
}

export function MessagesInbox({ messages }: { messages: Message[] }) {
  const [filter, setFilter] = useState("ALL");
  const [selected, setSelected] = useState<Message | null>(null);

  const filtered = messages.filter((m) => {
    if (filter === "INBOUND") return m.direction === "INBOUND";
    if (filter === "OUTBOUND") return m.direction === "OUTBOUND";
    if (filter === "GUEST") return m.type === "guest";
    if (filter === "OWNER") return m.type === "owner";
    if (filter === "UNREAD") return m.status === "UNREAD";
    return true;
  });

  const unreadCount = messages.filter((m) => m.status === "UNREAD").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 items-center">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="UNREAD">Sin leer {unreadCount > 0 && `(${unreadCount})`}</SelectItem>
              <SelectItem value="INBOUND">Recibidos</SelectItem>
              <SelectItem value="OUTBOUND">Enviados</SelectItem>
              <SelectItem value="GUEST">Huéspedes</SelectItem>
              <SelectItem value="OWNER">Propietarios</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button asChild size="sm">
          <Link href="/messages/new"><Plus className="h-4 w-4" />Nuevo mensaje</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Lista */}
        <div className={cn("space-y-1", selected ? "lg:col-span-2" : "lg:col-span-5")}>
          {filtered.map((m) => {
            const Icon = CHANNEL_ICON[m.channel];
            return (
              <button key={m.id} onClick={() => setSelected(m)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-all hover:bg-accent/50",
                  selected?.id === m.id && "bg-primary/5 border-primary/30",
                  m.status === "UNREAD" && "border-l-4 border-l-primary"
                )}>
                <div className="flex items-start gap-2.5">
                  <div className={cn("p-1.5 rounded-full shrink-0", m.type === "guest" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600")}>
                    {m.type === "guest" ? <User className="h-3.5 w-3.5" /> : <Building2 className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm truncate", m.status === "UNREAD" && "font-semibold")}>{m.contactName}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{timeAgo(m.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground truncate">{m.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.body}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{CHANNEL_LABEL[m.channel]}</span>
                      {m.direction === "INBOUND"
                        ? <ArrowDown className="h-3 w-3 text-blue-500" />
                        : <ArrowUp className="h-3 w-3 text-emerald-500" />}
                      <span className="text-[10px] text-muted-foreground truncate">{m.propertyName}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin mensajes</p>
            </div>
          )}
        </div>

        {/* Vista del mensaje */}
        {selected && (
          <div className="lg:col-span-3">
            <MessageThread message={selected} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>
    </div>
  );
}

function MessageThread({ message: m, onClose }: { message: any; onClose: () => void }) {
  const [reply, setReply] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState("");

  async function generateAiReply() {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: `Propiedad: ${m.propertyName}`,
          incomingMessage: m.body,
          recipientType: m.type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data.text);
        setReply(data.text);
      }
    } catch {
      // Mock fallback
      setReply(`Hola ${m.contactName.split(" ")[0]}! Gracias por tu mensaje. ${m.type === "guest" ? "El check-in es a las 15hs. Te enviamos los datos de acceso por separado." : "Nos ponemos en contacto a la brevedad."}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-xl border bg-card h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold text-sm">{m.subject}</h3>
          <p className="text-xs text-muted-foreground">{m.contactName} · {m.propertyName}</p>
        </div>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Cerrar</button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className={cn("p-3 rounded-lg text-sm max-w-[80%]",
          m.direction === "INBOUND" ? "bg-muted" : "bg-primary/10 ml-auto")}>
          <p>{m.body}</p>
        </div>
      </div>

      <div className="p-4 border-t space-y-3">
        <div className="flex gap-2">
          <textarea
            className="flex-1 min-h-[80px] rounded-lg border border-input bg-transparent px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Escribí tu respuesta..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button size="sm" variant="outline" onClick={generateAiReply} disabled={generating} className="text-xs">
            {generating ? "Generando..." : "✨ Sugerir con IA"}
          </Button>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs">Guardar borrador</Button>
            <Button size="sm" disabled={!reply.trim()} className="text-xs">Enviar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
