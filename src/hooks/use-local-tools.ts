"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Favorites + recently-used tools, persisted in localStorage only. */

const FAV_KEY = "tb100:favorites";
const RECENT_KEY = "tb100:recent";
const EVENT = "tb100:local-tools";

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeList(key: string, list: string[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
  } catch {
    /* storage may be unavailable */
  }
}

/* Snapshot caching so useSyncExternalStore gets a stable reference. */
const snapshotCache = new Map<string, { raw: string | null; list: string[] }>();

function getSnapshot(key: string): string[] {
  const raw = typeof window === "undefined" ? null : window.localStorage.getItem(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.list;
  const list = parseList(raw);
  snapshotCache.set(key, { raw, list });
  return list;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const emptyList: string[] = [];
const getServerSnapshot = () => emptyList;

/** Favorite tool slugs for the current visitor (local only). */
export function useFavorites() {
  const favorites = useSyncExternalStore(subscribe, () => getSnapshot(FAV_KEY), getServerSnapshot);

  const toggle = useCallback((slug: string) => {
    const current = getSnapshot(FAV_KEY);
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [slug, ...current];
    writeList(FAV_KEY, next.slice(0, 100));
  }, []);

  const isFavorite = useCallback((slug: string) => favorites.includes(slug), [favorites]);

  return { favorites, toggle, isFavorite, loaded: true };
}

/** Record a tool visit (identifiers only, local only). */
export function pushRecent(slug: string): void {
  if (typeof window === "undefined") return;
  const current = getSnapshot(RECENT_KEY).filter((s) => s !== slug);
  writeList(RECENT_KEY, [slug, ...current].slice(0, 12));
}

/** Recently used tool slugs for the current visitor. */
export function useRecents() {
  const recents = useSyncExternalStore(subscribe, () => getSnapshot(RECENT_KEY), getServerSnapshot);
  return { recents, loaded: true };
}
