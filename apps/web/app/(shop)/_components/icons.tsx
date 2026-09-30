// Доод цэс болон товчнуудын дүрсүүд (inline SVG, 24px)
type P = { size?: number; className?: string };
const base = (size = 24) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

export const HomeIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></svg>
);
export const GridIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>
);
export const SearchIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.3-4.3" /></svg>
);
export const CartIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 4h2l2.4 11h11.2L21 8H7" /><circle cx="9.5" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></svg>
);
export const UserIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
);
export const BackIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="m15 5-7 7 7 7" /></svg>
);
export const TruckIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>
);
export const StoreIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 9 5.5 4h13L20 9" /><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9" /><path d="M5 12v8h14v-8" /></svg>
);
export const CheckIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
