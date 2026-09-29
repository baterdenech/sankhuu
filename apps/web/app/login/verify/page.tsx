import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPhone, normalizeMongolianPhone } from "@/lib/phone";
import { CodeForm } from "./code-form";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; next?: string }>;
}) {
  const params = await searchParams;
  const phone = normalizeMongolianPhone(params.phone ?? "");
  if (!phone) redirect("/login");

  return (
    <>
      <h1>Код оруулах</h1>
      <p className="muted">
        <strong>{formatPhone(phone)}</strong> дугаарт илгээсэн кодыг оруулна уу.
      </p>
      <CodeForm phone={phone} next={params.next ?? "/"} />
      <p className="muted small">
        <Link href="/login">Дугаараа солих / кодыг дахин авах</Link>
      </p>
    </>
  );
}
