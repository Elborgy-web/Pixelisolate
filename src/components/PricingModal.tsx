import React from "react";
import { Check, X, ShieldAlert, Sparkles, Zap, Package } from "lucide-react";
import { getPaddleInstance } from "@paddle/paddle-js";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
  userEmail: string | null;
}

export default function PricingModal({ isOpen, onClose, userId, userEmail }: PricingModalProps) {
  if (!isOpen) return null;

  // Paddle price IDs
  const PRO_PRICE_ID = (
    import.meta.env.VITE_PADDLE_PRO_PRICE_ID || 
    import.meta.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID || 
    "pri_01kxzry4t63gx1gg8set3b8352"
  ).trim().replace(/['"]/g, "");
  
  const TOPUP_PRICE_ID = (
    import.meta.env.VITE_PADDLE_TOPUP_100_PRICE_ID || 
    import.meta.env.NEXT_PUBLIC_PADDLE_TOPUP_100_PRICE_ID || 
    "pri_01kxzs3cntjbews1fkk8w1fveb"
  ).trim().replace(/['"]/g, "");

  const [promoCode, setPromoCode] = React.useState("");

  // Valid promo code definitions
  const cleanCode = promoCode.trim().toUpperCase();
  const PRO_PROMO_CODES = ["PHILIP30", "DETOUR30", "RJ30", "STARTUP30", "PRODUCTHUNT", "SAVE20", "PROMO20", "PIXEL20", "ISOLATE20", "OFF20"];
  const CREDIT_PROMO_CODES = ["PHILIP30", "DETOUR30", "RJ30", "SAVE20", "PROMO20", "PIXEL20", "ISOLATE20", "OFF20"];

  const isProDiscountValid = PRO_PROMO_CODES.includes(cleanCode);
  const isCreditDiscountValid = CREDIT_PROMO_CODES.includes(cleanCode);

  const is30PercentCode = cleanCode === "STARTUP30" || cleanCode === "RJ30" || cleanCode === "PHILIP30" || cleanCode === "DETOUR30";
  const proDiscountPrice = is30PercentCode ? "$5.59" : "$6.39";
  const proDiscountBadgeLabel = is30PercentCode ? "30% OFF" : "20% OFF";

  const creditDiscountPrice = is30PercentCode ? "$3.50" : "$4.00";
  const creditDiscountBadgeLabel = is30PercentCode ? "30% OFF" : "20% OFF";

  const handleCheckout = (priceId: string, purchaseType: "subscription" | "credit_topup", creditsToGrant?: number) => {
    if (!userId) {
      alert("Please log in or sign up first to purchase subscriptions or credits.");
      return;
    }

    const paddle = getPaddleInstance();
    if (paddle) {
      const checkoutOptions: any = {
        items: [{ priceId: priceId.trim(), quantity: 1 }],
        customer: userEmail ? { email: userEmail } : undefined,
        customData: {
          userId,
          purchaseType,
          creditsToGrant: creditsToGrant || 0,
        },
        settings: {
          displayMode: "overlay",
          theme: "dark",
          successUrl: purchaseType === "subscription" 
            ? `${window.location.origin}/dashboard?payment=success` 
            : `${window.location.origin}/dashboard?topup=success`
        }
      };

      // Pass discount code to Paddle checkout if valid code is entered
      if ((purchaseType === "subscription" && isProDiscountValid) || (purchaseType === "credit_topup" && isCreditDiscountValid)) {
        checkoutOptions.discountCode = cleanCode;
      }

      paddle.Checkout.open(checkoutOptions);
    } else {
      alert("Payment engine loading... Please try again in a moment.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-955/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient backdrops */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">
              <Zap className="h-3 w-3 animate-spin animate-duration-3000" />
              Pro Upgrades
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Unlock Unlimited Potential & High Resolution
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Get crystal-clear HD downloads, batch imports, and priority WASM processing.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-gray-950 hover:bg-gray-800 border border-gray-850 text-gray-400 hover:text-white transition duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Card 1: Pro Subscription */}
          <div className="relative rounded-2xl bg-gray-950/60 border border-emerald-500/30 p-6 flex flex-col justify-between shadow-lg overflow-hidden group">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-bl-xl text-[9px] font-mono font-bold text-white uppercase tracking-wider shadow">
              Most Popular
            </div>

            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-3">
                <Sparkles className="h-5 w-5" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider">Unlimited Subscription</span>
              </div>
              <h3 className="text-xl font-bold text-white">Pro Plan</h3>
              <p className="text-gray-400 text-xs mt-1.5 mb-6">Perfect for designers, creators, and daily power-users.</p>

              <div className="flex items-baseline gap-2 mb-6">
                {isProDiscountValid ? (
                  <>
                    <span className="text-3xl font-extrabold text-white tracking-tight">{proDiscountPrice}</span>
                    <span className="text-sm text-gray-500 line-through">$7.99</span>
                    <span className="text-xs text-emerald-400 font-mono font-bold">/ month</span>
                    <span className="ml-auto text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                      {proDiscountBadgeLabel}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-white">$7.99</span>
                    <span className="text-gray-500 text-xs font-mono">/ month</span>
                  </>
                )}
              </div>

              <ul className="flex flex-col gap-3.5 text-xs text-gray-300 border-t border-gray-900 pt-5 mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>4K & 8K AI Image Upscaler</strong> (Graphic, Product, Portrait tuning)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>Unlimited</strong> background isolations</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>HD / Full-Resolution</strong> exports (No caps)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>Unlimited</strong> custom solid backdrops (White/Black/Hex)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>Batch Processing</strong> (Drop multiple files at once)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>Secure History Gallery</strong> (Re-download assets anytime)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Priority WASM execution speeds</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                handleCheckout(PRO_PRICE_ID, "subscription");
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99] transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              <span>{isProDiscountValid ? `Subscribe to Pro (${proDiscountPrice}/mo)` : "Subscribe to Pro"}</span>
            </button>
          </div>

          {/* Card 2: Pay-As-You-Go Credits */}
          <div className="relative rounded-2xl bg-gray-950/30 border border-gray-850 p-6 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-2 text-teal-400 mb-3">
                <Package className="h-5 w-5" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider">Pay-As-You-Go</span>
              </div>
              <h3 className="text-xl font-bold text-white">100 Credit Bundle</h3>
              <p className="text-gray-400 text-xs mt-1.5 mb-6">For casual users who only need high-res files occasionally.</p>
              
              <div className="flex items-baseline gap-2 mb-6">
                {isCreditDiscountValid ? (
                  <>
                    <span className="text-3xl font-extrabold text-white tracking-tight">{creditDiscountPrice}</span>
                    <span className="text-sm text-gray-500 line-through">$5.00</span>
                    <span className="text-xs text-emerald-400 font-mono font-bold">one-time</span>
                    <span className="ml-auto text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider">
                      {creditDiscountBadgeLabel}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-white">$5</span>
                    <span className="text-gray-500 text-xs font-mono">one-time</span>
                  </>
                )}
              </div>

              <ul className="flex flex-col gap-3.5 text-xs text-gray-300 border-t border-gray-900 pt-5 mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>100 credits</strong> added to your account</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span><strong>HD / Full-Resolution</strong> exports</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Credits never expire</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Single file uploads only (no batch)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                handleCheckout(TOPUP_PRICE_ID, "credit_topup", 100);
              }}
              className="w-full py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs active:scale-[0.99] transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 border border-gray-700"
            >
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span>{isCreditDiscountValid ? `Purchase Credits (${creditDiscountPrice})` : "Purchase Credits"}</span>
            </button>
          </div>
        </div>

        {/* Promo Code Input Bar */}
        <div className="mb-6 p-4 rounded-2xl bg-gray-950/60 border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-300 font-mono">
            <Zap className="h-4 w-4 text-emerald-400 shrink-0 animate-pulse" />
            <span>Have a Promo Code?</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex items-center w-full sm:w-auto">
              <input
                type="text"
                placeholder="Promo code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="px-3 py-1.5 pr-7 rounded-xl bg-gray-900 border border-gray-800 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 w-full sm:w-44 uppercase tracking-wider"
              />
              {promoCode.trim() && (
                <button
                  type="button"
                  onClick={() => setPromoCode("")}
                  className="absolute right-2 text-gray-400 hover:text-white transition duration-150 cursor-pointer p-0.5"
                  title="Remove promo code"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {promoCode.trim() && (
              isProDiscountValid || isCreditDiscountValid ? (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 whitespace-nowrap">
                  {is30PercentCode
                    ? "30% OFF Applied"
                    : cleanCode === "PRODUCTHUNT"
                    ? "20% OFF Pro Plan Applied"
                    : "20% OFF Applied"}
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/20 whitespace-nowrap">
                  Not Applied
                </span>
              )
            )}
          </div>
        </div>

        {/* Footer Warning / Notice */}
        <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-[11px] text-amber-300 font-mono">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
          <p>
            <strong>Freemium Limits:</strong> Guests and Free users are limited to low-resolution downloads (max 500px).
            1 credit is consumed per export. Upgrade to Pro for high-res output and batch operations.
          </p>
        </div>
      </div>
    </div>
  );
}
