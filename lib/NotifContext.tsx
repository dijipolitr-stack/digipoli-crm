// lib/NotifContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Notif { id: number; title: string; msg: string; }
interface NotifCtx { notifs: Notif[]; add: (title: string, msg: string) => void; }

const Ctx = createContext<NotifCtx>({ notifs: [], add: () => {} });

export function NotifProvider({ children }: { children: ReactNode }) {
  const [notifs, setNotifs] = useState<Notif[]>([]);

  const add = useCallback((title: string, msg: string) => {
    const id = Date.now();
    setNotifs(n => [...n, { id, title, msg }]);
    setTimeout(() => setNotifs(n => n.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <Ctx.Provider value={{ notifs, add }}>
      {children}
      <div className="notif">
        {notifs.map(n => (
          <div key={n.id} className="notif-item">
            <div className="notif-title">{n.title}</div>
            <div className="notif-msg">{n.msg}</div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useNotif = () => useContext(Ctx);
