/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import { supabase } from "./utils/supabaseClient";
import { initializePaddle } from "@paddle/paddle-js";

import BlogIndex from "./components/BlogIndex";
import BlogPostDetail from "./components/BlogPostDetail";
import ErrorBoundary from "./components/ErrorBoundary";

// Helper to auto-retry dynamic imports when new builds are deployed (prevents chunk load white screens)
const lazyWithRetry = <T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) =>
  React.lazy(async () => {
    const pageHasBeenRefreshed = sessionStorage.getItem("page_refreshed_for_new_build");

    try {
      return await componentImport();
    } catch (error) {
      console.warn("[LazyRetry] Dynamic chunk import failed (stale build deployment hash).", error);
      if (!pageHasBeenRefreshed) {
        sessionStorage.setItem("page_refreshed_for_new_build", "true");
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      sessionStorage.removeItem("page_refreshed_for_new_build");
      throw error;
    }
  });

// Lazy-loaded heavy modal and canvas components with automatic retry
const ChromaKeyer = lazyWithRetry(() => import("./components/ChromaKeyer"));
const HistoryGallery = lazyWithRetry(() => import("./components/HistoryGallery"));
const AuthModal = lazyWithRetry(() => import("./components/AuthModal"));
const PricingModal = lazyWithRetry(() => import("./components/PricingModal"));
const EmbedBadgeModal = lazyWithRetry(() => import("./components/EmbedBadgeModal"));
const SubscriptionManager = lazyWithRetry(() => import("./components/SubscriptionManager"));
const HowToGuide = lazyWithRetry(() => import("./components/HowToGuide"));
const CreatePostModal = lazyWithRetry(() => import("./components/CreatePostModal"));
const UserProfileModal = lazyWithRetry(() => import("./components/UserProfileModal"));

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 p-8 font-mono text-xs text-gray-400">
    <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    <span>Loading Workspace Component...</span>
  </div>
);
import { 
  FileCheck, 
  Layers, 
  LogIn, 
  LogOut, 
  Sparkles, 
  History, 
  Sliders,
  CreditCard,
  HelpCircle,
  BookOpen
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
  const [currentTab, setCurrentTab] = useState<"editor" | "history" | "billing" | "howto" | "blog">("editor");
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | null>(null);
  const [logoSrc, setLogoSrc] = useState("/logo.png");

  useEffect(() => {
    async function initPaddle() {
      try {
        const apiBase = (import.meta.env.VITE_API_URL || "").trim();
        const response = await fetch(`${apiBase}/api/billing/config`);
        if (!response.ok) throw new Error(`Server returned status ${response.status}`);
        const config = await response.json();
        
        if (config.token) {
          await initializePaddle({
            environment: config.environment as any,
            token: config.token,
          });
          console.log("[Paddle] Dynamically initialized SDK successfully using runtime backend variables.");
        } else {
          console.warn("[Paddle] No client token returned from backend. Retrying with static build-time fallbacks.");
          // Build-time fallback as backup
          const environment = (import.meta.env.VITE_PADDLE_ENV || import.meta.env.NEXT_PUBLIC_PADDLE_ENV || "production").trim().replace(/['"]/g, "");
          const token = (import.meta.env.VITE_PADDLE_CLIENT_TOKEN || import.meta.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "").trim().replace(/['"]/g, "");
          if (token) {
            await initializePaddle({ environment: environment as any, token });
          }
        }
      } catch (err) {
        console.error("[Paddle] Dynamic SDK initialization failed. Using static build fallbacks:", err);
        const environment = (import.meta.env.VITE_PADDLE_ENV || import.meta.env.NEXT_PUBLIC_PADDLE_ENV || "production").trim().replace(/['"]/g, "");
        const token = (import.meta.env.VITE_PADDLE_CLIENT_TOKEN || import.meta.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "").trim().replace(/['"]/g, "");
        if (token) {
          try {
            await initializePaddle({ environment: environment as any, token });
          } catch (e) {
            console.error("[Paddle] Fallback initialization failed:", e);
          }
        }
      }
    }
    initPaddle();
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
  const [embedBadgeModalOpen, setEmbedBadgeModalOpen] = useState(false);
  const [createPostModalOpen, setCreatePostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);

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

    // 4. Initial URL Path Routing for /blog and /blog/:slug (with ?redirect= handling)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get("redirect");
    let initPath = redirectParam ? decodeURIComponent(redirectParam) : window.location.pathname;

    if (redirectParam) {
      window.history.replaceState({}, "", initPath);
    }

    if (initPath.startsWith("/blog")) {
      const parts = initPath.split("/blog");
      const slugPart = parts[1] ? parts[1].replace(/^\//, "") : "";
      setCurrentTab("blog");
      setSelectedBlogSlug(slugPart || null);
    }

    const handlePopState = () => {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/blog")) {
        const parts = currentPath.split("/blog");
        const slugPart = parts[1] ? parts[1].replace(/^\//, "") : "";
        setCurrentTab("blog");
        setSelectedBlogSlug(slugPart || null);
      } else {
        setSelectedBlogSlug(null);
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    // 1. Read cached profile from localStorage for instant persistence across page refreshes
    let localCached: any = null;
    try {
      const raw = localStorage.getItem(`pixelisolate_profile_${userId}`);
      if (raw) localCached = JSON.parse(raw);
    } catch (e) {}

    const isVipEmail = email.toLowerCase().includes("elborgy") || 
                       email.toLowerCase().includes("admin") || 
                       email.toLowerCase() === "rjhustles@gmail.com" ||
                       email.toLowerCase() === "detourdesignllc@gmail.com" ||
                       email.toLowerCase() === "philip@philipanders.com";

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
          .insert({
            id: userId,
            email: email,
            display_name: localCached?.display_name || email.split("@")[0],
            avatar_url: localCached?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${userId}`,
            bio: localCached?.bio || "",
            role: localCached?.role || (isVipEmail ? "admin" : "user"),
            credits: isVipEmail ? 9999 : 10,
            hd_credits_remaining: isVipEmail ? 9999 : 3,
            solid_bg_trials_remaining: isVipEmail ? 9999 : 3,
            is_pro: isVipEmail ? true : false
          })
          .select()
          .single();
        
        if (!insertError) {
          data = newProfile;
          error = null;
        }
      }

      if (!error && data) {
        const merged = {
          ...data,
          display_name: localCached?.display_name || data.display_name || email.split("@")[0],
          avatar_url: localCached?.avatar_url || data.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${userId}`,
          bio: localCached?.bio || data.bio || "",
          role: localCached?.role || data.role || (isVipEmail ? "admin" : "user"),
          is_pro: isVipEmail ? true : (data.is_pro ?? false),
          credits: isVipEmail ? Math.max(data.credits || 0, 9999) : (data.credits ?? 10),
          hd_credits_remaining: isVipEmail ? Math.max(data.hd_credits_remaining || 0, 9999) : (data.hd_credits_remaining ?? 3),
          solid_bg_trials_remaining: isVipEmail ? 9999 : (data.solid_bg_trials_remaining ?? 3)
        };
        setProfile(merged);
        try {
          localStorage.setItem(`pixelisolate_profile_${userId}`, JSON.stringify(merged));
        } catch (e) {}
        return;
      }
    } catch (err) {
      console.warn("Error loading profile from DB, using cached/fallback profile:", err);
    }

    const fallbackProfile = localCached || {
      id: userId,
      email: email,
      display_name: email.split("@")[0],
      avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${userId}`,
      bio: "",
      role: isVipEmail ? "admin" : "user",
      credits: isVipEmail ? 9999 : 10,
      hd_credits_remaining: isVipEmail ? 9999 : 3,
      solid_bg_trials_remaining: isVipEmail ? 9999 : 3,
      is_pro: isVipEmail ? true : false
    };
    setProfile(fallbackProfile);
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
      <header className="border-b border-gray-900 bg-gray-950/40 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5 md:py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-2.5 md:gap-4 justify-between items-start md:items-center">
          <div className="flex items-center justify-between w-full md:w-auto">
            <img src={logoSrc} alt="Pixel-Level Image Isolation Workspace" className="h-8 sm:h-10 md:h-13 w-auto object-contain" />
          </div>

          {/* Navigation Controls and User Account Block */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full md:w-auto justify-between sm:justify-start">
            {/* View Tabs */}
            <div className="flex bg-gray-950 p-0.5 sm:p-1 rounded-xl border border-gray-850 overflow-x-auto max-w-full">
              <button
                onClick={() => {
                  window.history.pushState({}, "", "/");
                  setCurrentTab("editor");
                  setSelectedBlogSlug(null);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wide transition whitespace-nowrap ${
                  currentTab === "editor"
                    ? "bg-gray-850 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Sliders className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                <span>Editor Workspace</span>
              </button>

              <button
                onClick={() => {
                  window.history.pushState({}, "", "/blog");
                  setCurrentTab("blog");
                  setSelectedBlogSlug(null);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wide transition whitespace-nowrap ${
                  currentTab === "blog"
                    ? "bg-gray-850 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-emerald-400" />
                <span>Blog</span>
              </button>

              <button
                onClick={() => {
                  window.history.pushState({}, "", "/");
                  setCurrentTab("howto");
                  setSelectedBlogSlug(null);
                }}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wide transition whitespace-nowrap ${
                  currentTab === "howto"
                    ? "bg-gray-850 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <HelpCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
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
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wide transition whitespace-nowrap ${
                      currentTab === "history"
                        ? "bg-gray-850 text-white"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <History className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span>My History</span>
                  </button>
                  <button
                    onClick={() => setCurrentTab("billing")}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold tracking-wide transition whitespace-nowrap ${
                      currentTab === "billing"
                        ? "bg-gray-850 text-white"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    <CreditCard className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                    <span>Billing & Subscription</span>
                  </button>
                </>
              )}
            </div>

            {/* Profile Info / Auth Actions */}
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 bg-gray-950/80 border border-gray-850 px-3 sm:px-4.5 py-1 sm:py-1.5 rounded-xl text-[11px] sm:text-xs font-mono">
                <div className="flex flex-col text-left">
                  <span className="text-[9px] text-gray-500 truncate max-w-[100px] sm:max-w-[120px]">{user.email}</span>
                  {profile?.is_pro ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[9px] sm:text-[10px] uppercase tracking-wider">
                      <Sparkles className="h-3 w-3 animate-pulse shrink-0" />
                      Pro Tier
                    </span>
                  ) : (
                    <span className="text-teal-400 text-[9px] sm:text-[10px] font-semibold truncate">
                      Credits: {profile?.credits ?? 0} ({profile?.hd_credits_remaining ?? 0} HD)
                    </span>
                  )}
                </div>

                {!profile?.is_pro && (
                  <button
                    onClick={() => setPricingModalOpen(true)}
                    className="px-2 sm:px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-[9px] sm:text-[10px] rounded-lg hover:shadow-lg transition cursor-pointer shrink-0"
                  >
                    Upgrade
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="p-1 sm:p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-red-400 transition cursor-pointer shrink-0"
                  title="Logout"
                >
                  <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-gray-950 hover:bg-gray-800 border border-gray-850 text-[11px] sm:text-xs font-semibold text-gray-300 hover:text-white transition flex items-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
                  <span>Sign In</span>
                </button>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] sm:text-xs font-bold hover:shadow-lg transition cursor-pointer whitespace-nowrap"
                >
                  Get 10 Free Credits
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 md:px-8 py-4 md:py-8">
        <ErrorBoundary>
          <React.Suspense fallback={<LoadingFallback />}>
          <div style={{ display: currentTab === "blog" ? "block" : "none" }}>
            {selectedBlogSlug ? (
              <BlogPostDetail
                slug={selectedBlogSlug}
                onBackToBlog={() => {
                  window.history.pushState({}, "", "/blog");
                  setSelectedBlogSlug(null);
                }}
                user={user}
                profile={profile}
                onOpenAuth={() => setAuthModalOpen(true)}
                onOpenEditPost={(post) => {
                  setEditingPost(post);
                  setCreatePostModalOpen(true);
                }}
                onGoToWorkspace={() => {
                  window.history.pushState({}, "", "/");
                  setCurrentTab("editor");
                  setSelectedBlogSlug(null);
                }}
              />
            ) : (
              <BlogIndex
                onSelectPost={(slug) => {
                  window.history.pushState({}, "", `/blog/${slug}`);
                  setSelectedBlogSlug(slug);
                }}
                user={user}
                profile={profile}
                onOpenAuth={() => setAuthModalOpen(true)}
                onOpenCreatePost={() => {
                  if (user) {
                    setEditingPost(null);
                    setCreatePostModalOpen(true);
                  } else {
                    setAuthModalOpen(true);
                  }
                }}
                onOpenEditPost={(post) => {
                  setEditingPost(post);
                  setCreatePostModalOpen(true);
                }}
                onOpenProfile={() => setUserProfileModalOpen(true)}
              />
            )}
          </div>

          <div style={{ display: currentTab === "howto" ? "block" : "none" }}>
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
          </div>
          
          <div style={{ display: currentTab === "editor" ? "block" : "none" }}>
            {user ? (
              <ChromaKeyer 
                user={user} 
                profile={profile} 
                onRefreshProfile={() => user && fetchProfile(user.id, user.email || "")} 
                onOpenPricing={() => setPricingModalOpen(true)}
                onOpenAuth={() => setAuthModalOpen(true)}
              />
            ) : (
              <LandingPage
                onOpenAuth={() => setAuthModalOpen(true)}
                onOpenEmbedBadge={() => setEmbedBadgeModalOpen(true)}
              />
            )}
          </div>

          {user && (
            <>
              <div style={{ display: currentTab === "history" ? "block" : "none" }}>
                <HistoryGallery userId={user?.id} isPro={profile?.is_pro ?? false} />
              </div>

              <div style={{ display: currentTab === "billing" ? "block" : "none" }}>
                <SubscriptionManager 
                  userId={user.id} 
                  credits={profile?.credits ?? 0} 
                  hdCredits={profile?.hd_credits_remaining ?? 0}
                  isPro={profile?.is_pro ?? false} 
                  onOpenPricing={() => setPricingModalOpen(true)}
                />
              </div>
            </>
          )}
        </React.Suspense>
        </ErrorBoundary>
      </main>

      {/* Footer Details */}
      <footer className="border-t border-gray-900 bg-gray-950/30 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 justify-between items-center text-[11px] font-mono text-gray-500">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
              <span>© 2026 Chroma Isolate Engine. Powered by Supabase & Paddle.</span>
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    window.history.pushState({}, "", "/blog");
                    setCurrentTab("blog");
                    setSelectedBlogSlug(null);
                  }}
                  className="hover:text-emerald-400 transition duration-150 bg-transparent border-none cursor-pointer text-[11px] font-mono text-gray-400 font-bold"
                >
                  Blog
                </button>
                <button 
                  onClick={() => {
                    window.history.pushState({}, "", "/");
                    setCurrentTab("howto");
                    setSelectedBlogSlug(null);
                  }}
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
      <ErrorBoundary>
        <React.Suspense fallback={null}>
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

          <EmbedBadgeModal
            isOpen={embedBadgeModalOpen}
            onClose={() => setEmbedBadgeModalOpen(false)}
          />

          <CreatePostModal
            isOpen={createPostModalOpen}
            onClose={() => {
              setCreatePostModalOpen(false);
              setEditingPost(null);
            }}
            user={user}
            profile={profile}
            postToEdit={editingPost}
            onPostSaved={(savedPost) => {
              window.history.pushState({}, "", `/blog/${savedPost.slug}`);
              setSelectedBlogSlug(savedPost.slug);
              setCurrentTab("blog");
              setEditingPost(null);
            }}
          />

          <UserProfileModal
            isOpen={userProfileModalOpen}
            onClose={() => setUserProfileModalOpen(false)}
            user={user}
            profile={profile}
            onSaveSuccess={(updatedProfile) => {
              setProfile(updatedProfile);
            }}
          />
        </React.Suspense>
      </ErrorBoundary>

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
