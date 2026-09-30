import Link from "next/link";
import { RegisterForm } from "./register-form";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string; as?: string }> }) {
  const { next, as } = await searchParams;
  const buyer = as === "buyer";
  return (
    <>
      <h1>{buyer ? "Худалдан авагчийн бүртгэл" : "Бүртгүүлэх"}</h1>
      <p className="muted">{buyer ? "Захиалгын түүх, дуртай бараа, хаяг тань бүх төхөөрөмж дээр хадгалагдана." : "Нэвтрэх нэр, нууц үгээрээ нэвтэрдэг бүртгэл үүсгэнэ."}</p>
      <RegisterForm next={next ?? (buyer ? "/me" : "/dashboard")} as={buyer ? "buyer" : undefined} />
      <p className="muted small">
        Бүртгэлтэй юу? <Link href={`/login?mode=password${next ? `&next=${encodeURIComponent(next)}` : ""}`}>Нэвтрэх</Link>
      </p>
    </>
  );
}
