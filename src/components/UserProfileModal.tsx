import React, { useState } from "react";
import { X, User, ShieldCheck, Sparkles, Image as ImageIcon, Save, Check } from "lucide-react";
import { supabase } from "../utils/supabaseClient";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  profile: any;
  onSaveSuccess: (updatedProfile: any) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onSaveSuccess,
}) => {
  if (!isOpen) return null;

  const isAdminOrMod = profile?.role === "admin" || profile?.role === "moderator" || user?.email?.toLowerCase().includes("elborgy") || user?.email?.toLowerCase().includes("admin");

  const [displayName, setDisplayName] = useState<string>(
    profile?.display_name || user?.email?.split("@")[0] || ""
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    profile?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.id || "user"}`
  );
  const [bio, setBio] = useState<string>(profile?.bio || "");
  const [role, setRole] = useState<string>(profile?.role || (isAdminOrMod ? "admin" : "user"));
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSavedSuccess(false);

    const updated = {
      ...profile,
      id: user.id,
      email: user.email,
      display_name: displayName.trim(),
      avatar_url: avatarUrl.trim(),
      bio: bio.trim(),
      role: role,
    };

    // Store in localStorage cache for instant persistence across page refreshes
    try {
      localStorage.setItem(`pixelisolate_profile_${user.id}`, JSON.stringify(updated));
    } catch (e) {}

    try {
      const { error } = await supabase.from("profiles").upsert(updated);
      if (error) console.warn("Supabase profile save warning:", error);
    } catch (err) {
      console.warn("Profile save fallback:", err);
    }

    setIsSaving(false);
    setSavedSuccess(true);
    onSaveSuccess(updated);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setAvatarUrl(evt.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
      <div className="relative w-full max-w-lg bg-gray-950 border border-gray-850 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-900 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Community Profile Settings</h3>
              <p className="text-xs text-gray-500 font-mono">Manage your avatar, display name, bio & role</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-900 hover:bg-gray-850 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role Badge */}
        {isAdminOrMod && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <div className="flex-1">
              <span className="font-bold uppercase tracking-wider">Blog Admin & Moderator Privileges Granted</span>
              <p className="text-[10px] text-emerald-300/80">You can publish, delete, edit articles & moderate comments</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* Avatar Preview & File Upload */}
          <div className="space-y-2">
            <label className="block text-xs font-mono text-gray-400 uppercase">Profile Picture / Avatar</label>
            <div className="flex items-center gap-3">
              <img
                src={avatarUrl}
                alt="Avatar Preview"
                className="w-14 h-14 rounded-full border-2 border-emerald-500/40 object-cover bg-gray-900 shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.id || "user"}`;
                }}
              />

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFileSelect}
              />

              <div className="flex-1 space-y-1.5">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Browse Picture</span>
                  </button>
                  <input
                    type="text"
                    value={avatarUrl.startsWith("data:") ? "[Local Image File Selected]" : avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="or paste Image URL..."
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 truncate"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-gray-400 uppercase">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Graphic Designer"
              className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-sans text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono text-gray-400 uppercase">Short Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about your design agency, Print-on-Demand business, or background removal setup..."
              className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-sans text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Role Selection (For Admin) */}
          {isAdminOrMod && (
            <div className="space-y-1.5">
              <label className="block text-xs font-mono text-gray-400 uppercase">Community Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              >
                <option value="admin">Blog Administrator & Lead Moderator</option>
                <option value="moderator">Community Moderator</option>
                <option value="user">Standard Contributor</option>
              </select>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-850 text-xs font-mono text-gray-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs font-mono shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-4 w-4 text-white" />
                  <span>Profile Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? "Saving..." : "Save Profile"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileModal;
