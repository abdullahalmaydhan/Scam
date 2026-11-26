/**
 * Home-only line drawings (DESIGN.md §4): two stamp rings (solid + dashed),
 * two chat bubbles and one dotted wave. Decorative, behind the content.
 */
export function HomeDecor() {
  const common = {
    "aria-hidden": true,
    fill: "none",
    strokeWidth: 1.5,
    className: "pointer-events-none absolute inset-0 h-full w-full stroke-deco",
  } as const;
  return (
    <>
      <svg {...common} viewBox="0 0 390 844" preserveAspectRatio="xMidYMin slice" className={`${common.className} lg:hidden`}>
        <circle cx="40" cy="150" r="70" />
        <circle cx="40" cy="150" r="58" strokeDasharray="3 6" />
        <path d="M300 96h64a10 10 0 0110 10v34a10 10 0 01-10 10h-40l-14 12v-12h-10a10 10 0 01-10-10v-34a10 10 0 0110-10z" />
        <path d="M312 114h40M312 128h26" />
        <path d="M24 560h54a10 10 0 0110 10v28a10 10 0 01-10 10H44l-12 10v-10h-8a10 10 0 01-10-10v-28a10 10 0 0110-10z" />
        <circle cx="350" cy="690" r="46" />
        <circle cx="350" cy="690" r="36" strokeDasharray="3 6" />
        <path d="M120 760q40-30 80 0t80 0" strokeDasharray="2 7" strokeLinecap="round" />
      </svg>
      <svg {...common} viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid slice" className={`${common.className} hidden lg:block`}>
        <circle cx="140" cy="180" r="110" />
        <circle cx="140" cy="180" r="94" strokeDasharray="3 7" />
        <path d="M1060 90h120a14 14 0 0114 14v52a14 14 0 01-14 14h-74l-20 16v-16h-26a14 14 0 01-14-14v-52a14 14 0 0114-14z" />
        <path d="M1076 116h84M1076 138h50" />
        <path d="M60 620h90a12 12 0 0112 12v40a12 12 0 01-12 12H98l-16 14v-14H60a12 12 0 01-12-12v-40a12 12 0 0112-12z" />
        <circle cx="1150" cy="660" r="80" />
        <circle cx="1150" cy="660" r="66" strokeDasharray="3 7" />
        <path d="M420 760q60-40 120 0t120 0t120 0" strokeDasharray="2 8" strokeLinecap="round" />
      </svg>
    </>
  );
}
