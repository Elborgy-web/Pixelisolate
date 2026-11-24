// Lightweight SEO-to-conversion attribution tracker (UTM + organic search referrer)

export interface AttributionData {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  landingPath: string;
  referrer: string;
  capturedAt: string;
}

const STORAGE_KEY = "pixelisolate_attribution_v1";

const ORGANIC_ENGINES: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /google\./i, name: "google" },
  { pattern: /bing\.com/i, name: "bing" },
  { pattern: /duckduckgo\.com/i, name: "duckduckgo" },
  { pattern: /search\.yahoo\./i, name: "yahoo" },
  { pattern: /ecosia\.org/i, name: "ecosia" },
  { pattern: /search\.brave\.com/i, name: "brave" },
  { pattern: /perplexity\.ai/i, name: "perplexity" },
  { pattern: /chatgpt\.com|chat\.openai\.com/i, name: "chatgpt" },
  { pattern: /claude\.ai/i, name: "claude" },
];

export function captureAttribution(): AttributionData {
  const fallback: AttributionData = {
    source: "direct",
    medium: "none",
    campaign: "",
    content: "",
    landingPath: "/",
    referrer: "",
    capturedAt: new Date().toISOString(),
  };

  if (typeof window === "undefined") return fallback;

  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source") || params.get("source") || "";
    const utmMedium = params.get("utm_medium") || "";
    const utmCampaign = params.get("utm_campaign") || "";
    const utmContent = params.get("utm_content") || "";

    const existingRaw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    const existing: AttributionData | null = existingRaw ? JSON.parse(existingRaw) : null;

    // If explicit UTM/source params are present on this visit, refresh attribution
    if (utmSource || utmMedium || utmCampaign) {
      const fresh: AttributionData = {
        source: utmSource || "organic",
        medium: utmMedium || (utmSource === "organic" ? "organic" : "referral"),
        campaign: utmCampaign,
        content: utmContent,
        landingPath: window.location.pathname,
        referrer: document.referrer || existing?.referrer || "",
        capturedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      return fresh;
    }

    if (existing) return existing;

    // Infer organic search vs referral vs direct from document.referrer
    const ref = document.referrer || "";
    let source = "direct";
    let medium = "none";

    if (ref) {
      try {
        const refHost = new URL(ref).hostname.toLowerCase();
        if (!refHost.includes("pixelisolate.online")) {
          const matchedEngine = ORGANIC_ENGINES.find((e) => e.pattern.test(refHost));
          if (matchedEngine) {
            source = "organic";
            medium = matchedEngine.name;
          } else {
            source = refHost;
            medium = "referral";
          }
        }
      } catch {
        // ignore invalid referrer URL
      }
    }

    const captured: AttributionData = {
      source,
      medium,
      campaign: "",
      content: "",
      landingPath: window.location.pathname,
      referrer: ref,
      capturedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
    return captured;
  } catch {
    return fallback;
  }
}

export function getAttribution(): AttributionData {
  if (typeof window === "undefined") {
    return {
      source: "direct",
      medium: "none",
      campaign: "",
      content: "",
      landingPath: "/",
      referrer: "",
      capturedAt: "",
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore storage errors
  }
  return captureAttribution();
}

export function trackConversionEvent(
  eventName: string,
  params: Record<string, string | number | boolean> = {}
) {
  if (typeof window === "undefined") return;
  const attr = getAttribution();
  const payload = {
    attribution_source: attr.source,
    attribution_medium: attr.medium,
    attribution_campaign: attr.campaign,
    landing_path: attr.landingPath,
    current_path: window.location.pathname,
    ...params,
  };

  try {
    const w = window as any;
    if (typeof w.gtag === "function") {
      w.gtag("event", eventName, payload);
    }
  } catch {
    // non-fatal
  }
}
