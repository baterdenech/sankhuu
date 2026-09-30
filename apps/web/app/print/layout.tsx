import "./print.css";

export const metadata = { title: "Хэвлэх · Sankhuu" };

// Хэвлэх хуудсууд: самбарын хажуугийн цэсгүй, цагаан дэвсгэртэй
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="print-root">{children}</div>;
}
