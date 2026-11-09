"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, session } from "../services/MessagingApi";
import type { PublicUser } from "../types/ApiTypes";
import { subscribeViewer } from "./ViewerStore";

// Local storage only triggers a server recheck; it never grants capabilities.
export function useAccountSession() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const generation = useRef({ value: 0 });
  const refresh = useCallback(async () => {
    const current = ++generation.current.value;
    try {
      const next = await session();
      if (current !== generation.current.value) return null;
      setUser(next);
      setError("");
      return next;
    } catch (cause) {
      if (current !== generation.current.value) return null;
      setUser(null);
      setError(
        cause instanceof ApiError && cause.status === 401
          ? ""
          : "Não foi possível consultar sua sessão. Tente novamente.",
      );
      return null;
    } finally {
      if (current === generation.current.value) setLoading(false);
    }
  }, []);
  useEffect(() => {
    const counter = generation.current;
    const recheck = () => {
      void refresh();
    };
    const visible = () => {
      if (document.visibilityState === "visible") recheck();
    };
    const unsubscribe = subscribeViewer(recheck);
    recheck();
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", visible);
    return () => {
      counter.value++;
      unsubscribe();
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [refresh]);
  return { user, loading, error, refresh };
}
