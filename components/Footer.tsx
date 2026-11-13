import Link from "next/link";
import { getDonasiAsync, getSiteConfigAsync, getTerhubungAsync } from "@/lib/admin-data";

/* Tahun berjalan — di-cache agar aman saat prerender statis */
async function getYear() {
  "use cache";
  return new Date().getFullYear();
}

/**
 * Footer parchment ala Apple — kolom link padat dengan leading longgar (2.41),
 * lalu baris legal fine-print di paling bawah.
 * Mengambil link sosial, donasi, dan sponsor live dari database Supabase.
 */
export default async function Footer() {
  const [year, config, donation, terhubung] = await Promise.all([
    getYear(),
    getSiteConfigAsync(),
    getDonasiAsync(),
    getTerhubungAsync(),
  ]);

  const columns: { heading: string; links: { name: string; href: string; external?: boolean }[] }[] =
    [
      {
        heading: "Navigasi",
        links: [
          { name: "Beranda", href: "/" },
          { name: "Donasi", href: "/donasi" },
          { name: "Terhubung", href: "/terhubung" },
          { name: "Tentang", href: "/tentang" },
          { name: "Blog", href: "/blog" },
          { name: "Cerita", href: "/cerita" },
        ],
      },
      {
        heading: "Donasi",
        links: donation.map((d) => ({
          name: d.name,
          href: d.url,
          external: true,
        })),
      },
      {
        heading: "Sosial",
        links: terhubung.socials.map((s) => ({
          name: s.name,
          href: s.url,
          external: true,
        })),
      },
      {
        heading: "Lainnya",
        links: terhubung.otherLinks.map((l) => ({
          name: l.name,
          href: l.url,
          external: true,
        })),
      },
    ];

  return (
    <footer className="bg-parchment text-ink-muted-80">
      <div className="mx-auto max-w-[980px] px-5 py-16">
        {/* Kolom link padat */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {columns.map((column) => (
            <div key={column.heading}>
              <h3 className="text-caption-strong text-ink">{column.heading}</h3>
              <ul className="mt-3">
                {column.links.map((link) =>
                  link.external ? (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-dense text-ink-muted-80 transition-colors hover:text-ink"
                      >
                        {link.name}
                      </a>
                    </li>
                  ) : (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        prefetch={true}
                        className="text-dense text-ink-muted-80 transition-colors hover:text-ink"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Baris legal */}
        <div className="mt-12 border-t border-black/10 pt-4">
          <p className="text-fine text-ink-muted-48">
            © {year} {config.name}. Semua hak dilindungi.
          </p>
          <p className="mt-1 text-fine text-ink-muted-48">
            Tulisan adalah milik penulisnya. Situs ini dibangun dengan Ego Tentang perasaan yang dikhianati wanita, yang alasannya ingin putus padahal memberi kepastian keorang barunya.
          </p>
        </div>
      </div>
    </footer>
  );
}
