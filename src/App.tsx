/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import ChromaKeyer from "./components/ChromaKeyer";
import HistoryGallery from "./components/HistoryGallery";
import AuthModal from "./components/AuthModal";
import PricingModal from "./components/PricingModal";
import SubscriptionManager from "./components/SubscriptionManager";
import LandingPage from "./components/LandingPage";
import HowToGuide from "./components/HowToGuide";
import { supabase } from "./utils/supabaseClient";
import { initializePaddle } from "@paddle/paddle-js";
import { 
  FileCheck, 
  Layers, 
  LogIn, 
  LogOut, 
  Sparkles, 
  History, 
  Sliders,
  CreditCard,
  HelpCircle
} from "lucide-react";

// Helper: Dynamically crop blank/transparent padding edges from the logo PNG on the client side
function cropImageTransparentEdges(imgElement: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return imgElement.src;

  canvas.width = imgElement.naturalWidth;
  canvas.height = imgElement.naturalHeight;
  ctx.drawImage(imgElement, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const width = imgData.width;
  const height = imgData.height;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    return imgElement.src;
  }

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = cropWidth;
  cropCanvas.height = cropHeight;
  const cropCtx = cropCanvas.getContext("2d");
  if (!cropCtx) return imgElement.src;

  cropCtx.drawImage(
    canvas,
    minX,
    minY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  return cropCanvas.toDataURL();
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState<"editor" | "history" | "billing" | "howto">("editor");
  const [logoSrc, setLogoSrc] = useState("/logo.png");

  useEffect(() => {
    initializePaddle({
      environment: (import.meta.env.VITE_PADDLE_ENV || "sandbox") as any,
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN || "",
    });
  }, []);

  useEffect(() => {
    const img = new Image();
    img.src = "/logo.png";
    img.onload = () => {
      try {
        const cropped = cropImageTransparentEdges(img);
        setLogoSrc(cropped);
      } catch (e) {
        console.warn("Failed to crop transparent edges of logo:", e);
      }
    };
  }, []);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // Global-like Alert UI state
  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "Notification",
    message: "",
  });

  useEffect(() => {
    // 1. Initial session load
    supabase.auth.getSession().then(({ data: { session } }) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        fetchProfile(activeUser.id, activeUser.email || "");
      }
    });

    // 2. Auth state subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUser = session?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        fetchProfile(activeUser.id, activeUser.email || "");
      } else {
        setProfile(null);
      }
    });

    // 3. Override standard window.alert with our premium custom dialog
    window.alert = (message: string) => {
      setCustomAlert({
        isOpen: true,
        title: "Workspace Message",
        message: message,
      });
    };

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      // Fallback: If profile row not found in database, insert it immediately client-side
      if (error && (error.code === "PGRST116" || error.message?.includes("rows"))) {
        console.info("[Auth] Profile not found in database. Auto-creating client-side...");
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId, email: email, credits: 10, hd_credits_remaining: 3, is_pro: false })
          .select()
          .single();
        
        if (!insertError) {
          data = newProfile;
          error = null;
        } else {
          console.warn("[Auth] Client-side profile insert failed:", insertError);
        }
      }

      if (error) {
        console.warn("Profile fetch failed, using memory state:", error);
        setProfile({
          id: userId,
          email: email,
          credits: 10,
          hd_credits_remaining: 3,
          is_pro: false
        });
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCurrentTab("editor");
  };

  return (
    <div id="app-container" className="min-h-screen bg-[#0a0b0d] text-gray-100 flex flex-col antialiased selection:bg-emerald-500/30 selection:text-white">
      {/* Upper Navigation / Editorial Header */}
      <header className="border-b border-gray-900 bg-gray-950/40 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex items-center">
            <img src={logoSrc} alt="Pixel-Level Image Isolation Workspace" className="h-11 md:h-13 w-auto object-contain" />
          </div>

          {/* Navigation Controls and User Account Block */}
          <div className="flex flex-wrap items-center gap-4">
            {/* View Tabs */}
            <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-850">
              <button
                onClick={() => setCurrentTab("editor")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  currentTab === "editor"
                    ? "bg-gray-850 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Editor Workspace</span>
              </button>

              <button
                onClick={() => setCurrentTab("howto")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  currentTab === "howto"
                    ? "bg-gray-850 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>How It Works</span>
              </button>

              {user && (
                <>
                  <button
                    onClick={() => {
                      if (!profile?.is_pro) {
                        setPricingModalOpen(true);
                        alert("History Gallery is a Pro feature. Please upgrade your workspace to automatically archive and re-download your isolated assets.");
                      } else {
                        setCurrentTab("history");
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                      currentTab === "history"
                        ? "bg-gray-850 text-white"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <History className="h-3.5 w-3.5" />
                    <span>My History</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab("billing")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                      currentTab === "billing"
                        ? "bg-gray-850 text-white"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>Billing & Subscription</span>
                  </button>
                </>
              )}
            </div>

            {/* Profile Info / Auth Actions */}
            {user ? (
              <div className="flex items-center gap-3 bg-gray-950/80 border border-gray-850 px-4.5 py-1.5 rounded-xl text-xs font-mono">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-gray-500 truncate max-w-[120px]">{user.email}</span>
                  {profile?.is_pro ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px] uppercase tracking-wider">
                      <Sparkles className="h-3 w-3 animate-pulse" />
                      Pro Tier
                    </span>
                  ) : (
                    <span className="text-teal-400 text-[10px] font-semibold">
                      Credits: {profile?.credits ?? 0} ({profile?.hd_credits_remaining ?? 0} HD) remaining
                    </span>
                  )}
                </div>

                {!profile?.is_pro && (
                  <button
                    onClick={() => setPricingModalOpen(true)}
                    className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-[10px] rounded-lg hover:shadow-lg transition cursor-pointer"
                  >
                    Upgrade
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-400 transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-gray-950 hover:bg-gray-800 border border-gray-850 text-xs font-semibold text-gray-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold hover:shadow-lg transition cursor-pointer"
                >
                  Get 10 Free Credits
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {currentTab === "howto" && (
          <HowToGuide 
            onGoToEditor={() => {
              if (user) {
                setCurrentTab("editor");
              } else {
                setAuthModalOpen(true);
              }
            }}
            isLoggedIn={!!user}
          />
        )}
        
        {currentTab === "editor" && (
          user ? (
            <ChromaKeyer 
              user={user} 
              profile={profile} 
              onRefreshProfile={() => user && fetchProfile(user.id, user.email || "")} 
              onOpenPricing={() => setPricingModalOpen(true)}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          ) : (
            <LandingPage onOpenAuth={() => setAuthModalOpen(true)} />
          )
        )}

        {currentTab === "history" && user && (
          <HistoryGallery userId={user?.id} isPro={profile?.is_pro ?? false} />
        )}

        {currentTab === "billing" && user && (
          <SubscriptionManager 
            userId={user.id} 
            credits={profile?.credits ?? 0} 
            hdCredits={profile?.hd_credits_remaining ?? 0}
            isPro={profile?.is_pro ?? false} 
            onOpenPricing={() => setPricingModalOpen(true)}
          />
        )}
      </main>

      {/* Footer Details */}
      <footer className="border-t border-gray-900 bg-gray-950/30 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 justify-between items-center text-[11px] font-mono text-gray-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
            <span>© 2026 Chroma Isolate Engine. Powered by Supabase & Paddle.</span>
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentTab("howto")}
                className="hover:text-gray-300 transition duration-150 bg-transparent border-none cursor-pointer text-[11px] font-mono text-gray-500"
              >
                How It Works
              </button>
              <a href="/terms" className="hover:text-gray-300 transition duration-150">Terms of Service</a>
              <a href="/privacy" className="hover:text-gray-300 transition duration-150">Privacy Policy</a>
              <a href="/refund" className="hover:text-gray-300 transition duration-150">Refund Policy</a>
              <a href="mailto:contact@pixelisolate.online" className="hover:text-gray-300 transition duration-150">Contact Support</a>
            </div>
          </div>
          <div className="flex gap-4">
            <span className="hover:text-gray-300 transition cursor-help flex items-center gap-1">
              <FileCheck className="h-3 w-3" />
              Subpixel Feathering Mode Active
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          // Profile updates automatically
        }}
      />

      <PricingModal
        isOpen={pricingModalOpen}
        onClose={() => setPricingModalOpen(false)}
        userId={user?.id || null}
        userEmail={user?.email || null}
      />

      {/* Custom Alert Modal */}
      {customAlert.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}>
          <div className="relative w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl overflow-hidden text-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-16 -left-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit mx-auto mb-4">
              <Sparkles className="h-6 w-6" />
            </div>
            
            <h3 className="text-base font-bold text-white tracking-tight">{customAlert.title}</h3>
            <p className="text-xs text-gray-400 mt-2 mb-6 leading-relaxed whitespace-pre-line">
              {customAlert.message}
            </p>
            
            <button
              onClick={() => setCustomAlert(prev => ({ ...prev, isOpen: false }))}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs hover:shadow-lg transition cursor-pointer"
            >
              Okay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
