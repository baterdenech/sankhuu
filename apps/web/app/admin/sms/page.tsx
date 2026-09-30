import { prisma } from "@sankhuu/db";
import { requireAdmin } from "@/lib/roles";
import { smsMode } from "@/lib/sms";
import { formatPhone } from "@/lib/phone";
import { resend } from "./actions";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  ORDER_PLACED: "Захиалга хүлээн авсан",
  SELLER_NEW_ORDER: "Худалдагчид: шинэ захиалга",
  ORDER_CONFIRMED: "Баталгаажсан",
  IN_DELIVERY: "Хүргэлтэд гарсан",
  DELIVERED: "Хүргэгдсэн",
  DELIVERY_FAILED: "Хүргэлт амжилтгүй",
  CANCELLED: "Цуцлагдсан",
};

// SMS мэдэгдлийн лог: туршилтын (log) горимд илгээгдэх байсан бүх мессеж энд харагдана
export default async function SmsPage() {
  await requireAdmin();
  const [rows, counts] = await Promise.all([
    prisma.smsMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.smsMessage.groupBy({ by: ["status"], _count: true }),
  ]);
  const mode = smsMode();
  const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;

  return (
    <>
      <div className="page-head">
        <h1>SMS мэдэгдэл</h1>
        <span className={`status ${mode === "log" ? "s-CONFIRMED" : "s-DELIVERED"}`}>{mode === "log" ? "Туршилтын горим (log)" : `Үйлчилгээ: ${mode}`}</span>
      </div>
      {mode === "log" && (
        <p className="notice">
          Жинхэнэ SMS явахгүй: мессеж бүр энд бүртгэгдэнэ. Үйлчилгээ үзүүлэгч сонгосны дараа Vercel дээр <code>SMS_PROVIDER=http</code>, <code>SMS_HTTP_URL</code>, <code>SMS_HTTP_TOKEN</code> тохируулна (docs/DEPLOY.md).
        </p>
      )}
      <div className="cards" style={{ margin: "16px 0" }}>
        <div className="card">
          <div className="label">Илгээсэн</div>
          <div className="value">{c("SENT")}</div>
        </div>
        <div className="card">
          <div className="label">Амжилтгүй</div>
          <div className="value">{c("FAILED")}</div>
        </div>
        <div className="card">
          <div className="label">Хүлээгдэж буй</div>
          <div className="value">{c("QUEUED")}</div>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="empty">Одоогоор мессеж алга. Захиалга үүсэх, баталгаажих, хүргэгдэх үед энд гарч ирнэ.</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Огноо</th>
              <th>Хэнд</th>
              <th>Төрөл</th>
              <th>Текст</th>
              <th>Төлөв</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="small-text">{r.createdAt.toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" })}</td>
                <td>{formatPhone(r.to)}</td>
                <td className="small-text">{KIND_LABEL[r.kind] ?? r.kind}</td>
                <td className="small-text sms-text">{r.text}</td>
                <td>
                  <span className={`status ${r.status === "SENT" ? "s-DELIVERED" : r.status === "FAILED" ? "s-CANCELLED" : "s-NEW"}`}>{r.status === "SENT" ? "Илгээсэн" : r.status === "FAILED" ? "Амжилтгүй" : "Хүлээгдэж буй"}</span>
                  <div className="small-text muted">{r.provider}</div>
                  {r.error && <div className="small-text form-error">{r.error}</div>}
                </td>
                <td className="row-actions">
                  {r.status === "FAILED" && (
                    <form action={resend.bind(null, r.id)}>
                      <button type="submit" className="btn">
                        Дахин илгээх
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
