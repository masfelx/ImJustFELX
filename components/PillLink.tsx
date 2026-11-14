import Link from "next/link";

type Variant = "primary" | "ghost";

type CommonProps = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
};

const styles: Record<Variant, string> = {
  // Action Blue #0066cc, pill, 11px × 22px — sinyal aksi utama
  primary: "bg-primary text-white shadow-sm hover:brightness-105",
  // Ghost pill — CTA kedua ("Learn more" / "Buy" grammar)
  ghost: "text-primary border border-primary/80 hover:bg-primary/5",
};

const baseStyles =
  "relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-pill px-[22px] py-[11px] text-body select-none transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-focus cursor-pointer";

/** Tombol/pill gaya Apple untuk link internal (Next.js) dengan GSAP physics & tactile sheen */
export function PillLink({
  href,
  variant = "primary",
  className = "",
  children,
  prefetch = true,
  ...rest
}: CommonProps & { href: string; prefetch?: boolean } & Omit<
    React.ComponentProps<typeof Link>,
    "href" | "className" | "children"
  >) {
  return (
    <Link
      href={href}
      prefetch={prefetch}
      data-apple-btn="true"
      data-magnetic="true"
      className={`${baseStyles} ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

/** Tombol/pill gaya Apple untuk link eksternal (tab baru) */
export function PillExternalLink({
  href,
  variant = "primary",
  className = "",
  children,
}: CommonProps & { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-apple-btn="true"
      data-magnetic="true"
      className={`${baseStyles} ${styles[variant]} ${className}`}
    >
      {children}
    </a>
  );
}
