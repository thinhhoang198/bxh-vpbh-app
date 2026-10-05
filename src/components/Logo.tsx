// Brand rules: never recolour/filter the logo. Dark bg -> white version if public/brand has one
// (picked at build time), otherwise the colour logo on a white rounded card.
// logo-color-sm.png = the same logo downscaled by scripts/make-logo-sm.ts (original kept).
// TODO: add public/brand/logo-white.svg|png when the BTC provides it.
const ALT = "Nam Mekong Grand Plaza Bình Dương";

export function Logo({ heightClass = "h-10 md:h-14" }: { heightClass?: string }) {
  if (__LOGO_WHITE__) {
    return <img src={__LOGO_WHITE__} alt={ALT} className={`w-auto ${heightClass}`} />;
  }
  return (
    <div className="rounded-xl bg-white p-2">
      {/* width/height = intrinsic size, so the browser reserves the right aspect ratio */}
      <img
        src="/brand/logo-color-sm.png"
        alt={ALT}
        width={247}
        height={168}
        fetchPriority="high"
        decoding="async"
        className={`w-auto ${heightClass}`}
      />
    </div>
  );
}
