/**
 * Sub-nav frosted — strip parchment dengan efek blur.
 * Menempel rapi di bawah global nav yang tingginya 56px (mobile) / 64px (desktop).
 */
export default function SubNav({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="sticky top-14 md:top-16 z-40 border-b border-black/5 bg-parchment/80 backdrop-blur-xl backdrop-saturate-150 transition-all">
      <div className="mx-auto flex h-12 md:h-13 max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <span className="text-base md:text-tagline font-semibold text-ink">{title}</span>
        <div className="flex items-center gap-6">{children}</div>
      </div>
    </div>
  );
}
