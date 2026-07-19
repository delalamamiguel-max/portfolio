import { useEffect } from "react";

export const BASE_TITLE = "Miguel de la Lama | Senior Product Leader · AI at the Foundation";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | Miguel de la Lama` : BASE_TITLE;

    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
