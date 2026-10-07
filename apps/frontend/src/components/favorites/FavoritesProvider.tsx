"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { favoritesList, saveFavorite } from "../../services/FavoritesApi";
import type { FavoritesPage } from "../../services/FavoritesApi";
import { ApiError, session } from "../../services/MessagingApi";
import {
  parseViewer,
  readStored,
  subscribeViewer,
  VIEWER_KEY,
} from "../../lib/ViewerStore";
type State = {
  data: FavoritesPage | null;
  loading: boolean;
  error: string;
  unauthorized: boolean;
  busy: boolean;
};
const initial: State = {
  data: null,
  loading: true,
  error: "",
  unauthorized: false,
  busy: false,
};
const Context = createContext<
  State & {
    refresh: () => Promise<FavoritesPage | null>;
    change: (id: number, saved: boolean) => Promise<void>;
  }
>({ ...initial, refresh: async () => null, change: async () => {} });
export const useFavorites = () => useContext(Context);
export default function FavoritesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState(initial);
  const current = useRef<FavoritesPage | null>(null),
    sequence = useRef(0),
    alive = useRef(true),
    locked = useRef(false);
  const refresh = useCallback(async () => {
    const version = ++sequence.current;
    setState((s) => ({ ...s, loading: true, error: "" }));
    try {
      const data = await favoritesList();
      if (!alive.current || version !== sequence.current) return null;
      current.current = data;
      setState((s) => ({
        ...s,
        data,
        loading: false,
        error: "",
        unauthorized: false,
      }));
      return data;
    } catch (e) {
      if (alive.current && version === sequence.current) {
        const unauthorized = e instanceof ApiError && e.status === 401;
        if (unauthorized) current.current = null;
        setState((s) => ({
          ...s,
          loading: false,
          data: unauthorized ? null : s.data,
          unauthorized,
          error:
            e instanceof Error ? e.message : "Falha ao consultar favoritos.",
        }));
      }
      return null;
    }
  }, []);
  useEffect(() => {
    alive.current = true;
    const invalidate = () => {
      sequence.current++;
    };
    let viewer = parseViewer(readStored(VIEWER_KEY))?.id;
    const recheck = () => {
      sequence.current++;
      current.current = null;
      setState((s) => ({ ...s, data: null }));
      void refresh();
    };
    const unsubscribe = subscribeViewer(() => {
      const next = parseViewer(readStored(VIEWER_KEY))?.id;
      if (next !== viewer) {
        viewer = next;
        recheck();
      }
    });
    const visible = () => {
      if (document.visibilityState === "visible") recheck();
    };
    void refresh();
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", visible);
    return () => {
      alive.current = false;
      invalidate();
      unsubscribe();
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);
  const change = useCallback(
    async (id: number, saved: boolean) => {
      if (locked.current) return;
      locked.current = true;
      setState((s) => ({ ...s, busy: true }));
      try {
        const snapshot = current.current ?? (await refresh());
        const user = await session();
        if (!alive.current) return;
        if (!snapshot || user.idUsuario !== snapshot.usuarioId) {
          current.current = null;
          setState((s) => ({ ...s, data: null }));
          await refresh();
          throw Error("Confira a conta atual e tente novamente.");
        }
        const version = ++sequence.current;
        const owner = await saveFavorite(id, saved);
        if (!alive.current) return;
        if (version !== sequence.current || owner !== user.idUsuario) {
          await refresh();
          throw Error("A sessão mudou. Confira os favoritos da conta atual.");
        }
        const result = await refresh();
        if (!result)
          throw Error(
            "Alteração confirmada, mas não foi possível atualizar a lista. Atualize os favoritos.",
          );
        if (result.usuarioId !== owner)
          throw Error("A sessão mudou. Confira os favoritos da conta atual.");
      } catch (e) {
        if (alive.current && e instanceof ApiError && e.status === 401) {
          sequence.current++;
          current.current = null;
          setState((s) => ({
            ...s,
            data: null,
            unauthorized: true,
            error: e.message,
          }));
        }
        throw e;
      } finally {
        locked.current = false;
        if (alive.current) setState((s) => ({ ...s, busy: false }));
      }
    },
    [refresh],
  );
  return (
    <Context.Provider value={{ ...state, refresh, change }}>
      {children}
    </Context.Provider>
  );
}
