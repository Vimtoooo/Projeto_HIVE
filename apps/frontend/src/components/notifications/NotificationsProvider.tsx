"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { notificationSummary } from "../../services/NotificationsApi";
import type { NotificationSummary } from "../../services/NotificationsApi";
import { ApiError } from "../../services/MessagingApi";
import { subscribeViewer, readStored, VIEWER_KEY } from "../../lib/ViewerStore";
type State = {
  summary: NotificationSummary | null;
  error: string;
  unauthorized: boolean;
  revision: number;
};
const isVisible = () => document.visibilityState === "visible";
const empty: State = {
  summary: null,
  error: "",
  unauthorized: false,
  revision: 0,
};
const Context = createContext<
  State & { refresh: () => Promise<void>; clear: () => void }
>({ ...empty, refresh: async () => {}, clear: () => {} });
export const useNotifications = () => useContext(Context);
export default function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<State>(empty);
  const generation = useRef(0),
    pending = useRef(false),
    queued = useRef(false);
  const clear = useCallback(() => {
    generation.current++;
    pending.current = false;
    queued.current = false;
    setState(empty);
  }, []);
  const refresh = useCallback(async () => {
    if (!isVisible()) return;
    if (pending.current) {
      queued.current = true;
      return;
    }
    pending.current = true;
    const version = generation.current;
    do {
      queued.current = false;
      try {
        const summary = await notificationSummary();
        if (version === generation.current)
          setState((s) => ({
            summary,
            error: "",
            unauthorized: false,
            revision: s.revision + 1,
          }));
      } catch (e) {
        if (version === generation.current)
          setState((s) => ({
            ...s,
            summary:
              e instanceof ApiError && e.status === 401 ? null : s.summary,
            error:
              e instanceof Error
                ? e.message
                : "Não foi possível atualizar os avisos.",
            unauthorized: e instanceof ApiError && e.status === 401,
            revision: s.revision + 1,
          }));
      }
    } while (queued.current && version === generation.current && isVisible());
    if (version === generation.current) pending.current = false;
  }, []);
  useEffect(() => {
    let previous = readStored(VIEWER_KEY);
    const unsubscribe = subscribeViewer(() => {
      const current = readStored(VIEWER_KEY);
      if (current !== previous) {
        previous = current;
        clear();
        void refresh();
      }
    });
    void refresh();
    const interval = setInterval(() => void refresh(), 10000);
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    const invalidate = () => {
      generation.current++;
    };
    return () => {
      invalidate();
      pending.current = false;
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh, clear]);
  return (
    <Context.Provider value={{ ...state, refresh, clear }}>
      {children}
    </Context.Provider>
  );
}
