import { useEffect } from "react";

/** Sets the browser tab title for a page (replaces TanStack's per-route head()). */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
