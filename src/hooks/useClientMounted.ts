"use client";

import { useEffect, useState } from "react";

/** True after mount — safe to read localStorage / sessionStorage. */
export function useClientMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
