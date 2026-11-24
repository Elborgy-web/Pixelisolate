import React, { useEffect, useState } from "react";
import {
  Check,
  Sparkles,
  Package,
  Zap,
  ShieldCheck,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { getPaddleInstance } from "@paddle/paddle-js";
import { API_BASE_URL } from "../utils/apiConfig";
import { getAttribution, trackConversionEvent } from "../utils/attribution";

interface PricingPageProps {
  userId: string | null;
  userEmail: string | null;
  isPro?: boolean;
  onOpenAuth: () => void;
  onGoToEditor: () => void;
  onGoToUpscaler: () => void;
  onGoToCompare: () => void;
  onSuccess?: () => void;
}

const PRICING_FAQS = [
  {
    q: "How do free credits work on PixelIsolate?",
    a: "Every new account starts with 10 free credits (including 3 HD exports and 1 solid backdrop trial) with no credit card required. Each standard export consumes 1 credit.",
  },
  {
    q: "Do 100 Credit Bundle top-ups expire?",
    a: "No. Pay-as-you-go credit bundles ($5 one-time) never expire. Use them whenever you need high-resolution background cutouts without committing to a monthly subscription.",
  },
  {
    q: "What is included in the Pro Plan?",
    a: "Pro ($7.99/month) unlocks unlimited background removals, unlimited 4K & 8K Real-ESRGAN AI upscaling, parallel 50+ file bulk batch processing, custom solid hex backdrops, and AES-256 encrypted cloud History Gallery storage.",
  },
  {
    q: "Can I cancel or request a refund?",
    a: "Yes. You can cancel your Pro subscription anytime from Billing & Subscription with one click. We also offer a 14-day refund policy handled securely through Paddle, our Merchant of Record.",
  },
  {
    q: "Are my images uploaded to train AI models?",
    a: "Never. Background removal runs locally inside your browser using WebAssembly/WebGPU. Your artwork and product photos are never harvested or used for AI training.",
  },
];

export default function PricingPage({
  userId,
  userEmail,
  isPro = false,
  onOpenAuth,
  onGoToEditor,
  onGoToUpscaler,
  onGoToCompare,
  onSuccess,
}: PricingPageProps) {
  const PRO_PRICE_ID = (
    import.meta.env.VITE_PADDLE_PRO_PRICE_ID ||
    import.meta.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID ||
    "pri_01kxzry4t63gx1gg8set3b8352"
  )
    .trim()
    .replace(/['"]/g, "");

  const TOPUP_PRICE_ID = (
    import.meta.env.VITE_PADDLE_TOPUP_100_PRICE_ID ||
    import.meta.env.NEXT_PUBLIC_PADDLE_TOPUP_100_PRICE_ID ||
    "pri_01kxzs3cntjbews1fkk8w1fveb"
  )
    .trim()
    .replace(/['"]/g, "");

  const [promoCode, setPromoCode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code =
        params.get("redeem") ||
        params.get("key") ||
        params.get("voucher") ||
        params.get("promo") ||
        params.get("discount") ||
        params.get("code") ||
        params.get("coupon") ||
        sessionStorage.getItem("pending_redeem_key") ||
        "";
      return code.trim().toUpperCase();
    }
    return "";
  });

  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "PixelIsolate Pricing — AI Background Remover & 8K Upscaler Plans";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute(
        "content",
        "Compare PixelIsolate plans: 10 free credits with no card, $5 non-expiring 100-credit bundles, and $7.99/mo Pro for unlimited 4K/8K upscaling & bulk queues."
      );
    }
  }, []);

  const cleanCode = promoCode.trim().toUpperCase();
  const isMerchOsVipKey =
    cleanCode.startsWith("PIXEL-PRO-") ||
    cleanCode.startsWith("MIO-ENTERPRISE-") ||
    cleanCode.startsWith("MIO-ENT-") ||
    cleanCode.startsWith("MIO-YT-") ||
    cleanCode.startsWith("MIO-YOUTUBE-") ||
    cleanCode.startsWith("MIO-CREATOR-") ||
    cleanCode.includes("30DAYS") ||
    cleanCode.includes("30-DAY") ||
    cleanCode.includes("ALLACCESS") ||
    cleanCode === "MIO-TRIAL-ALLACCESS";

  const PRO_PROMO_CODES = [
    "APPZ20",
    "APPZ30",
    "APP20",
    "PHILIP30",
    "DETOUR30",
    "RJ30",
    "STARTUP30",
    "PRODUCTHUNT",
    "SAVE20",
    "PROMO20",
    "PIXEL20",
    "ISOLATE20",
    "OFF20",
  ];
  const CREDIT_PROMO_CODES = [
    "APPZ20",
    "APPZ30",
    "APP20",
    "PHILIP30",
    "DETOUR30",
    "RJ30",
    "SAVE20",
    "PROMO20",
    "PIXEL20",
    "ISOLATE20",
    "OFF20",
  ];

  const isProDiscountValid = PRO_PROMO_CODES.includes(cleanCode);
  const isCreditDiscountValid = CREDIT_PROMO_CODES.includes(cleanCode);
  const is30PercentCode =
    cleanCode === "STARTUP30" ||
    cleanCode === "RJ30" ||
    cleanCode === "PHILIP30" ||
    cleanCode === "DETOUR30" ||
    cleanCode === "APPZ30";

  const proDiscountPrice = is30PercentCode ? "$5.59" : "$6.39";
  const proDiscountBadgeLabel = is30PercentCode ? "30% OFF" : "20% OFF";
  const creditDiscountPrice = is30PercentCode ? "$3.50" : "$4.00";
  const creditDiscountBadgeLabel = is30PercentCode ? "30% OFF" : "20% OFF";

  const handleRedeemVoucher = async (codeToRedeem: string) => {
    if (!userId) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("pending_redeem_key", codeToRedeem);
      }
      onOpenAuth();
      return;
    }

    setRedeemLoading(true);
    setRedeemError(null);
    setRedeemSuccess(null);

    try {
      const endpoints = [
        `${API_BASE_URL}/api/billing/redeem-voucher`,
        "/api/billing/redeem-voucher",
      ];
      let lastError = "Connection error while redeeming key. Please try again.";
      let succeeded = false;

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              email: userEmail,
              voucherKey: codeToRedeem,
            }),
          });
          let data: any = null;
          try {
            data = await res.json();
          } catch {}

          if (res.ok && data?.success) {
            setRedeemSuccess("VIP Key Accepted! Your account has been upgraded to Pro Tier.");
            trackConversionEvent("voucher_redeemed", { plan: "pro" });
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("pending_redeem_key");
            }
            if (onSuccess) onSuccess();
            succeeded = true;
            break;
          } else if (data?.error) {
            lastError = data.error;
            break;
          }
        } catch {}
      }
      if (!succeeded) setRedeemError(lastError);
    } catch (err: any) {
      setRedeemError(err?.message || "Connection error while redeeming key.");
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleCheckout = (
    priceId: string,
    purchaseType: "subscription" | "credit_topup",
    creditsToGrant?: number
  ) => {
    trackConversionEvent("begin_checkout", {
      plan: purchaseType === "subscription" ? "pro_monthly" : "credits_100",
      value: purchaseType === "subscription" ? 7.99 : 5.0,
      currency: "USD",
    });

    if (!userId) {
      onOpenAuth();
      return;
    }

    const paddle = getPaddleInstance();
    if (paddle) {
      const attr = getAttribution();
      const checkoutOptions: any = {
        items: [{ priceId: priceId.trim(), quantity: 1 }],
        customer: userEmail ? { email: userEmail } : undefined,
        customData: {
          userId,
          purchaseType,
          creditsToGrant: creditsToGrant || 0,
          attributionSource: attr.source,
          attributionMedium: attr.medium,
          attributionCampaign: attr.campaign,
          landingPath: attr.landingPath,
        },
        settings: {
          displayMode: "overlay",
          theme: "dark",
          successUrl:
            purchaseType === "subscription"
              ? `${window.location.origin}/?payment=success`
              : `${window.location.origin}/?topup=success`,
        },
      };

      if (
        (purchaseType === "subscription" && isProDiscountValid) ||
        (purchaseType === "credit_topup" && isCreditDiscountValid)
      ) {
        checkoutOptions.discountCode = cleanCode;
      }

      paddle.Checkout.open(checkoutOptions);
    } else {
      alert("Payment engine loading... Please try again in a moment.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 sm:py-12 space-y-14">
      {/* Visible Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs font-mono text-gray-400"
      >
        <a href="/" className="hover:text-emerald-400 transition">
          Home
        </a>
        <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
        <span className="text-emerald-400 font-semibold">Pricing</span>
      </nav>

      {/* Hero Header */}
      <section className="text-center max-w-3xl mx-auto space-y-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
          <Zap className="h-3.5 w-3.5" />
          Transparent Plans • Paddle Merchant of Record
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          Simple, Transparent Pricing for AI Image Processing
        </h1>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
          Start free with 10 credits — no credit card required. Top up with non-expiring credit
          bundles or unlock unlimited 4K/8K upscaling and 50+ bulk queues with Pro.
        </p>
      </section>

      {/* Status Alerts */}
      {redeemSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 text-xs font-medium">
          <Sparkles className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{redeemSuccess}</span>
        </div>
      )}
      {redeemError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3 text-xs font-medium">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{redeemError}</span>
        </div>
      )}

      {/* 3 Plan Cards */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Free Tier */}
        <div className="rounded-2xl bg-gray-950/60 border border-gray-800 p-7 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-gray-400 mb-3">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                Starter
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">Free Tier</h2>
            <p className="text-gray-400 text-xs mt-1.5 mb-6">
              Test neural cutouts, HSV chroma keying, and edge refinement with zero risk.
            </p>

            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="text-gray-500 text-xs font-mono">no credit card</span>
            </div>

            <ul className="space-y-3 text-xs text-gray-300 border-t border-gray-900 pt-5 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>10 free credits</strong> on signup
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>3 HD trial exports</strong> (full native resolution)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>1 solid backdrop</strong> trial export
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>100% on-device WebAssembly privacy</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Manual Restore / Erase brush &amp; HSV controls</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => {
              trackConversionEvent("free_trial_click", { location: "pricing_page" });
              if (userId) {
                onGoToEditor();
              } else {
                onOpenAuth();
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-gray-700"
          >
            <span>{userId ? "Open Free Workspace" : "Start Free (10 Credits)"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Card 2: 100 Credit Bundle */}
        <div className="rounded-2xl bg-gray-950/60 border border-gray-800 p-7 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-teal-400 mb-3">
              <Package className="h-5 w-5" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                Pay-As-You-Go
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">100 Credit Bundle</h2>
            <p className="text-gray-400 text-xs mt-1.5 mb-6">
              Non-expiring top-ups for occasional high-resolution PNG exports.
            </p>

            <div className="flex items-baseline gap-2 mb-6">
              {isCreditDiscountValid ? (
                <>
                  <span className="text-4xl font-extrabold text-white">{creditDiscountPrice}</span>
                  <span className="text-sm text-gray-500 line-through">$5.00</span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">one-time</span>
                  <span className="ml-auto text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {creditDiscountBadgeLabel}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-extrabold text-white">$5</span>
                  <span className="text-gray-500 text-xs font-mono">one-time ($0.05/img)</span>
                </>
              )}
            </div>

            <ul className="space-y-3 text-xs text-gray-300 border-t border-gray-900 pt-5 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>100 non-expiring credits</strong> added instantly
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Full HD / Native Resolution</strong> transparent PNGs
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>No recurring monthly commitment</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Full commercial rights for Etsy, Amazon &amp; Shopify</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Single-file processing (upgrade to Pro for bulk)</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleCheckout(TOPUP_PRICE_ID, "credit_topup", 100)}
            className="w-full py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-gray-700"
          >
            <Package className="h-3.5 w-3.5 shrink-0" />
            <span>
              {isCreditDiscountValid
                ? `Buy 100 Credits (${creditDiscountPrice})`
                : "Buy 100 Credit Bundle ($5)"}
            </span>
          </button>
        </div>

        {/* Card 3: Pro Tier */}
        <div className="relative rounded-2xl bg-gray-950/80 border-2 border-emerald-500/50 p-7 flex flex-col justify-between shadow-2xl shadow-emerald-500/10 overflow-hidden">
          <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-bl-xl text-[10px] font-mono font-bold text-white uppercase tracking-wider">
            Most Popular
          </div>

          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-3">
              <Sparkles className="h-5 w-5" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider">
                Unlimited Power
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">Pro Tier</h2>
            <p className="text-gray-400 text-xs mt-1.5 mb-6">
              Built for POD sellers, e-commerce catalogs, and daily design production.
            </p>

            <div className="flex items-baseline gap-2 mb-6">
              {isMerchOsVipKey ? (
                <>
                  <span className="text-4xl font-extrabold text-emerald-400">$0.00</span>
                  <span className="text-sm text-gray-500 line-through">$7.99</span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">VIP FREE</span>
                </>
              ) : isProDiscountValid ? (
                <>
                  <span className="text-4xl font-extrabold text-white">{proDiscountPrice}</span>
                  <span className="text-sm text-gray-500 line-through">$7.99</span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">/ month</span>
                  <span className="ml-auto text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {proDiscountBadgeLabel}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-extrabold text-white">$7.99</span>
                  <span className="text-gray-500 text-xs font-mono">/ month</span>
                </>
              )}
            </div>

            <ul className="space-y-3 text-xs text-gray-300 border-t border-gray-900 pt-5 mb-8">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Unlimited</strong> background isolations &amp; HD exports
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>4K &amp; 8K AI Image Upscaler</strong> (Real-ESRGAN 300 DPI)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Parallel Bulk Queue</strong> (50+ files &amp; ZIP export)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Unlimited solid backdrops</strong> (#FFFFFF, #000000, custom hex)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Encrypted Cloud History Gallery</strong> (re-download anytime)
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Priority WASM execution &amp; cancel anytime</span>
              </li>
            </ul>
          </div>

          {isPro ? (
            <button
              type="button"
              onClick={onGoToEditor}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs cursor-pointer"
            >
              Active Pro Plan — Open Workspace
            </button>
          ) : isMerchOsVipKey ? (
            <button
              type="button"
              onClick={() => handleRedeemVoucher(cleanCode)}
              disabled={redeemLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-gray-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {redeemLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Activating Pro Tier...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Activate Free Pro Tier with VIP Key</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleCheckout(PRO_PRICE_ID, "subscription")}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>
                {isProDiscountValid
                  ? `Subscribe to Pro (${proDiscountPrice}/mo)`
                  : "Upgrade to Pro ($7.99/mo)"}
              </span>
            </button>
          )}
        </div>
      </section>

      {/* Promo Code Bar */}
      <section className="p-5 rounded-2xl bg-gray-950/70 border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-gray-300 font-mono">
          <Zap className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Have a promo code or MerchOS VIP key?</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex items-center w-full sm:w-auto">
            <input
              type="text"
              placeholder="Enter promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="px-3 py-2 pr-8 rounded-xl bg-gray-900 border border-gray-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 w-full sm:w-52 uppercase tracking-wider"
            />
            {promoCode.trim() && (
              <button
                type="button"
                onClick={() => setPromoCode("")}
                className="absolute right-2.5 text-gray-400 hover:text-white cursor-pointer"
                title="Clear promo code"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {promoCode.trim() && (
            <span
              className={`text-[10px] font-mono font-bold px-2.5 py-1.5 rounded-lg border whitespace-nowrap ${
                isMerchOsVipKey || isProDiscountValid || isCreditDiscountValid
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                  : "text-rose-400 bg-rose-500/10 border-rose-500/25"
              }`}
            >
              {isMerchOsVipKey
                ? "VIP 100% Free Pro"
                : isProDiscountValid || isCreditDiscountValid
                ? `${is30PercentCode ? "30%" : "20%"} OFF Applied`
                : "Invalid Code"}
            </span>
          )}
        </div>
      </section>

      {/* Internal Links to Core Tools & Compare */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/background-remover"
          onClick={(e) => {
            e.preventDefault();
            onGoToEditor();
          }}
          className="p-5 rounded-2xl bg-gray-950/50 border border-gray-800 hover:border-emerald-500/40 transition group"
        >
          <p className="text-xs font-mono text-emerald-400 mb-1">Core Tool</p>
          <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
            AI Background Remover →
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Zero-halo transparent PNG cutouts powered by on-device WebAssembly AI.
          </p>
        </a>
        <a
          href="/image-upscaler"
          onClick={(e) => {
            e.preventDefault();
            onGoToUpscaler();
          }}
          className="p-5 rounded-2xl bg-gray-950/50 border border-gray-800 hover:border-emerald-500/40 transition group"
        >
          <p className="text-xs font-mono text-emerald-400 mb-1">Super-Resolution</p>
          <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
            8K AI Image Upscaler →
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Scale Midjourney, Flux, and print graphics to 300 DPI 4K &amp; 8K PNGs.
          </p>
        </a>
        <a
          href="/compare"
          onClick={(e) => {
            e.preventDefault();
            onGoToCompare();
          }}
          className="p-5 rounded-2xl bg-gray-950/50 border border-gray-800 hover:border-emerald-500/40 transition group"
        >
          <p className="text-xs font-mono text-emerald-400 mb-1">Side-by-Side</p>
          <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
            Compare vs remove.bg &amp; Canva →
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            See how PixelIsolate compares on price, privacy, alpha precision, and POD workflows.
          </p>
        </a>
      </section>

      {/* Pricing FAQ */}
      <section className="space-y-6 pt-4 border-t border-gray-900">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-emerald-400" />
          <h2 className="text-2xl font-bold text-white">Pricing &amp; Billing FAQ</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRICING_FAQS.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-gray-950/50 border border-gray-800/80 space-y-2"
            >
              <h3 className="text-sm font-bold text-white">{item.q}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
