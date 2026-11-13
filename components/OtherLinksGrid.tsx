"use client";

import { useEffect, useState } from "react";
import type { LinkItem } from "@/lib/site";
import { safeHostname, safeUrl } from "@/lib/site";
import { SiteIcon } from "@/components/icons";
import PartnerSlotCard from "@/components/PartnerSlotCard";

/**
 * Grid website sponsor/partner dengan filter masa aktif (auto-expiry).
 * Filter Date.now() dijalankan di dalam useEffect agar tidak memicu error prerender Next.js.
 */
export default function OtherLinksGrid({ links }: { links: LinkItem[] }) {
  const [items, setItems] = useState<LinkItem[]>(links || []);
  const [activeLinks, setActiveLinks] = useState<LinkItem[]>(links || []);

  // Fetch data terbaru dari Supabase/API agar langsung update tanpa redeploy
  useEffect(() => {
    fetch("/api/terhubung")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.otherLinks) && data.otherLinks.length > 0) {
          setItems(data.otherLinks);
        }
      })
      .catch(() => {
        // Abaikan jika fetch gagal, gunakan fallback props
      });
  }, []);

  useEffect(() => {
    const now = Date.now();
    const filtered = (items || []).filter((item) => {
      if (!item.expires_at) return true; // Tanpa expires_at = permanen
      const expDate = new Date(item.expires_at);
      const expTime = expDate.getTime();
      if (isNaN(expTime)) return true;

      // Jika format hanya YYYY-MM-DD (10 karakter), toleransi sampai akhir hari (23:59:59)
      const deadline =
        item.expires_at.length === 10
          ? expTime + (24 * 60 * 60 * 1000 - 1)
          : expTime;

      return deadline > now;
    });

    setActiveLinks(filtered);
  }, [items]);

  return (
    <div className="mt-6 grid gap-6 sm:grid-cols-2">
      {activeLinks.map((item, i) => (
        <div
          key={item.url}
          data-reveal
          data-reveal-delay={String(0.08 + i * 0.1)}
        >
          <a
            href={safeUrl(item.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-full items-start gap-4 rounded-lg border border-hairline bg-canvas p-6 transition-colors hover:border-ink-muted-48"
          >
            <SiteIcon
              name={item.icon}
              width={24}
              height={24}
              className="mt-0.5 shrink-0 text-ink"
            />
            <span>
              <span className="block text-body-strong text-ink">
                {item.name}
              </span>
              {item.description && (
                <span className="mt-1 block text-caption text-ink-muted-80">
                  {item.description}
                </span>
              )}
              <span className="mt-2 block text-caption text-primary">
                {safeHostname(item.url)}
              </span>
            </span>
          </a>
        </div>
      ))}

      {/* Slot Promosi Website / Partner */}
      <PartnerSlotCard />
    </div>
  );
}
