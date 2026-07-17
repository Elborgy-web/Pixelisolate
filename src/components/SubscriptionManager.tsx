import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { CreditCard, Zap, Coins, ArrowUpRight, Loader2, Sparkles, AlertCircle } from "lucide-react";

interface SubscriptionManagerProps {
  userId: string;
  credits: number;
  isPro: boolean;
  onOpenPricing: () => void;
}

export default function SubscriptionManager({ userId, credits, isPro, onOpenPricing }: SubscriptionManagerProps) {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const { data, error } = await supabase
          .from("lemon_squeezy_subscriptions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!error && data) {
          setSubscription(data);
        }
      } catch (err) {
        console.error("Failed to load subscription details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSubscription();
  }, [userId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (_) {
      return dateString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "on_trial":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      case "cancelled":
        return "bg-amber-500/10 border-amber-500/20 text-amber-400";
      case "past_due":
      case "unpaid":
        return "bg-red-500/10 border-red-500/20 text-red-400";
      default:
        return "bg-gray-500/10 border-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4 animate-fade-in">
      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-xl font-bold tracking-tight text-white font-sans flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          <span>Billing & Subscription</span>
        </h2>
        <p className="text-xs text-gray-500 font-mono">
          Manage your active workspace plans, view billing portals, and track credit allocations
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col gap-3 justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
          <span className="text-xs text-gray-500 font-mono">Querying database states...</span>
        </div>
      ) : (
        <div className={isPro ? "max-w-md mx-auto" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
          {/* Active Plan Management */}
          <div className="relative bg-gray-900/40 border border-gray-850 rounded-2xl p-6 shadow-xl backdrop-blur-md overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Plan Overview</span>
                  {isPro ? (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1">
                      <Zap className="h-3 w-3 fill-current" />
                      PRO ACTIVE
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide bg-gray-800 border border-gray-700 text-gray-400">
                      FREE TIER
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  {isPro ? "PixelIsolate Pro Plan" : "Free Trial Workspace"}
                </h3>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                  {isPro 
                    ? "Enjoy unlimited background removal cuts, priority HSV masking queues, and batch download operations."
                    : "Upgrade to the Pro tier to unlock unlimited removals and bulk upload packaging up to 50 assets concurrently."}
                </p>

                {isPro && subscription && (
                  <div className="space-y-3 mb-6 p-4 rounded-xl bg-gray-950/60 border border-gray-850/60 font-mono text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subscription Status:</span>
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase border ${getStatusColor(subscription.status)}`}>
                        {subscription.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Next Renewal Date:</span>
                      <span className="text-gray-300 font-semibold">{formatDate(subscription.renews_at)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                {isPro ? (
                  <a
                    href="https://pixelisolate.lemonsqueezy.com/billing"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-gray-950 hover:bg-gray-800 border border-gray-850 rounded-xl py-3 text-white font-medium text-xs flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                  >
                    <span>Manage Billing & Cancel/Renew</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <button
                    onClick={onOpenPricing}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-xs hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99] transition duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Upgrade to Pro Plan — $9/mo</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Credit Balance Tracker */}
          {!isPro && (
            <div className="relative bg-gray-900/40 border border-gray-850 rounded-2xl p-6 shadow-xl backdrop-blur-md overflow-hidden">
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Credits Monitor</span>
                    <span className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                      <Coins className="h-4 w-4" />
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="text-3xl font-extrabold text-white tracking-tight font-sans flex items-baseline gap-1">
                      <span>{credits}</span>
                      <span className="text-xs font-mono font-medium text-gray-500 uppercase tracking-wide">credits</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 mt-1 block">HD Extraction Balance Active</span>
                  </div>

                  <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                    Every high-definition cut or feathering download utilizes 1 credit. Buy one-time credit top-up bundles if you run out of trial allocations. Credits never expire and carry over.
                  </p>
                </div>

                <div>
                  <button
                    onClick={onOpenPricing}
                    className="w-full bg-gray-950 hover:bg-gray-800 border border-gray-850 rounded-xl py-3 text-white font-medium text-xs flex items-center justify-center gap-2 transition duration-200 cursor-pointer"
                  >
                    <Coins className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Top Up Balance — Get 100 Credits ($5)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
