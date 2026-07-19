import React from "react";
import { Check, X, ShieldAlert, Sparkles, Zap, Package } from "lucide-react";

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function PricingModal({ isOpen, onClose, userId }: PricingModalProps) {
  if (!isOpen) return null;

  // Lemon Squeezy variants (mock store checkout links or real ones)
  const LEMON_SQUEEZY_STORE_URL = import.meta.env.VITE_LEMON_SQUEEZY_STORE_URL || "https://pixelisolate.lemonsqueezy.com";
  const PRO_VARIANT_ID = import.meta.env.VITE_LEMON_SQUEEZY_PRO_VARIANT_ID || "1225493"; // Pro Subscription Variant
  const CREDITS_100_VARIANT_ID = import.meta.env.VITE_LEMON_SQUEEZY_CREDITS_VARIANT_ID || "1225505"; // 100 Credits Variant

  const handleCheckout = (variantId: string) => {
    if (!userId) {
      alert("Please log in or sign up first to purchase subscriptions or credits.");
      return;
    }

    // Redirect to Lemon Squeezy checkout with custom parameters (user_id)
    const checkoutUrl = `${LEMON_SQUEEZY_STORE_URL}/checkout/buy/${variantId}?checkout[custom][user_id]=${userId}`;
    window.open(checkoutUrl, "_blank");
  };

  const mockTriggerPro = () => {
    alert(
      `Redirecting user ${userId ? userId.substring(0, 8) : "guest"} to billing checkout...\n(Mock checkout triggered. In production, this opens Lemon Squeezy checkout.)`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-955/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accents */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2">
              <Sparkles className="h-3 w-3 animate-spin animate-duration-3000" />
              Pro Upgrades
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight">Unlock Unlimited Potential & High Resolution</h2>
            <p className="text-gray-400 text-sm mt-1">Get crystal-clear HD downloads, batch imports, and priority WASM processing.</p>
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
          {/* Card 1: Subscription Tier (Pro) */}
          <div className="relative rounded-2xl bg-gray-950/60 border border-emerald-500/30 p-6 flex flex-col justify-between shadow-lg overflow-hidden group">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-bl-xl text-[9px] font-mono font-bold text-white uppercase tracking-wider shadow">
              Most Popular
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-emerald-400 mb-3">
                <Zap className="h-5 w-5" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider">Unlimited Subscription</span>
              </div>
              <h3 className="text-xl font-bold text-white">Pro Plan</h3>
              <p className="text-gray-400 text-xs mt-1.5 mb-6">Perfect for designers, creators, and daily power-users.</p>
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-white">$7.99</span>
                <span className="text-gray-500 text-xs font-mono">/ month</span>
              </div>

              <ul className="flex flex-col gap-3.5 text-xs text-gray-300 border-t border-gray-900 pt-5 mb-8">
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
                handleCheckout(PRO_VARIANT_ID);
                mockTriggerPro();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99] transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span>Subscribe to Pro</span>
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
              
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-3xl font-extrabold text-white">$5</span>
                <span className="text-gray-500 text-xs font-mono">one-time</span>
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
                handleCheckout(CREDITS_100_VARIANT_ID);
                mockTriggerPro();
              }}
              className="w-full py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold text-xs active:scale-[0.99] transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 border border-gray-700"
            >
              <Package className="h-3.5 w-3.5 shrink-0" />
              <span>Purchase Credits</span>
            </button>
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
