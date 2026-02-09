import Link from "next/link";
import { Search, Store, Users, UserRound } from "lucide-react";
import { chats } from "@/data/mock";

const typeIcon = {
  commerce: Store,
  ami: UserRound,
  groupe: Users
};

const ChatsPage = () => {
  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <h1 className="text-2xl font-semibold">Chats</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-nexo-600 focus:outline-none"
            placeholder="Rechercher un chat ou un commerce"
          />
        </div>
      </section>

      <section className="space-y-3">
        {chats.map((chat) => {
          const Icon = typeIcon[chat.type];
          return (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className="card flex items-center gap-4"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {chat.name}
                  </h2>
                  <span className="text-xs text-slate-400">{chat.lastTime}</span>
                </div>
                <p className="text-sm text-slate-600">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 ? (
                <span className="rounded-full bg-nexo-600 px-2 py-1 text-xs font-semibold text-white">
                  {chat.unread}
                </span>
              ) : null}
            </Link>
          );
        })}
      </section>
    </div>
  );
};

export default ChatsPage;
