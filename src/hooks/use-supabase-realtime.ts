"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE";

interface UseSupabaseRealtimeOptions<T extends Record<string, any>> {
  table: string;
  event?: PostgresChangeEvent | "*";
  onInsert?: (record: T) => void;
  onUpdate?: (record: T) => void;
  onDelete?: (oldRecord: T) => void;
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void;
}

export function useSupabaseRealtime<T extends Record<string, any>>({
  table,
  event = "*",
  onInsert,
  onUpdate,
  onDelete,
  onChange,
}: UseSupabaseRealtimeOptions<T>) {
  const supabase = createClient();
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete, onChange });

  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete, onChange };
  }, [onInsert, onUpdate, onDelete, onChange]);

  const handleChange = useCallback(
    (payload: RealtimePostgresChangesPayload<T>) => {
      const { onInsert, onUpdate, onDelete, onChange } = callbacksRef.current;

      onChange?.(payload);

      switch (payload.eventType) {
        case "INSERT":
          onInsert?.(payload.new as T);
          break;
        case "UPDATE":
          onUpdate?.(payload.new as T);
          break;
        case "DELETE":
          onDelete?.(payload.old as T);
          break;
      }
    },
    []
  );

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes" as never,
        {
          event,
          schema: "public",
          table,
        },
        handleChange as never
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, table, event, handleChange]);
}
