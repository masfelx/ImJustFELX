"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabase-client";
import { detectMood, MOODS, MoodInfo } from "@/lib/sentiment";
import LedEmoticon from "@/components/LedEmoticon";

/* ── Types ─────────────────────────────────────────────────── */
type CeritaReply = {
  id: string;
  story_id: string;
  author_name: string;
  author_handle: string;
  content: string;
  avatar_color: string;
  created_at: string;
};

export type VipTheme = "gold" | "neon" | "fire" | "midnight";

export function VipThemeIcon({
  theme,
  className = "w-4 h-4",
}: {
  theme: VipTheme;
  className?: string;
}) {
  switch (theme) {
    case "gold":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
          <path d="M4 20h16" />
        </svg>
      );
    case "neon":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "fire":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
        </svg>
      );
    case "midnight":
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          <path d="M19 3v4" />
          <path d="M21 5h-4" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
  }
}

export const VIP_THEMES: {
  id: VipTheme;
  name: string;
  badgeLabel: string;
  desc: string;
  borderClass: string;
  accentColor: string;
  ribbonBg: string;
}[] = [
  {
    id: "gold",
    name: "Celestial Gold",
    badgeLabel: "VIP · CELESTIAL GOLD",
    desc: "Aura Emas Minimalis",
    borderClass: "vip-border-gold",
    accentColor: "text-amber-500",
    ribbonBg: "from-amber-400/20 via-amber-300/10 to-transparent",
  },
  {
    id: "neon",
    name: "Cyber Nitro",
    badgeLabel: "VIP · CYBER NITRO",
    desc: "Neon Elektrik Modern",
    borderClass: "vip-border-neon",
    accentColor: "text-cyan-500",
    ribbonBg: "from-cyan-400/20 via-sky-300/10 to-transparent",
  },
  {
    id: "fire",
    name: "Lava & Petir",
    badgeLabel: "VIP · LAVA & THUNDER",
    desc: "Kobaran Magma Dinamis",
    borderClass: "vip-border-fire",
    accentColor: "text-orange-500",
    ribbonBg: "from-rose-500/20 via-orange-400/10 to-transparent",
  },
  {
    id: "midnight",
    name: "Midnight Shadow",
    badgeLabel: "VIP · DARK FANTASY",
    desc: "Violet & Obsidian Murni",
    borderClass: "vip-border-midnight",
    accentColor: "text-purple-500",
    ribbonBg: "from-purple-500/20 via-indigo-500/10 to-transparent",
  },
];

type Cerita = {
  id: string;
  author_name: string;
  author_handle: string;
  content: string;
  avatar_color: string;
  likes: number;
  created_at: string;
  replies?: CeritaReply[];
  is_vip?: boolean;
  vip_theme?: VipTheme;
  pinned_until?: string;
  image_url?: string;
  proof_image_url?: string;
  is_edited?: boolean;
  edited_at?: string;
};

/* ── Waktu relatif (bahasa Indonesia) ──────────────────────── */
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "baru saja";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.floor(months / 12)} tahun lalu`;
}

/* ── Avatar initials ───────────────────────────────────────── */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ── Realtime status type ──────────────────────────────────── */
type RealtimeStatus = "connecting" | "live" | "polling" | "offline";

/* ── Skeleton Loading Component (Apple Style) ───────────────── */
function CeritaSkeleton() {
  return (
    <div className="space-y-0" aria-label="Memuat cerita..." role="status">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border-b border-hairline bg-white first:rounded-t-2xl last:rounded-b-2xl last:border-b-0 px-4 sm:px-5 py-4"
        >
          <div className="flex gap-3">
            {/* Avatar skeleton */}
            <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-200/90 animate-pulse" />

            {/* Content skeleton */}
            <div className="min-w-0 flex-1 space-y-2.5">
              {/* Header meta skeleton */}
              <div className="flex items-center gap-2 pt-0.5">
                <div
                  className="h-3.5 rounded-full bg-neutral-200/90 animate-pulse"
                  style={{ width: i === 1 ? "110px" : i === 2 ? "85px" : "130px" }}
                />
                <div
                  className="h-3 rounded-full bg-neutral-200/60 animate-pulse"
                  style={{ width: i === 1 ? "70px" : i === 2 ? "90px" : "60px" }}
                />
                <div className="h-1 w-1 rounded-full bg-neutral-300" />
                <div className="h-3 w-12 rounded-full bg-neutral-200/60 animate-pulse" />
              </div>

              {/* Story text lines */}
              <div className="space-y-2 pt-1">
                <div
                  className="h-3.5 rounded-full bg-neutral-200/80 animate-pulse"
                  style={{ width: i === 2 ? "92%" : "98%" }}
                />
                <div
                  className="h-3.5 rounded-full bg-neutral-200/80 animate-pulse"
                  style={{ width: i === 1 ? "80%" : i === 2 ? "88%" : "70%" }}
                />
                {i !== 2 && (
                  <div
                    className="h-3.5 rounded-full bg-neutral-200/60 animate-pulse"
                    style={{ width: i === 1 ? "45%" : "35%" }}
                  />
                )}
              </div>

              {/* Like action skeleton */}
              <div className="pt-1">
                <div className="h-4 w-12 rounded-full bg-neutral-200/60 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: RealtimeStatus }) {
  const map: Record<RealtimeStatus, { label: string; className: string }> = {
    connecting: {
      label: "Menyambung",
      className: "bg-amber-100 text-amber-700 border border-amber-200",
    },
    live: {
      label: "Live",
      className: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    },
    polling: {
      label: "Polling",
      className: "bg-sky-100 text-sky-700 border border-sky-200",
    },
    offline: {
      label: "Offline",
      className: "bg-neutral-200 text-neutral-600 border border-neutral-300",
    },
  };

  const config = map[status] ?? map.connecting;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${config.className}`}
      aria-live="polite"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </span>
  );
}

