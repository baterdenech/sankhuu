import { PhoneForm } from "./phone-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <>
      <h1>Нэвтрэх</h1>
      <p className="muted">Утасны дугаараа оруулахад баталгаажуулах код SMS-ээр ирнэ.</p>
      {error === "inactive" && <p className="form-error">Таны эрх идэвхгүй байна. Админд хандана уу.</p>}
      <PhoneForm next={next ?? "/"} />
    </>
  );
}
