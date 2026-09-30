import Link from "next/link";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1>Бүртгүүлэх</h1>
      <p className="muted">Нэвтрэх нэр, нууц үгээрээ нэвтэрдэг бүртгэл үүсгэнэ.</p>
      <RegisterForm next={next ?? "/"} />
      <p className="muted small">
        Бүртгэлтэй юу? <Link href={`/login?mode=password${next ? `&next=${encodeURIComponent(next)}` : ""}`}>Нэвтрэх</Link>
      </p>
    </>
  );
}
