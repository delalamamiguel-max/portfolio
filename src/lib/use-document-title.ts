import { useEffect } from "react";

export const BASE_TITLE = "Miguel de la Lama — Senior Product Manager | AI & Platform Products";

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} — Miguel de la Lama` : BASE_TITLE;

    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
