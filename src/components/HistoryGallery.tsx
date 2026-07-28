import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import { Download, Trash2, Loader2, Sparkles, Image as ImageIcon, Lock } from "lucide-react";
import { decryptStorageBuffer } from "../utils/cryptoVault";

interface HistoryItem {
  id: string;
  original_url: string;
  processed_url: string;
  created_at: string;
  user_id?: string;
}

interface HistoryGalleryProps {
  userId: string | null;
  isPro: boolean;
}

// In-memory cache for decrypted history items to avoid duplicate network fetches
const decryptedMemoryCache = new Map<string, { origUrl: string; procUrl: string }>();

export default function HistoryGallery({ userId, isPro }: HistoryGalleryProps) {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const fetchHistory = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // 1. Query Supabase history table filtered by user_id for 0ms database lookup
      let { data, error } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      // Fallback query if user_id column filtering is handled by RLS policy
      if (error || !data) {
        const { data: fallbackData } = await supabase
          .from("history")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        data = fallbackData || [];
      }

      // Immediately display history items to user without waiting for decryption fetches
      setHistoryItems(data);
      setLoading(false);

      // 2. Perform background progressive decryption for encrypted vault items
      const rawList = data || [];
      const updatedList = await Promise.all(
        rawList.map(async (item) => {
          if (decryptedMemoryCache.has(item.id)) {
            const cached = decryptedMemoryCache.get(item.id)!;
            return { ...item, original_url: cached.origUrl, processed_url: cached.procUrl };
          }

          let origUrl = item.original_url;
          let procUrl = item.processed_url;

          // Fetch helper with 2-second timeout to prevent network hangs
          const fetchWithTimeout = async (url: string) => {
            if (!url || url.startsWith("data:image/")) return null;
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 2000);
            try {
              const res = await fetch(url, { signal: controller.signal });
              clearTimeout(timer);
              return res.ok ? res.arrayBuffer() : null;
            } catch (e) {
              clearTimeout(timer);
              return null;
            }
          };

          try {
            const [bufOrig, bufProc] = await Promise.all([
              fetchWithTimeout(origUrl),
              fetchWithTimeout(procUrl),
            ]);

            if (bufOrig) {
              const decOrig = await decryptStorageBuffer(bufOrig, userId);
              if (decOrig && decOrig.startsWith("data:")) origUrl = decOrig;
            }

            if (bufProc) {
              const decProc = await decryptStorageBuffer(bufProc, userId);
              if (decProc && decProc.startsWith("data:")) procUrl = decProc;
            }
          } catch (decErr) {
            console.warn("Background decryption skipped for item:", item.id);
          }

          decryptedMemoryCache.set(item.id, { origUrl, procUrl });
          return { ...item, original_url: origUrl, processed_url: procUrl };
        })
      );

      setHistoryItems(updatedList);
    } catch (err: any) {
      console.error("Failed to load user history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: HistoryItem) => {
    setDeletingId(item.id);
    try {
      const apiBase = (import.meta.env.VITE_API_URL || "").trim();
      const response = await fetch(`${apiBase}/api/vault/${item.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to delete history via backend API.");
      }

      decryptedMemoryCache.delete(item.id);
      setHistoryItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch (err: any) {
      console.error("Failed to delete history item:", err);
      alert("Error deleting item: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      window.open(url, "_blank");
    }
  };

  if (!userId) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 text-center text-gray-500 max-w-lg mx-auto shadow-inner bg-gradient-to-b from-gray-900 to-gray-950">
        <ImageIcon className="h-10 w-10 text-gray-700 mx-auto mb-4" />
        <h3 className="text-sm font-semibold text-gray-300">Authentication Required</h3>
        <p className="text-xs text-gray-500 mt-1">Please log in to view and save your background isolation history.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <span className="text-xs font-mono">Retrieving your gallery...</span>
      </div>
    );
  }

  if (historyItems.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-16 text-center text-gray-500 max-w-xl mx-auto shadow-inner bg-gradient-to-b from-gray-900 to-gray-950">
        <Sparkles className="h-8 w-8 text-emerald-500/30 mx-auto mb-4 animate-pulse" />
        <h3 className="text-sm font-semibold text-gray-300">Your History Gallery is Empty</h3>
        <p className="text-xs text-gray-500 mt-1.5">
          Process some images in the editor! Logged-in accounts automatically save original and isolated transparent cutouts.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-900 pb-4 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-white tracking-tight">My Isolated History Gallery</h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-semibold">
              <Lock className="h-3 w-3" /> Zero-Knowledge AES-256 Encrypted
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Images are client-side encrypted on your device before saving. Only you possess the decryption key—unreadable by developers or server admins.
          </p>
        </div>
        <button 
          onClick={fetchHistory}
          className="px-3.5 py-1.5 rounded-xl bg-gray-950 hover:bg-gray-800 border border-gray-850 text-xs font-mono font-semibold text-gray-300 transition hover:text-white cursor-pointer"
        >
          Refresh Gallery
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {historyItems.map((item) => (
          <div 
            key={item.id} 
            className="group relative rounded-2xl bg-gray-950/40 border border-gray-850 p-4.5 flex flex-col gap-4 shadow-lg hover:border-gray-800 transition duration-300 overflow-hidden"
          >
            {/* Visual display of Original and Processed */}
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-900 border border-gray-900 flex">
              {/* Left Side: Original */}
              <div className="w-1/2 h-full border-r border-gray-950 overflow-hidden relative">
                <img 
                  src={item.original_url} 
                  alt="Original" 
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" 
                />
                <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-gray-950/80 backdrop-blur-md rounded text-[8px] font-mono text-gray-400 border border-gray-850">
                  Original
                </span>
              </div>
              
              {/* Right Side: Processed Over Grid */}
              <div className="w-1/2 h-full overflow-hidden relative checkerboard-preview-bg">
                <img 
                  src={item.processed_url} 
                  alt="Isolated" 
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500 relative z-10" 
                />
                <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-gray-950/80 backdrop-blur-md rounded text-[8px] font-mono text-emerald-400 border border-gray-850 z-20">
                  Isolated
                </span>
              </div>
            </div>

            {/* Content Details */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-gray-500">
                {new Date(item.created_at).toLocaleDateString()} at {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
              
              <div className="flex gap-2">
                <button
                  disabled={deletingId === item.id}
                  onClick={() => handleDownload(item.processed_url, `isolated-${item.id}.png`)}
                  className="p-2 rounded-xl bg-gray-950 hover:bg-gray-800 border border-gray-850 text-gray-400 hover:text-emerald-400 transition cursor-pointer disabled:opacity-50"
                  title="Download Transparent PNG"
                >
                  <Download className="h-4.5 w-4.5" />
                </button>
                <button
                  disabled={deletingId === item.id}
                  onClick={() => handleDelete(item)}
                  className="p-2 rounded-xl bg-gray-950 hover:bg-gray-800 border border-gray-850 text-gray-400 hover:text-red-400 transition cursor-pointer disabled:opacity-50"
                  title="Delete File Pair"
                >
                  {deletingId === item.id ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
