import Link from "next/link";
import { PhoneForm } from "./phone-form";
import { PasswordForm } from "./password-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; mode?: string }>;
}) {
  const { next, error, mode } = await searchParams;
  const byPassword = mode === "password";
  const q = next ? `&next=${encodeURIComponent(next)}` : "";

  return (
    <>
      <h1>Нэвтрэх</h1>
      <div className="tabs" role="tablist">
        <Link href={`/login?mode=phone${q}`} role="tab" aria-selected={!byPassword} className={`tab${!byPassword ? " on" : ""}`}>
          Утасны дугаар
        </Link>
        <Link href={`/login?mode=password${q}`} role="tab" aria-selected={byPassword} className={`tab${byPassword ? " on" : ""}`}>
          Нэвтрэх нэр
        </Link>
      </div>
      {error === "inactive" && <p className="form-error">Таны эрх идэвхгүй байна. Админд хандана уу.</p>}
      {byPassword ? (
        <>
          <PasswordForm next={next ?? "/"} />
          <p className="muted small">
            Бүртгэлгүй юу? <Link href={`/login/register?${q.slice(1)}`}>Бүртгүүлэх</Link>
          </p>
        </>
      ) : (
        <>
          <p className="muted">Утасны дугаараа оруулахад баталгаажуулах код SMS-ээр ирнэ.</p>
          <PhoneForm next={next ?? "/"} />
        </>
      )}
    </>
  );
}
