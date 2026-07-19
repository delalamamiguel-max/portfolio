import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchContentRawMap, type ContentDomain } from "@/lib/content-loader";

type RawMapState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; rawMap: Record<string, string> };

/**
 * Loads the raw markdown map for an admin editor from the authenticated
 * content API (content no longer ships in the client bundle).
 */
export function AdminRawMapLoader({
  domain,
  children,
}: {
  domain: ContentDomain;
  children: (rawMap: Record<string, string>) => JSX.Element;
}) {
  const [state, setState] = useState<RawMapState>({ status: "loading" });

  const load = useCallback(() => {
    let mounted = true;
    setState({ status: "loading" });

    fetchContentRawMap(domain)
      .then((rawMap) => {
        if (mounted) setState({ status: "ready", rawMap });
      })
      .catch(() => {
        if (mounted) setState({ status: "error" });
      });

    return () => {
      mounted = false;
    };
  }, [domain]);

  useEffect(() => load(), [load]);

  if (state.status === "loading") {
    return (
      <p className="body-md text-muted-text" role="status">
        Loading content from the server...
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-3">
        <p className="body-md status-danger-text" role="alert">
          Unable to load content. Check your connection and try again.
        </p>
        <Button variant="secondary" onClick={() => load()}>
          Retry
        </Button>
      </div>
    );
  }

  return children(state.rawMap);
}
