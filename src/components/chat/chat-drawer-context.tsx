"use client";

import * as React from "react";

interface ChatDrawerContextValue {
  open: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const ChatDrawerContext = React.createContext<ChatDrawerContextValue | null>(null);

export function ChatDrawerProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  const openDrawer = React.useCallback(() => setOpen(true), []);
  const closeDrawer = React.useCallback(() => setOpen(false), []);
  const toggleDrawer = React.useCallback(() => setOpen((v) => !v), []);

  const value = React.useMemo(
    () => ({ open, openDrawer, closeDrawer, toggleDrawer }),
    [open, openDrawer, closeDrawer, toggleDrawer],
  );

  return (
    <ChatDrawerContext.Provider value={value}>
      {children}
    </ChatDrawerContext.Provider>
  );
}

export function useChatDrawer() {
  const ctx = React.useContext(ChatDrawerContext);
  if (!ctx) throw new Error("useChatDrawer must be used within ChatDrawerProvider");
  return ctx;
}
