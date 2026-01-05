"use client";

import { memo, useEffect, useMemo, useRef } from "react";

declare global {
  interface Window {
    FB?: any;
  }
}

interface FBPostProps {
  /** Used for XFBML mode on mobile */
  socialUrl?: string;
  /**
   * Used for iframe mode on desktop.
   * Expected format (as requested): encoded href + optional params, e.g.
   * `https%3A%2F%2Fwww.facebook.com%2F...&show_text=true`
   * (We will build `https://www.facebook.com/plugins/post.php?href=<socialIframe>&width=<width>`).
   */
  socialIframe?: string;
  /** If true => XFBML (SDK). Else => iframe plugin. */
  preferXfbml?: boolean;
  width?: number;
  height?: number;
}

function extractAttr(html: string, attr: string): string | undefined {
  const match = html.match(new RegExp(`${attr}="([^"]+)"`, "i"));
  return match?.[1];
}

function buildFbPluginSrc(input: string, width: number): string | null {
  if (!input) return null;

  // Full iframe HTML
  if (input.includes("<iframe")) {
    const src = extractAttr(input, "src");
    return src ?? null;
  }

  // Full URL already
  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      if (url.hostname.endsWith("facebook.com") && url.pathname.includes("/plugins/post.php")) {
        url.searchParams.set("width", String(width));
        return url.toString();
      }
    } catch {
      // fall through
    }
  }

  // Query-string fragment form
  let qs = input.trim();
  if (qs.startsWith("?")) qs = qs.slice(1);
  if (!qs.includes("href=")) qs = `href=${qs}`;
  // always enforce width
  qs = qs.replace(/(^|&)width=[^&]*/i, "");
  qs = qs.replace(/^&+/, "");
  qs = `${qs}&width=${width}`;

  return `https://www.facebook.com/plugins/post.php?${qs}`;
}

function normalizeFbUrl(raw: string): string {
  if (!raw) return "";
  try {
    let url = new URL(raw);
    if (url.hostname === "m.facebook.com" || url.hostname === "web.facebook.com") {
      url.hostname = "www.facebook.com";
    }
    ["fbclid", "mibextid", "ref", "_rdc", "_rdr"].forEach((k) => url.searchParams.delete(k));
    url.hash = "";
    return url.toString();
  } catch {
    return raw;
  }
}

function FBPost({
  socialUrl,
  socialIframe,
  preferXfbml = false,
  width = 350,
  height = 591,
}: FBPostProps) {
  const finalWidth = Math.max(350, width);
  const normalizedUrl = normalizeFbUrl(socialUrl || "");
  const iframeSrc = useMemo(
    () => buildFbPluginSrc(socialIframe || "", finalWidth),
    [socialIframe, finalWidth]
  );

  const xfbmlRef = useRef<HTMLDivElement | null>(null);
  const parsedRef = useRef(false);

  useEffect(() => {
    parsedRef.current = false;
    if (!preferXfbml) return;
    if (!normalizedUrl) return;

    const container = xfbmlRef.current;
    if (!container) return;

    const parseNow = () => {
      if (parsedRef.current) return;
      if (!window.FB?.XFBML?.parse) return;
      try {
        window.FB.XFBML.parse(container);
        parsedRef.current = true;
      } catch {
        // ignore
      }
    };

    const raf = window.requestAnimationFrame(parseNow);
    const onReady = () => window.requestAnimationFrame(parseNow);
    window.addEventListener("fb-sdk-ready", onReady);

    // retry until SDK appears (no iframe fallback)
    let attempts = 0;
    let t: number | undefined;
    const retry = () => {
      if (parsedRef.current) return;
      if (window.FB?.XFBML?.parse) {
        window.requestAnimationFrame(parseNow);
        return;
      }
      if (attempts++ > 40) return; // ~10s
      t = window.setTimeout(retry, 250);
    };
    retry();

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("fb-sdk-ready", onReady);
      if (t) window.clearTimeout(t);
    };
  }, [preferXfbml, normalizedUrl, finalWidth]);

  return (
    <div
      style={{
        width: finalWidth,
        border: "3px solid #E1C693",
        background: "#fff",
        overflow: preferXfbml ? "hidden" : "hidden",
        minHeight: '591px',
      }}
    >
      {preferXfbml ? (
        <div ref={xfbmlRef}>
          <div
            key={`${normalizedUrl}-${finalWidth}`}
            className="fb-post"
            data-href={normalizedUrl}
            data-width={String(finalWidth)}
          />
        </div>
      ) : iframeSrc ? (
        <iframe
          src={iframeSrc}
          width={String(finalWidth)}
          height={String(height)}
          style={{ border: "none", overflow: "hidden", display: "block" }}
          scrolling="no"
          frameBorder={0}
          allowFullScreen={true}
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          title="Facebook Post"
        />
      ) : null}
    </div>
  );
}

export default memo(FBPost);
