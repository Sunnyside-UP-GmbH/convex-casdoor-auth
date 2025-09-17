import type { JWTData } from "./types";
import { useSyncExternalStore } from "react";

export let token: JWTData | null = null;

export function setToken(t: JWTData | null, notify: boolean = true) {
    token = t;
    if(notify) {
        listeners.forEach((l) => l());
    }
}

export function setTokenSilent(t: JWTData | null) {
    token = t;
}

export function getStoredToken() {
    return token;
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useToken() {
    return useSyncExternalStore(subscribe, getStoredToken);
}

export function useAuthStatus() {
    return useSyncExternalStore(subscribe, () => !!token?.access_token);
}