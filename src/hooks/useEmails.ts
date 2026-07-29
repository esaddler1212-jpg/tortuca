import { useCallback, useEffect, useState } from "react";
import type { EmailMessage } from "../types";
import { fetchEmails } from "../lib/google";

export function useEmails(connected: boolean) {
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!connected) {
      setMessages([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEmails();
      setMessages(data);
    } catch {
      setError("Could not load your inbox.");
    } finally {
      setLoading(false);
    }
  }, [connected]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const unread = messages.filter((m) => m.unread).length;

  return { messages, loading, error, refresh, unread };
}
