// Доод цэс болон товчнуудын дүрсүүд (inline SVG, 24px). `filled` нь идэвхтэй табын дүүргэсэн хувилбар (Coupang маяг).
type P = { size?: number; className?: string; filled?: boolean };
const base = (size = 24) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });
const solid = (size = 24) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "currentColor", stroke: "none", "aria-hidden": true });

export const HomeIcon = ({ size, className, filled }: P) =>
  filled ? (
    <svg {...solid(size)} className={className}><path d="M12 3.2 2.5 11.1a1 1 0 0 0 .65 1.76H5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-7.14h1.85a1 1 0 0 0 .65-1.76z" /></svg>
  ) : (
    <svg {...base(size)} className={className}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v10h14V10" /></svg>
  );
export const GridIcon = ({ size, className, filled }: P) =>
  filled ? (
    <svg {...solid(size)} className={className}><rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.8" /><rect x="13" y="3.5" width="7.5" height="7.5" rx="1.8" /><rect x="3.5" y="13" width="7.5" height="7.5" rx="1.8" /><rect x="13" y="13" width="7.5" height="7.5" rx="1.8" /></svg>
  ) : (
    <svg {...base(size)} className={className}><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></svg>
  );
export const SearchIcon = ({ size, className, filled }: P) => (
  <svg {...base(size)} className={className} strokeWidth={filled ? 2.6 : 1.9}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.3-4.3" /></svg>
);
export const CartIcon = ({ size, className, filled }: P) =>
  filled ? (
    <svg {...solid(size)} className={className}><path d="M3 3.5a1 1 0 0 0 0 2h1.2l2.2 10.1a1 1 0 0 0 1 .8h10.9a1 1 0 0 0 .97-.76L21.3 8a1 1 0 0 0-.97-1.24H6.6l-.6-2.5a1 1 0 0 0-1-.76z" /><circle cx="9.5" cy="19.5" r="1.6" /><circle cx="17" cy="19.5" r="1.6" /></svg>
  ) : (
    <svg {...base(size)} className={className}><path d="M3 4h2l2.4 11h11.2L21 8H7" /><circle cx="9.5" cy="19" r="1.3" /><circle cx="17" cy="19" r="1.3" /></svg>
  );
export const UserIcon = ({ size, className, filled }: P) =>
  filled ? (
    <svg {...solid(size)} className={className}><circle cx="12" cy="8" r="4.3" /><path d="M4 20.2a8 8 0 0 1 16 0 .8.8 0 0 1-.8.8H4.8a.8.8 0 0 1-.8-.8z" /></svg>
  ) : (
    <svg {...base(size)} className={className}><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
  );
export const BackIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="m15 5-7 7 7 7" /></svg>
);
export const ChevronIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="m9 5 7 7-7 7" /></svg>
);
export const TruckIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>
);
// Coupang-ийн "로켓배송" лого маягийн жижиг пуужин (дүүргэсэн)
export const RocketIcon = ({ size, className }: P) => (
  <svg {...solid(size ?? 14)} className={className}><path d="M20.5 3.5c-4.6-.5-8.4 1.2-11 4.4L6.2 8.2a1 1 0 0 0-.6.3L3.4 10.7a.6.6 0 0 0 .3 1l3 .7 4.9 4.9.7 3a.6.6 0 0 0 1 .3l2.2-2.2a1 1 0 0 0 .3-.6l.3-3.3c3.2-2.6 4.9-6.4 4.4-11zM15.8 9.7a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM4 20l1.6-4.2c.8.1 1.6.5 2.2 1.1s1 1.4 1.1 2.2z" /></svg>
);
export const StoreIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="M4 9 5.5 4h13L20 9" /><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9" /><path d="M5 12v8h14v-8" /></svg>
);
export const CheckIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const ClockIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const BoxIcon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}><path d="m3.5 7.5 8.5-4 8.5 4-8.5 4z" /><path d="M3.5 7.5v9l8.5 4 8.5-4v-9" /><path d="M12 11.5v9" /></svg>
);
