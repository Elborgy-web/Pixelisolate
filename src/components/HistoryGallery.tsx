import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabaseClient";
import { Download, Trash2, Loader2, Sparkles, Image as ImageIcon, Lock } from "lucide-react";
import { decryptStorageBuffer, getCachedDecryptedBlob, setCachedDecryptedBlob } from "../utils/cryptoVault";

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

// In-memory cache for decrypted Blob URLs for 0ms instant re-renders
const memoryBlobUrlCache = new Map<string, { origUrl: string; procUrl: string }>();

// Global Rate-Limited Concurrency Queue to keep main thread and sockets 100% smooth
class ConcurrencyQueue {
  private queue: Array<() => Promise<void>> = [];
  private activeCount = 0;
  private maxConcurrency = 3; // Max 3 parallel decryptions

  add(task: () => Promise<void>) {
    this.queue.push(task);
    this.process();
  }

  private async process() {
    if (this.activeCount >= this.maxConcurrency || this.queue.length === 0) return;
    this.activeCount++;
    const task = this.queue.shift()!;
    try {
      await task();
    } catch (e) {
      console.warn("Queue task execution notice:", e);
    } finally {
      this.activeCount--;
      this.process();
    }
  }
}

const decryptQueue = new ConcurrencyQueue();

/**
 * Individual History Card component with Viewport Intersection Decryption
 */

const HistoryCardItem: React.FC<{
  item: HistoryItem;
  userId: string;
  deletingId: string | null;
  onDelete: (item: HistoryItem) => void;
  onDownload: (url: string, filename: string) => void;
}> = ({ item, userId, deletingId, onDelete, onDownload }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [origUrl, setOrigUrl] = useState<string>(item.original_url);
  const [procUrl, setProcUrl] = useState<string>(item.processed_url);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(true);

  // 1. Viewport IntersectionObserver
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    // Check memory cache first for 0ms instant display
    if (memoryBlobUrlCache.has(item.id)) {
      const cached = memoryBlobUrlCache.get(item.id)!;
      setOrigUrl(cached.origUrl);
      setProcUrl(cached.procUrl);
      setIsDecrypting(false);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Preload 200px before scrolling into view
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [item.id]);

  // 2. Progressive Decryption Task when in Viewport
  useEffect(() => {
    if (!inView || !userId || memoryBlobUrlCache.has(item.id)) return;

    let isMounted = true;

    decryptQueue.add(async () => {
      let finalOrig = item.original_url;
      let finalProc = item.processed_url;

      try {
        // Fetch & Decrypt Original Image
        if (item.original_url && !item.original_url.startsWith("data:") && !item.original_url.startsWith("blob:")) {
          const cachedOrigBlob = await getCachedDecryptedBlob(`orig_${item.id}`);
          if (cachedOrigBlob) {
            finalOrig = URL.createObjectURL(cachedOrigBlob);
          } else {
            const res = await fetch(item.original_url);
            if (res.ok) {
              const buf = await res.arrayBuffer();
              const dec = await decryptStorageBuffer(buf, userId);
              if (dec && dec.startsWith("blob:")) {
                finalOrig = dec;
                const blobRes = await fetch(dec);
                if (blobRes.ok) {
                  const b = await blobRes.blob();
                  await setCachedDecryptedBlob(`orig_${item.id}`, b);
                }
              }
            }
          }
        }

        // Fetch & Decrypt Processed Image
        if (item.processed_url && !item.processed_url.startsWith("data:") && !item.processed_url.startsWith("blob:")) {
          const cachedProcBlob = await getCachedDecryptedBlob(`proc_${item.id}`);
          if (cachedProcBlob) {
            finalProc = URL.createObjectURL(cachedProcBlob);
          } else {
            const res = await fetch(item.processed_url);
            if (res.ok) {
              const buf = await res.arrayBuffer();
              const dec = await decryptStorageBuffer(buf, userId);
              if (dec && dec.startsWith("blob:")) {
                finalProc = dec;
                const blobRes = await fetch(dec);
                if (blobRes.ok) {
                  const b = await blobRes.blob();
                  await setCachedDecryptedBlob(`proc_${item.id}`, b);
                }
              }
            }
          }
        }

        memoryBlobUrlCache.set(item.id, { origUrl: finalOrig, procUrl: finalProc });

        if (isMounted) {
          setOrigUrl(finalOrig);
          setProcUrl(finalProc);
          setIsDecrypting(false);
        }
      } catch (err) {
        if (isMounted) setIsDecrypting(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [inView, item.id, item.original_url, item.processed_url, userId]);

  return (
    <div
      ref={cardRef}
      className="group relative rounded-2xl bg-gray-950/40 border border-gray-850 p-4.5 flex flex-col gap-4 shadow-lg hover:border-gray-800 transition duration-300 overflow-hidden"
    >
      {/* Visual display of Original and Processed */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-900 border border-gray-900 flex">
        {isDecrypting && !memoryBlobUrlCache.has(item.id) && (
          <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-2 text-gray-500 font-mono text-[10px]">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
            <span>Decrypting Vault Image...</span>
          </div>
        )}

        {/* Left Side: Original */}
        <div className="w-1/2 h-full border-r border-gray-950 overflow-hidden relative">
          <img
            src={origUrl}
            alt="Original"
            decoding="async"
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition duration-500"
          />
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-gray-950/80 backdrop-blur-md rounded text-[8px] font-mono text-gray-400 border border-gray-850 z-20">
            Original
          </span>
        </div>

        {/* Right Side: Processed Over Grid */}
        <div className="w-1/2 h-full overflow-hidden relative checkerboard-preview-bg">
          <img
            src={procUrl}
            alt="Isolated"
            decoding="async"
            loading="lazy"
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
          {new Date(item.created_at).toLocaleDateString()} at{" "}
          {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>

        <div className="flex gap-2">
          <button
            disabled={deletingId === item.id}
            onClick={() => onDownload(procUrl, `isolated-${item.id}.png`)}
            className="p-2 rounded-xl bg-gray-950 hover:bg-gray-800 border border-gray-850 text-gray-400 hover:text-emerald-400 transition cursor-pointer disabled:opacity-50"
            title="Download Transparent PNG"
          >
            <Download className="h-4.5 w-4.5" />
          </button>
          <button
            disabled={deletingId === item.id}
            onClick={() => onDelete(item)}
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
  );
};

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
      // 1. Query Supabase history table filtered by user_id for instant database lookup
      let { data, error } = await supabase
        .from("history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error || !data) {
        const { data: fallbackData } = await supabase
          .from("history")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        data = fallbackData || [];
      }

      // Immediately display history cards to user without waiting for decryption fetches
      setHistoryItems(data || []);
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

      memoryBlobUrlCache.delete(item.id);
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
          <HistoryCardItem
            key={item.id}
            item={item}
            userId={userId}
            deletingId={deletingId}
            onDelete={handleDelete}
            onDownload={handleDownload}
          />
        ))}
      </div>
    </div>
  );
}
