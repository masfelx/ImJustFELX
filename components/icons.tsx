import type { SVGProps } from "react";

/**
 * Ikon monokrom bergaya Apple — mewarisi warna teks (currentColor).
 * Dipakai untuk kartu donasi, chip sosial media, dan link lainnya.
 */

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps): IconProps {
  return {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

/** Saweria — cangkir kopi (traktir) */
export function CoffeeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
      <path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M7.5 5c0-1 .8-1.2.8-2M11 5c0-1 .8-1.2.8-2" />
    </svg>
  );
}

/** Sociabuzz — percikan / bintang empat */
export function SparkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />
    </svg>
  );
}

/** Sibagi — kado */
export function GiftIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="9" width="16" height="11" rx="2" />
      <path d="M4 13h16M12 9v11" />
      <path d="M9 9a6 6 0 0 1 6-6c0 3.5-2.5 6-6 6M15 9a6 6 0 0 0-6-6c0 3.5 2.5 6 6 6" />
    </svg>
  );
}

/** Fallback donasi — hati */
export function HeartIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 20s-7-4.6-7-9.5A4 4 0 0 1 12 7a4 4 0 0 1 7 3.5C19 15.4 12 20 12 20Z" />
    </svg>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="18" height="12" rx="3.5" />
      <path d="M10.5 9.5l4 2.5-4 2.5v-5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base(props)} strokeWidth={2}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function TiktokIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 4c.5 2.5 2 4 5 4.5" />
    </svg>
  );
}

/** Globe — website lain */
export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c-5.5 5-5.5 12 0 17M12 3.5c5.5 5 5.5 12 0 17" />
    </svg>
  );
}

/** Panah keluar — link umum */
export function LinkIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

/** Tentang — sosok orang */
export function UserIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.5 3.8-5 7-5s5.8 1.5 7 5" />
    </svg>
  );
}

const icons: Record<string, (props: IconProps) => React.JSX.Element> = {
  coffee: CoffeeIcon,
  spark: SparkIcon,
  gift: GiftIcon,
  heart: HeartIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  x: XIcon,
  tiktok: TiktokIcon,
  globe: GlobeIcon,
  link: LinkIcon,
  user: UserIcon,
};

/** Ambil ikon berdasarkan nama; fallback panah keluar */
export function SiteIcon({
  name,
  ...props
}: IconProps & { name?: string }) {
  const Component = (name && icons[name]) || LinkIcon;
  return <Component {...props} />;
}
