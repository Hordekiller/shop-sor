"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const MAX_HISTORY = 50;

export function useUndoRedo<T>(initial: T) {
  const [past, setPast] = useState<T[]>([]);
  const [future, setFuture] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initial);
  const initialRef = useRef(initial);
  const ignoreRef = useRef(false);

  const pushState = useCallback((state: T) => {
    if (ignoreRef.current) {
      ignoreRef.current = false;
      return;
    }
    setPast((prev) => {
      const next = [...prev, state];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    setFuture([]);
  }, []);

  const setState = useCallback((state: T) => {
    setPresent(state);
  }, []);

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const newPast = [...prevPast];
      const previous = newPast.pop()!;
      ignoreRef.current = true;
      setPresent((current) => {
        setFuture((prev) => [...prev, current]);
        return previous;
      });
      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const newFuture = [...prevFuture];
      const next = newFuture.pop()!;
      ignoreRef.current = true;
      setPresent((current) => {
        setPast((prev) => {
          const updated = [...prev, current];
          if (updated.length > MAX_HISTORY) updated.shift();
          return updated;
        });
        return next;
      });
      return newFuture;
    });
  }, []);

  const reset = useCallback((state: T) => {
    setPast([]);
    setFuture([]);
    setPresent(state);
    initialRef.current = state;
  }, []);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return {
    state: present,
    setState,
    pushState,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    past,
    future,
  };
}
