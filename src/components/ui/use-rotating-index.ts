"use client";

import { useEffect, useState } from "react";

export function useRotatingIndex(length: number, ms = 2000): number {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setI((v) => (v + 1) % length), ms);
    return () => clearTimeout(id);
  }, [i, length, ms]);
  return i;
}
