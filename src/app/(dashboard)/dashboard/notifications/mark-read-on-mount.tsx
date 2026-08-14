/**
 * 进入通知页即把全部通知标记已读（铃铛红点随之清零）
 */
"use client";

import { useEffect } from "react";

export function MarkReadOnMount() {
  useEffect(() => {
    fetch("/api/notifications", { method: "PUT", cache: "no-store" }).catch(
      () => {},
    );
  }, []);
  return null;
}