/* ── Main Component ────────────────────────────────────────── */
export default function CeritaFeed() {
  const [stories, setStories] = useState<Cerita[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("connecting");
  const [newStoryFlash, setNewStoryFlash] = useState<string | null>(null);

  // Composer state
  const [content, setContent] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [showNameField, setShowNameField] = useState(false);
  const [isNameConfirmed, setIsNameConfirmed] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [activeMood, setActiveMood] = useState<MoodInfo>(MOODS.neutral);
  const [isVipSelected, setIsVipSelected] = useState(false);
  const [selectedVipTheme, setSelectedVipTheme] = useState<VipTheme>("gold");
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipSettings, setVipSettings] = useState<{ price_per_vip: number; qris_image_url: string }>({
    price_per_vip: 5000,
    qris_image_url: "/qris-default.svg",
  });
  const [vipProofUrl, setVipProofUrl] = useState<string | null>(null);
  const [uploadingVipProof, setUploadingVipProof] = useState(false);
  const vipProofInputRef = useRef<HTMLInputElement>(null);
  const [mounted] = useState(() => typeof window !== "undefined");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Edit cerita (maksimal 10 menit) state
  const [myStoryIds, setMyStoryIds] = useState<Set<string>>(new Set());
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Foto & Crop 1:1 state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1:1 Cropper state
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropRawSrc, setCropRawSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPan, setCropPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState({ w: 0, h: 0 });
  const cropImgRef = useRef<HTMLImageElement>(null);
  const CROP_BOX_SIZE = 280; // Ukuran kotak preview crop dalam px

  // Kunci scroll body layar saat modal VIP, zoom foto, atau crop terbuka
  useEffect(() => {
    if (showVipModal || zoomedImageUrl || showCropModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showVipModal, zoomedImageUrl, showCropModal]);

  // Muat info QRIS & harga VIP publik
  useEffect(() => {
    fetch("/api/vip/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data?.qris_image_url) {
          setVipSettings(data);
        }
      })
      .catch(() => {});
  }, []);

  // Upload bukti QR dari pengguna
  async function handleVipProofUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("File bukti transfer harus berupa gambar.");
      return;
    }

    setUploadingVipProof(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/cerita/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setVipProofUrl(data.url);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.error || "Gagal mengunggah bukti QR.");
      }
    } catch {
      setError("Koneksi gagal saat mengunggah bukti QR.");
    } finally {
      setUploadingVipProof(false);
    }
  }

  // Muat daftar ID cerita yang dibuat oleh browser ini untuk izin edit 10 menit
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lux0ria_my_story_ids");
      if (stored) {
        setMyStoryIds(new Set(JSON.parse(stored)));
      }
    } catch {}
  }, []);

  // Hitung sisa menit untuk hak edit (maks 10 menit)
  function getRemainingEditMinutes(createdAt: string): number {
    const ageMs = Date.now() - new Date(createdAt).getTime();
    const limitMs = 10 * 60 * 1000;
    if (ageMs >= limitMs) return 0;
    return Math.ceil((limitMs - ageMs) / 60000);
  }

  function handleStartEdit(story: Cerita) {
    setEditingStoryId(story.id);
    setEditingContent(story.content);
    setError("");
  }

  async function handleSaveEdit(storyId: string) {
    if (!editingContent.trim()) return;
    setSavingEdit(true);
    setError("");
    try {
      const res = await fetch(`/api/cerita/${storyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingContent.trim() }),
      });
      if (res.ok) {
        const updated = await res.json();
        setStories((prev) =>
          prev.map((s) =>
            s.id === storyId
              ? { ...s, content: updated.content, is_edited: true, edited_at: updated.edited_at }
              : s
          )
        );
        setEditingStoryId(null);
        setEditingContent("");
        setSuccess("Cerita berhasil diedit.");
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Gagal mengedit cerita.");
      }
    } catch {
      setError("Koneksi gagal saat menyimpan perubahan cerita.");
    } finally {
      setSavingEdit(false);
    }
  }

  /* ── Handler buka cropper saat memilih foto ── */
  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Pilih file gambar valid (JPG, PNG, atau WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setCropRawSrc(src);
      setCropZoom(1);
      setCropPan({ x: 0, y: 0 });
      setShowCropModal(true);
      setError("");
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleCropImgLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const target = e.currentTarget;
    setImgNaturalSize({ w: target.naturalWidth, h: target.naturalHeight });
  }

  function handlePointerDown(e: React.PointerEvent) {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ x: cropPan.x, y: cropPan.y });
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging || !imgNaturalSize.w || !imgNaturalSize.h) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    const minScale = Math.max(CROP_BOX_SIZE / imgNaturalSize.w, CROP_BOX_SIZE / imgNaturalSize.h);
    const currentW = imgNaturalSize.w * minScale * cropZoom;
    const currentH = imgNaturalSize.h * minScale * cropZoom;

    const maxPanX = Math.max(0, (currentW - CROP_BOX_SIZE) / 2);
    const maxPanY = Math.max(0, (currentH - CROP_BOX_SIZE) / 2);

    const newX = Math.min(maxPanX, Math.max(-maxPanX, panStart.x + dx));
    const newY = Math.min(maxPanY, Math.max(-maxPanY, panStart.y + dy));

    setCropPan({ x: newX, y: newY });
  }

  function handlePointerUp(e: React.PointerEvent) {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  }

  function handleZoomChange(newZoom: number) {
    setCropZoom(newZoom);
    if (!imgNaturalSize.w || !imgNaturalSize.h) return;
    const minScale = Math.max(CROP_BOX_SIZE / imgNaturalSize.w, CROP_BOX_SIZE / imgNaturalSize.h);
    const currentW = imgNaturalSize.w * minScale * newZoom;
    const currentH = imgNaturalSize.h * minScale * newZoom;

    const maxPanX = Math.max(0, (currentW - CROP_BOX_SIZE) / 2);
    const maxPanY = Math.max(0, (currentH - CROP_BOX_SIZE) / 2);

    setCropPan((prev) => ({
      x: Math.min(maxPanX, Math.max(-maxPanX, prev.x)),
      y: Math.min(maxPanY, Math.max(-maxPanY, prev.y)),
    }));
  }

  /* ── Ekspor crop 1:1 ke Canvas & WebP (600x600 px tajam) ── */
  function applyCrop() {
    if (!cropImgRef.current || !imgNaturalSize.w || !imgNaturalSize.h) return;
    const img = cropImgRef.current;

    const minScale = Math.max(CROP_BOX_SIZE / imgNaturalSize.w, CROP_BOX_SIZE / imgNaturalSize.h);
    const currentW = imgNaturalSize.w * minScale * cropZoom;
    const currentH = imgNaturalSize.h * minScale * cropZoom;

    const centerX = CROP_BOX_SIZE / 2 + cropPan.x;
    const centerY = CROP_BOX_SIZE / 2 + cropPan.y;

    const imgLeft = centerX - currentW / 2;
    const imgTop = centerY - currentH / 2;

    const cropXInImage = Math.max(0, ((0 - imgLeft) / currentW) * imgNaturalSize.w);
    const cropYInImage = Math.max(0, ((0 - imgTop) / currentH) * imgNaturalSize.h);
    const cropWInImage = Math.min(imgNaturalSize.w - cropXInImage, (CROP_BOX_SIZE / currentW) * imgNaturalSize.w);
    const cropHInImage = Math.min(imgNaturalSize.h - cropYInImage, (CROP_BOX_SIZE / currentH) * imgNaturalSize.h);

    const canvas = document.createElement("canvas");
    const OUTPUT_SIZE = 600; // Rasio 1:1 resolusi pas untuk mobile & web
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(
      img,
      cropXInImage,
      cropYInImage,
      cropWInImage,
      cropHInImage,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const croppedFile = new File([blob], `cerita-${Date.now()}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          setSelectedImage(croppedFile);
          if (imagePreviewUrl) {
            URL.revokeObjectURL(imagePreviewUrl);
          }
          setImagePreviewUrl(URL.createObjectURL(croppedFile));
          setShowCropModal(false);
          setError("");
        }
      },
      "image/webp",
      0.85
    );
  }

  function removeImage() {
    setSelectedImage(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setCropRawSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Reply state
  const [expandedReplyId, setExpandedReplyId] = useState<string | null>(null);
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [replyNameMap, setReplyNameMap] = useState<Record<string, string>>({});
  const [replyNameToggleMap, setReplyNameToggleMap] = useState<Record<string, boolean>>({});
  const [replyingStoryId, setReplyingStoryId] = useState<string | null>(null);
  const [replyErrorMap, setReplyErrorMap] = useState<Record<string, string>>({});
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const storiesRef = useRef<Cerita[]>([]);

  // Keep storiesRef in sync so realtime callbacks can access latest state
  useEffect(() => {
    storiesRef.current = stories;
  }, [stories]);

  const MAX_CHARS = 500;
  const POLL_INTERVAL = 10_000; // 10 detik

  type StoryRealtimeRow = Partial<Cerita> & {
    id?: string | number | null;
    likes?: number | string | null;
    created_at?: string | null;
    author_name?: string | null;
    author_handle?: string | null;
    content?: string | null;
    avatar_color?: string | null;
    is_vip?: boolean | null;
    image_url?: string | null;
  };

  type StoryRealtimePayload = {
    new?: StoryRealtimeRow | null;
    old?: StoryRealtimeRow | null;
  };

  /* ── Fetch stories ───────────────────────────────────────── */
  const fetchStories = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/cerita", { cache: "no-store" });
      if (res.ok) {
        const data: Cerita[] = await res.json();
        setStories(data);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Supabase Realtime + Polling Fallback ─────────────────── */
  useEffect(() => {
    // 1. Initial fetch
    const loadInitialStories = async () => {
      await fetchStories();
    };
    void loadInitialStories();

    // 2. Try Supabase Realtime
    const supabase = getSupabaseClient();
    let channel: RealtimeChannel | null = null;
    let realtimeActive = false;

    function startPolling() {
      if (pollingRef.current) return; // sudah berjalan
      pollingRef.current = setInterval(() => {
        fetchStories(true);
      }, POLL_INTERVAL);
    }

    const schedulePollingFallback = () => {
      // Defer to avoid setState directly within the effect body.
      setTimeout(() => {
        setRealtimeStatus("polling");
        startPolling();
      }, 0);
    };

    if (supabase) {
      try {
        channel = supabase
          .channel("stories-realtime")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "stories" },
            (payload: StoryRealtimePayload) => {
              const row = payload.new;
              if (!row) return;

              const newStory: Cerita = {
                id: String(row.id ?? ""),
                author_name: String(row.author_name ?? "Anonim"),
                author_handle: String(row.author_handle ?? "@anon"),
                content: String(row.content ?? ""),
                avatar_color: row.avatar_color || "bg-blue-600",
                likes: Number(row.likes ?? 0),
                created_at: row.created_at ?? new Date().toISOString(),
                is_vip: Boolean(row.is_vip),
                image_url: row.image_url || undefined,
              };

              // Cegah duplikat — periksa apakah ID sudah ada
              setStories((prev) => {
                if (prev.some((s) => s.id === newStory.id)) return prev;
                return [newStory, ...prev];
              });

              // Flash animation
              setNewStoryFlash(newStory.id);
              setTimeout(() => setNewStoryFlash(null), 2000);
            }
          )
          .on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "stories" },
            (payload: StoryRealtimePayload) => {
              const deletedId = String(payload.old?.id);
              if (deletedId) {
                setStories((prev) => prev.filter((s) => s.id !== deletedId));
              }
            }
          )
          .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "stories" },
            (payload: StoryRealtimePayload) => {
              const row = payload.new;
              if (!row) return;
              setStories((prev) =>
                prev.map((s) =>
                  s.id === String(row.id) ? { ...s, likes: row.likes ?? s.likes } : s
                )
              );
            }
          )
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              realtimeActive = true;
              setRealtimeStatus("live");
              // Jika realtime aktif, hentikan polling
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              realtimeActive = false;
              setRealtimeStatus("polling");
              startPolling();
            }
          });
      } catch {
        schedulePollingFallback();
      }
    } else {
      // Tidak ada Supabase — pakai polling
      schedulePollingFallback();
    }

    // 3. Polling fallback

    // Jika setelah 5 detik realtime belum connected, mulai polling
    const realtimeTimeout = setTimeout(() => {
      if (!realtimeActive) {
        setRealtimeStatus("polling");
        startPolling();
      }
    }, 5000);

    // Cleanup
    return () => {
      clearTimeout(realtimeTimeout);
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [fetchStories]);

  /* ── Timestamp auto-update setiap 30 detik ───────────────── */
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(timer);
  }, []);

  /* ── Post new story ──────────────────────────────────────── */
  async function handlePost(forceVip?: boolean, customProof?: string) {
    if (!content.trim()) return;
    if (content.length > MAX_CHARS) return;

    const isVip = Boolean(forceVip || isVipSelected);

    // Jika pengguna memilih VIP tapi modal pembayaran belum dibuka
    if (isVipSelected && !forceVip) {
      setShowVipModal(true);
      return;
    }

    setPosting(true);
    setError("");
    setSuccess("");

    try {
      // 1. Upload foto terlebih dahulu jika pengguna melampirkan foto
      let uploadedImageUrl: string | undefined = undefined;
      if (selectedImage) {
        try {
          const formData = new FormData();
          formData.append("file", selectedImage);
          const uploadRes = await fetch("/api/cerita/upload", {
            method: "POST",
            body: formData,
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedImageUrl = uploadData.url;
          } else {
            const errJson = await uploadRes.json().catch(() => ({}));
            console.warn("Gagal upload foto:", errJson);
          }
        } catch (uploadErr) {
          console.warn("Error upload foto:", uploadErr);
        }
      }

      const res = await fetch("/api/cerita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          author_name: authorName.trim() || undefined,
          is_vip: isVip,
          vip_theme: isVip ? selectedVipTheme : undefined,
          image_url: uploadedImageUrl,
          proof_image_url: customProof || vipProofUrl || undefined,
        }),
      });

      const data: Cerita = await res.json();

      if (!res.ok) {
        const errorData = data as unknown as { error?: string };
        setError(errorData.error || "Gagal mengirim cerita.");
        return;
      }

      // Simpan ID cerita ke localStorage milik browser ini agar bisa diedit dalam 10 menit
      setMyStoryIds((prev) => {
        const next = new Set(prev).add(data.id);
        try {
          localStorage.setItem("lux0ria_my_story_ids", JSON.stringify(Array.from(next)));
        } catch {}
        return next;
      });

      setSuccess(
        data.is_vip
          ? "Cerita VIP berhasil dipasang di posisi teratas."
          : "Cerita berhasil dikirim."
      );
      setContent("");
      setAuthorName("");
      removeImage();
      setShowNameField(false);
      setIsNameConfirmed(false);
      setIsVipSelected(false);
      setShowVipModal(false);
      setVipProofUrl(null);
      setActiveMood(MOODS.neutral);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("lux0ria:mood", { detail: MOODS.neutral })
        );
      }

      // Prepend dan sort: VIP selalu di urutan teratas
      setStories((prev) => {
        const next = [data, ...prev.filter((s) => s.id !== data.id)];
        return next.sort((a, b) => {
          if (b.is_vip && !a.is_vip) return 1;
          if (!b.is_vip && a.is_vip) return -1;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });
      });

      // Flash animation
      setNewStoryFlash(data.id);
      setTimeout(() => setNewStoryFlash(null), 2500);

      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setPosting(false);
    }
  }

  /* ── Like story ──────────────────────────────────────────── */
  async function handleLike(id: string) {
    if (likedIds.has(id)) return;

    setLikedIds((prev) => new Set(prev).add(id));

    // Optimistic update
    setStories((prev) =>
      prev.map((s) => (s.id === id ? { ...s, likes: s.likes + 1 } : s))
    );

    try {
      await fetch("/api/cerita/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Revert on error
      setStories((prev) =>
        prev.map((s) => (s.id === id ? { ...s, likes: s.likes - 1 } : s))
      );
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  /* ── Send Reply to a Story ───────────────────────────────── */
  async function handleSendReply(storyId: string) {
    const text = (replyTextMap[storyId] || "").trim();
    if (!text) return;

    setReplyingStoryId(storyId);
    setReplyErrorMap((prev) => ({ ...prev, [storyId]: "" }));

    try {
      const authorName = (replyNameMap[storyId] || "").trim();
      const res = await fetch("/api/cerita/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story_id: storyId,
          content: text,
          author_name: authorName || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReplyErrorMap((prev) => ({
          ...prev,
          [storyId]: data.error || "Gagal mengirim balasan.",
        }));
        return;
      }

      // Update state locally
      setStories((prev) =>
        prev.map((s) => {
          if (s.id === storyId) {
            const currentReplies = Array.isArray(s.replies) ? s.replies : [];
            return {
              ...s,
              replies: [...currentReplies, data],
            };
          }
          return s;
        })
      );

      // Reset text
      setReplyTextMap((prev) => ({ ...prev, [storyId]: "" }));
    } catch {
      setReplyErrorMap((prev) => ({
        ...prev,
        [storyId]: "Terjadi kesalahan saat membalas.",
      }));
    } finally {
      setReplyingStoryId(null);
    }
  }

  /* ── Auto-resize textarea & mood auto-detect ─────────────── */
  function handleContentChange(value: string) {
    setContent(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }

    // Auto-detect suasana hati (mood) secara real-time
    const detected = detectMood(value);
    setActiveMood(detected);

    // Kirim event agar Emoticon LED di header navbar ikut berubah seketika
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("lux0ria:mood", { detail: detected })
      );
    }
  }

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;

  // Nilai perhitungan posisi dan ukuran render crop 1:1
  const cropMinScale =
    imgNaturalSize.w && imgNaturalSize.h
      ? Math.max(CROP_BOX_SIZE / imgNaturalSize.w, CROP_BOX_SIZE / imgNaturalSize.h)
      : 1;
  const cropRenderedW = imgNaturalSize.w * cropMinScale * cropZoom;
  const cropRenderedH = imgNaturalSize.h * cropMinScale * cropZoom;
  const cropCalculatedLeft = (CROP_BOX_SIZE - cropRenderedW) / 2 + cropPan.x;
  const cropCalculatedTop = (CROP_BOX_SIZE - cropRenderedH) / 2 + cropPan.y;

  return (
    <div className="mx-auto mt-12 max-w-[620px] space-y-6">
      {/* ── Composer Card ──────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-hairline p-4 sm:p-5 shadow-sm">
        {/* Live LED Mood Indicator in Composer */}
        {content.trim().length > 0 && (
          <div className="mb-3 flex items-center justify-between border-b border-divider-soft pb-2.5">
            <span className="text-fine text-ink-muted-48">
              Suasana Terdeteksi:
            </span>
            <LedEmoticon variant="compact" currentMood={activeMood} showLabel />
          </div>
        )}

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Apa yang ingin kamu ceritakan?"
          rows={3}
          className="w-full resize-none bg-transparent text-body text-ink placeholder:text-ink-muted-48 focus:outline-none"
          disabled={posting}
        />

        {/* Preview Foto Mini 1:1 (Compact Thumbnail) */}
        {imagePreviewUrl && (
          <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50/90 p-2.5 animate-in fade-in duration-150">
            <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-lg border border-neutral-300 bg-neutral-200 aspect-square">
              <Image
                src={imagePreviewUrl}
                alt="Preview cerita"
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={removeImage}
                title="Hapus foto"
                aria-label="Hapus foto"
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/75 text-white hover:bg-black transition-colors z-10"
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-neutral-700">1:1</span>
                <span>Foto Kotak Siap Dilampirkan</span>
              </div>
              <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                Rasio 1:1 disesuaikan · WebP ringan
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                {cropRawSrc && (
                  <button
                    type="button"
                    onClick={() => setShowCropModal(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
                    </svg>
                    <span>Atur crop 1:1</span>
                  </button>
                )}
                <span className="text-neutral-300">·</span>
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-[11px] font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                  Hapus foto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input File Hidden (Gallery / Camera Mobile Support) */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Name toggle & counter */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-divider-soft pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Ambil / Pilih Foto */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                imagePreviewUrl
                  ? "bg-neutral-900 text-white"
                  : "text-ink-muted-48 hover:text-ink hover:bg-neutral-100"
              }`}
              title="Ambil foto dari kamera atau galeri"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              <span>{imagePreviewUrl ? "Ganti foto" : "Foto"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (showNameField) {
                  setShowNameField(false);
                  setAuthorName("");
                  setIsNameConfirmed(false);
                } else {
                  setShowNameField(true);
                  setIsNameConfirmed(false);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-ink-muted-48 hover:text-ink hover:bg-neutral-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>{showNameField ? "Anonim saja" : "Pakai nama"}</span>
            </button>

            {showNameField && (
              <div className="inline-flex items-center gap-1.5">
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => {
                    setAuthorName(e.target.value);
                    setIsNameConfirmed(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (authorName.trim()) setIsNameConfirmed(true);
                    }
                  }}
                  autoFocus
                  placeholder="Nama kamu..."
                  maxLength={30}
                  className={`h-8 w-36 sm:w-44 rounded-lg border bg-white px-3 text-caption text-ink transition-colors focus:outline-none ${
                    isNameConfirmed && authorName.trim()
                      ? "border-emerald-500 ring-2 ring-emerald-500/20"
                      : "border-neutral-300 focus:border-primary focus:ring-1 focus:ring-primary"
                  }`}
                />

                {/* Tombol Centang Konfirmasi Nama — Berdiri Sendiri, Sangat Jelas */}
                <button
                  type="button"
                  onClick={() => {
                    if (authorName.trim()) {
                      setIsNameConfirmed(true);
                    }
                  }}
                  className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold text-white transition-all shadow-sm active:scale-95 ${
                    isNameConfirmed && authorName.trim()
                      ? "bg-emerald-600 ring-2 ring-emerald-300"
                      : "bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                  }`}
                  title="Konfirmasi nama kamu"
                >
                  <svg
                    className="w-4 h-4 stroke-[3]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{isNameConfirmed && authorName.trim() ? "Tersimpan" : "Centang"}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-fine font-mono tabular-nums ${
                isOverLimit
                  ? "text-red-500 font-semibold"
                  : charsLeft <= 50
                  ? "text-amber-500"
                  : "text-ink-muted-48"
              }`}
            >
              {charsLeft}
            </span>

            <button
              onClick={() => handlePost()}
              disabled={posting || !content.trim() || isOverLimit}
              className={`rounded-full px-5 py-1.5 text-caption-strong text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 ${
                isVipSelected
                  ? "bg-amber-500 hover:bg-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.35)]"
                  : "bg-primary hover:bg-primary-focus"
              }`}
            >
              {posting ? (
                <span className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Mengirim...
                </span>
              ) : isVipSelected ? (
                "Pasang VIP (Rp 5.000)"
              ) : (
                "Kirim"
              )}
            </button>
          </div>
        </div>

        {/* ── VIP Upgrade Switch Card ────────────────────────── */}
        <div
          onClick={() => setIsVipSelected(!isVipSelected)}
          className={`mt-4 flex items-center justify-between rounded-xl p-3 border cursor-pointer select-none transition-all ${
            isVipSelected
              ? "border-amber-400 bg-amber-500/[0.08] shadow-[0_0_15px_rgba(245,158,11,0.12)] ring-1 ring-amber-400/40"
              : "border-hairline bg-parchment/60 hover:border-amber-400/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-caption-strong text-ink font-semibold">
                  Jadikan Cerita VIP
                </span>
                <span className="rounded-full bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 tracking-wide">
                  Rp 5.000 · 24 JAM
                </span>
              </div>
              <p className="text-fine text-ink-muted-48 mt-0.5">
                Tampil di urutan teratas timeline selama 24 jam dengan sorotan khusus
              </p>
            </div>
          </div>
          <div
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              isVipSelected ? "bg-amber-500" : "bg-neutral-300"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                isVipSelected ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </div>
        </div>

        {/* ── Pilihan Efek Border Discord saat VIP Aktif ── */}
        {isVipSelected && (
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.04] p-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-800 font-mono">
                Effect
              </span>
              <span className="text-[10px] font-semibold text-amber-600 bg-amber-100/80 px-2 py-0.5 rounded-full">
                {VIP_THEMES.find((t) => t.id === selectedVipTheme)?.name}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {VIP_THEMES.map((theme) => {
                const active = selectedVipTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVipTheme(theme.id);
                    }}
                    className={`relative flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      active
                        ? "border-amber-500 bg-white shadow-sm ring-1 ring-amber-400/50"
                        : "border-neutral-200/80 bg-white/70 hover:bg-white hover:border-neutral-300"
                    }`}
                  >
                    <div
                      className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                        active
                          ? "bg-amber-500/10 " + theme.accentColor
                          : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      <VipThemeIcon theme={theme.id} className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-neutral-800 leading-tight">
                      {theme.name}
                    </span>
                    <span className="text-[9.5px] text-neutral-500 mt-0.5 leading-tight">
                      {theme.desc}
                    </span>
                    {active && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-xs">
                        <svg
                          className="w-2.5 h-2.5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <p className="mt-3 text-caption text-red-500 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-3 text-caption text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2">
            {success}
          </p>
        )}
      </div>

      {/* ── Stories Feed ───────────────────────────────────── */}
      {loading ? (
        <CeritaSkeleton />
      ) : stories.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-lead-airy text-ink-muted-48">
            Belum ada cerita. Jadilah yang pertama menulis.
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {stories.map((story) => {
            const isVip = Boolean(story.is_vip);
            const vipTheme = VIP_THEMES.find((t) => t.id === story.vip_theme) || VIP_THEMES[0];
            const canEdit = myStoryIds.has(story.id) && getRemainingEditMinutes(story.created_at) > 0;
            const remainingMinutes = canEdit ? getRemainingEditMinutes(story.created_at) : 0;
            const isEditing = editingStoryId === story.id;

            const cardInner = (
              <>
                {/* VIP Pinned Header Ribbon */}
                {isVip && (
                  <div className={`-mx-4 -mt-4 sm:-mx-5 sm:-mt-5 mb-3.5 flex items-center justify-between rounded-t-[14px] bg-gradient-to-r ${vipTheme.ribbonBg} px-4 py-2 border-b border-neutral-100/80`}>
                    <div className="inline-flex items-center gap-2">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-md bg-white/90 shadow-2xs ${vipTheme.accentColor}`}>
                        <VipThemeIcon theme={vipTheme.id} className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10.5px] font-bold font-mono uppercase tracking-wider text-neutral-800">
                        {vipTheme.badgeLabel}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-medium text-neutral-600 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full border border-neutral-200/70 shadow-2xs">
                      24 Jam
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  {/* Avatar */}
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white text-caption-strong ${story.avatar_color}`}
                  >
                    {getInitials(story.author_name)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {/* Author info & LED Mood Badge & Edit Button */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap truncate">
                        <span className="text-body-strong text-ink truncate">
                          {story.author_name}
                        </span>
                        <span className="text-caption text-ink-muted-48 truncate">
                          {story.author_handle}
                        </span>
                        <span className="text-fine text-ink-muted-48">·</span>
                        <span className="text-fine text-ink-muted-48 whitespace-nowrap">
                          {timeAgo(story.created_at)}
                          {story.is_edited && <span className="ml-1 text-[11px] italic text-neutral-400">(diedit)</span>}
                        </span>

                        {/* Tombol Edit jika masih dalam batas 10 menit */}
                        {canEdit && !isEditing && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(story)}
                            className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10.5px] font-semibold text-primary hover:bg-blue-100 transition-colors ml-1 active:scale-95"
                            title="Edit pesan ini (batas waktu 10 menit sejak posting)"
                          >
                            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                            <span>Edit ({remainingMinutes}m)</span>
                          </button>
                        )}
                      </div>

                      {/* Emoticon LED mini penanda suasana cerita */}
                      <div className="shrink-0">
                        <LedEmoticon
                          variant="compact"
                          currentMood={detectMood(story.content)}
                        />
                      </div>
                    </div>

                    {/* Story text OR Inline Edit Form */}
                    {isEditing ? (
                      <div className="mt-2.5 space-y-2 rounded-xl border border-primary/30 bg-primary/[0.02] p-3 animate-in fade-in duration-150">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          maxLength={500}
                          rows={3}
                          className="w-full resize-none rounded-lg border border-neutral-300 p-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                          placeholder="Perbarui ceritamu..."
                        />
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {editingContent.length}/500 · Sisa waktu edit: {remainingMinutes} menit
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingStoryId(null)}
                              className="rounded-lg px-2.5 py-1 text-xs text-neutral-500 hover:bg-neutral-100 transition-colors"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(story.id)}
                              disabled={savingEdit || !editingContent.trim()}
                              className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-focus transition-colors disabled:opacity-50"
                            >
                              {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-body text-ink whitespace-pre-wrap break-words leading-relaxed">
                        {story.content}
                      </p>
                    )}

                    {/* Foto Cerita (Ukuran Kecil 1:1 Kotak Menyesuaikan) */}
                    {story.image_url && (
                      <div className="mt-2.5">
                        <div
                          onClick={() => setZoomedImageUrl(story.image_url || null)}
                          className="group/photo relative aspect-square w-32 sm:w-40 overflow-hidden rounded-xl border border-neutral-200/90 bg-neutral-100 shadow-sm cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
                          title="Klik untuk memperbesar foto"
                        >
                          <Image
                            src={story.image_url}
                            alt={`Foto cerita dari ${story.author_name}`}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 130px, 160px"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/15 transition-colors flex items-end justify-end p-1.5">
                            <span className="rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-mono text-white opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center gap-1">
                              <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                <line x1="11" y1="8" x2="11" y2="14" />
                                <line x1="8" y1="11" x2="14" y2="11" />
                              </svg>
                              1:1
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-2.5 flex items-center gap-6">
                      {/* Like button */}
                      <button
                        onClick={() => handleLike(story.id)}
                        disabled={likedIds.has(story.id)}
                        className={`group/like flex items-center gap-1.5 transition-all ${
                          likedIds.has(story.id)
                            ? "text-red-500"
                            : "text-ink-muted-48 hover:text-red-500"
                        }`}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill={likedIds.has(story.id) ? "currentColor" : "none"}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-transform group-hover/like:scale-110"
                        >
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                        <span className="text-fine tabular-nums">
                          {story.likes > 0 ? story.likes : ""}
                        </span>
                      </button>

                      {/* Reply toggle button */}
                      <button
                        onClick={() =>
                          setExpandedReplyId(
                            expandedReplyId === story.id ? null : story.id
                          )
                        }
                        className={`group/reply flex items-center gap-1.5 transition-colors ${
                          expandedReplyId === story.id
                            ? "text-primary font-medium"
                            : "text-ink-muted-48 hover:text-primary"
                        }`}
                        title="Balas cerita ini"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="transition-transform group-hover/reply:scale-110"
                        >
                          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                        </svg>
                        <span className="text-fine tabular-nums">
                          {(story.replies?.length ?? 0) > 0
                            ? story.replies?.length
                            : "Balas"}
                        </span>
                      </button>
                    </div>

                    {/* ── Reply Thread Area ────────────────────────── */}
                    {expandedReplyId === story.id && (
                      <div className="mt-4 pt-3.5 border-t border-divider-soft space-y-3">
                        {/* List of existing replies */}
                        {(story.replies?.length ?? 0) > 0 ? (
                          <div className="space-y-2.5 pl-2 sm:pl-3 border-l-2 border-hairline/80">
                            {story.replies?.map((rep) => (
                              <div key={rep.id} className="flex gap-2.5 text-sm">
                                <div
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-bold ${rep.avatar_color}`}
                                >
                                  {getInitials(rep.author_name)}
                                </div>
                                <div className="min-w-0 flex-1 rounded-xl bg-parchment/80 px-3 py-2">
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-caption-strong text-ink">
                                      {rep.author_name}
                                    </span>
                                    <span className="text-fine text-ink-muted-48">
                                      {rep.author_handle}
                                    </span>
                                    <span className="text-fine text-ink-muted-48">·</span>
                                    <span className="text-fine text-ink-muted-48">
                                      {timeAgo(rep.created_at)}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-caption text-ink whitespace-pre-wrap break-words leading-relaxed">
                                    {rep.content}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-fine text-ink-muted-48 pl-2">
                            Belum ada tanggapan. Berikan balasan pertama kamu.
                          </p>
                        )}

                        {/* Inline Reply Composer */}
                        <div className="pt-1 pl-1">
                          <div className="flex flex-col gap-2 rounded-xl bg-parchment p-3 border border-hairline">
                            <textarea
                              rows={2}
                              value={replyTextMap[story.id] || ""}
                              onChange={(e) =>
                                setReplyTextMap((prev) => ({
                                  ...prev,
                                  [story.id]: e.target.value,
                                }))
                              }
                              placeholder={`Tulis balasan untuk ${story.author_name}...`}
                              maxLength={300}
                              className="w-full resize-none bg-transparent text-caption text-ink placeholder:text-ink-muted-48 focus:outline-none"
                            />

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-divider-soft">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplyNameToggleMap((prev) => ({
                                      ...prev,
                                      [story.id]: !prev[story.id],
                                    }))
                                  }
                                  className="text-fine text-primary hover:text-primary-focus transition-colors"
                                >
                                  {replyNameToggleMap[story.id]
                                    ? "Anonim saja"
                                    : "Pakai nama"}
                                </button>

                                {replyNameToggleMap[story.id] && (
                                  <div className="relative inline-flex items-center">
                                    <input
                                      type="text"
                                      placeholder="Nama kamu..."
                                      maxLength={25}
                                      value={replyNameMap[story.id] || ""}
                                      onChange={(e) =>
                                        setReplyNameMap((prev) => ({
                                          ...prev,
                                          [story.id]: e.target.value,
                                        }))
                                      }
                                      className="h-6 w-32 rounded border border-hairline bg-white pl-2 pr-6 text-fine text-ink focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                    <span
                                      className={`absolute right-1 flex h-4 w-4 items-center justify-center rounded transition-colors ${
                                        (replyNameMap[story.id] || "").trim()
                                          ? "text-emerald-500"
                                          : "text-neutral-300"
                                      }`}
                                      title="Nama terisi"
                                    >
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-fine text-ink-muted-48 font-mono tabular-nums">
                                  {300 - (replyTextMap[story.id]?.length || 0)}
                                </span>
                                <button
                                  onClick={() => handleSendReply(story.id)}
                                  disabled={
                                    replyingStoryId === story.id ||
                                    !(replyTextMap[story.id] || "").trim()
                                  }
                                  className="rounded-full bg-primary px-3.5 py-1 text-fine font-semibold text-white transition-all hover:bg-primary-focus disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                                >
                                  {replyingStoryId === story.id
                                    ? "Mengirim..."
                                    : "Balas"}
                                </button>
                              </div>
                            </div>

                            {replyErrorMap[story.id] && (
                              <p className="text-fine text-red-500">
                                {replyErrorMap[story.id]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            );

            if (isVip) {
              return (
                <div
                  key={story.id}
                  className={`relative p-[2.5px] rounded-2xl mb-4 transition-all ${vipTheme.borderClass} ${
                    newStoryFlash === story.id ? "animate-pulse" : ""
                  }`}
                >
                  <article className="rounded-[14px] bg-white p-4 sm:p-5 relative shadow-sm">
                    {cardInner}
                  </article>
                </div>
              );
            }

            return (
              <article
                key={story.id}
                className={`border-b border-hairline bg-white first:rounded-t-2xl last:rounded-b-2xl last:border-b-0 px-4 sm:px-5 py-4 hover:bg-parchment/60 transition-all ${
                  newStoryFlash === story.id ? "animate-pulse bg-emerald-50/50 ring-1 ring-emerald-200" : ""
                }`}
              >
                {cardInner}
              </article>
            );
          })}
        </div>
      )}

      {/* Refresh button */}
      {!loading && stories.length > 0 && (
        <div className="flex justify-center pt-4 pb-8">
          <button
            onClick={() => fetchStories()}
            className="inline-flex items-center gap-1.5 text-caption text-primary hover:text-primary-focus transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            <span>Muat ulang</span>
          </button>
        </div>
      )}

      {/* ── VIP QRIS PAYMENT MODAL (POPUP DEMO VIA PORTAL FULLSCREEN) ── */}
      {mounted && showVipModal && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200"
        >
          {/* Overlay klik luar untuk tutup */}
          <div
            className="fixed inset-0 bg-transparent"
            onClick={() => setShowVipModal(false)}
            aria-hidden="true"
          />

          <div
            className="relative z-10 w-full max-w-[380px] sm:max-w-[410px] max-h-[92vh] overflow-y-auto no-scrollbar rounded-2xl bg-[#0c0c12] border border-amber-500/40 p-4 sm:p-5 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-white animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowVipModal(false)}
              aria-label="Tutup modal"
              className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 pr-6">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Upgrade ke Cerita VIP
                </h3>
                <p className="text-[10.5px] text-amber-400/90 font-medium">
                  Posisi teratas timeline selama 24 jam
                </p>
              </div>
            </div>

            {/* QRIS Container Box */}
            <div className="mt-3 rounded-xl bg-white p-3 text-center text-ink shadow-md">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-1.5 mb-2">
                <span className="text-[10.5px] font-bold tracking-wider text-neutral-800 uppercase font-mono">
                  QRIS · PEMBAYARAN CEPAT
                </span>
                <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                  Rp {vipSettings.price_per_vip.toLocaleString("id-ID")}
                </span>
              </div>

              {/* Dynamic QRIS Image — Menyesuaikan layar & bisa di-tap fullscreen */}
              <div
                onClick={() => setZoomedImageUrl(vipSettings.qris_image_url || "/qris-default.svg")}
                className="group relative mx-auto flex w-full items-center justify-center rounded-lg border border-neutral-200 p-1.5 bg-neutral-50/50 cursor-pointer overflow-hidden hover:border-amber-400/80 transition-all"
                title="Ketuk untuk memperbesar QR"
              >
                <img
                  src={vipSettings.qris_image_url || "/qris-default.svg"}
                  alt="QRIS Pembayaran VIP"
                  className="w-auto h-auto max-h-[220px] sm:max-h-[250px] max-w-full object-contain rounded"
                />

                {/* Floating zoom badge */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[9.5px] font-medium text-white shadow backdrop-blur-md">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <span>Perbesar</span>
                </div>
              </div>

              {/* Small Action row */}
              <div className="mt-2 flex items-center justify-between text-[10px] text-neutral-500 px-1">
                <span className="truncate">GoPay · OVO · DANA · BCA · Semua Bank</span>
                <a
                  href={vipSettings.qris_image_url || "/qris-default.svg"}
                  download="QRIS-VIP-LUX0RIA.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-semibold text-primary hover:underline ml-2"
                >
                  Unduh QR
                </a>
              </div>
            </div>

            {/* ── Area Upload / Kirim Bukti Gambar QR ── */}
            <div className="mt-3">
              <input
                ref={vipProofInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleVipProofUpload}
              />

              {vipProofUrl ? (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-2 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={vipProofUrl}
                        alt="Bukti QR"
                        className="h-9 w-9 shrink-0 rounded-lg object-cover border border-emerald-400/30"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                          <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          <span>Bukti QR Terbaca</span>
                        </div>
                        <p className="text-[9.5px] text-emerald-300/80 font-mono">
                          Rp {vipSettings.price_per_vip.toLocaleString("id-ID")} (Valid)
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVipProofUrl(null);
                        if (vipProofInputRef.current) vipProofInputRef.current.value = "";
                      }}
                      className="shrink-0 text-[10px] text-white/60 hover:text-white px-2 py-0.5 rounded hover:bg-white/10"
                    >
                      Ganti
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => vipProofInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-2.5 text-center cursor-pointer hover:bg-amber-500/10 hover:border-amber-400 transition-all active:scale-[0.99]"
                >
                  {uploadingVipProof ? (
                    <div className="flex items-center gap-2 text-xs text-amber-300 py-0.5">
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10"/></svg>
                      <span className="text-xs">Membaca gambar QR...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                      <div className="text-left min-w-0">
                        <span className="text-xs font-semibold text-white block leading-tight">Upload Bukti Screenshot QR</span>
                        <span className="text-[10px] text-white/45 block">Pilih foto bukti transfer Rp 5.000</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Tombol Konfirmasi */}
            <div className="mt-3 space-y-1.5">
              <button
                onClick={() => handlePost(true)}
                disabled={posting || uploadingVipProof}
                className={`w-full rounded-xl py-2.5 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
                  vipProofUrl
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 shadow-emerald-500/25 active:scale-[0.98]"
                    : "bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 shadow-amber-500/25 active:scale-[0.98]"
                }`}
              >
                {posting ? (
                  "Menerbitkan cerita VIP..."
                ) : vipProofUrl ? (
                  <span>Kirim & Terbitkan VIP (Lunas Rp {vipSettings.price_per_vip.toLocaleString("id-ID")})</span>
                ) : (
                  <span>Konfirmasi Pembayaran (Simulasi Instan)</span>
                )}
              </button>

              <button
                onClick={() => setShowVipModal(false)}
                className="w-full py-1 text-xs text-white/45 hover:text-white transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── IMAGE ZOOM MODAL (POPUP PREVIEW FULLSCREEN) ─────── */}
      {mounted && zoomedImageUrl && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setZoomedImageUrl(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setZoomedImageUrl(null)}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors z-10"
            title="Tutup (Esc)"
            aria-label="Tutup preview foto"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="relative h-[85vh] w-[90vw] max-h-[85vh] max-w-[90vw]">
            <Image
              src={zoomedImageUrl}
              alt="Preview foto cerita"
              fill
              unoptimized
              sizes="90vw"
              className="rounded-2xl object-contain shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>,
        document.body
      )}

      {/* ── CROP MODAL 1:1 (ASPECT RATIO ADJUSTER) ─────────── */}
      {mounted && showCropModal && cropRawSrc && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          {/* Overlay klik luar untuk tutup */}
          <div
            className="fixed inset-0 bg-transparent"
            onClick={() => setShowCropModal(false)}
            aria-hidden="true"
          />

          <div
            className="relative z-10 w-full max-w-sm rounded-2xl bg-[#0c0c12] border border-neutral-800 p-5 text-white shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Sesuaikan Foto</span>
                  <span className="text-[10px] font-mono bg-primary/20 text-primary-on-dark px-1.5 py-0.5 rounded font-bold border border-primary/30">1:1</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Geser atau atur ukuran agar pas di kotak 1:1
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCropModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Tutup"
                aria-label="Tutup pemotong foto"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 1:1 Crop Viewport Box */}
            <div
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="mx-auto relative h-[280px] w-[280px] overflow-hidden rounded-xl border-2 border-neutral-700 bg-neutral-950 cursor-grab active:cursor-grabbing select-none touch-none shadow-inner"
            >
              {/* Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={cropImgRef}
                src={cropRawSrc}
                alt="Crop preview"
                onLoad={handleCropImgLoad}
                draggable={false}
                style={{
                  position: "absolute",
                  left: `${cropCalculatedLeft}px`,
                  top: `${cropCalculatedTop}px`,
                  width: `${cropRenderedW}px`,
                  height: `${cropRenderedH}px`,
                  maxWidth: "none",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />

              {/* 3x3 Rule-of-thirds grid overlay */}
              <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/20">
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div />
              </div>

              {/* Pan hint badge */}
              <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[10px] text-neutral-300 backdrop-blur-sm">
                Tahan & geser foto
              </div>
            </div>

            {/* Zoom Slider Control */}
            <div className="mt-4 px-1">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  Perbesar
                </span>
                <span className="font-mono text-[11px] text-neutral-300">
                  {Math.round(cropZoom * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.02"
                value={cropZoom}
                onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                className="w-full accent-primary h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={applyCrop}
                className="flex-1 rounded-xl bg-primary hover:bg-primary-focus py-2.5 text-xs font-bold text-white transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4 stroke-[2.5]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Gunakan Foto (1:1)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCropModal(false)}
                className="rounded-xl border border-neutral-700 hover:bg-neutral-800 px-4 py-2.5 text-xs text-neutral-300 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
