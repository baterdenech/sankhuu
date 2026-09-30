import Link from "next/link";
import { prisma } from "@sankhuu/db";
import { getCurrentUser, displayName } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { MyOrders } from "./my-orders";
import { signOutBuyer } from "./actions";
import { AskBar } from "../_components/ask-bar";
import { ChevronIcon, StoreIcon, TruckIcon, UserIcon } from "../_components/icons";
import { HeartIcon, HelpIcon, ShieldIcon } from "../_components/catalog-icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Миний · Sankhuu" };

// Coupang "마이쿠팡" маяг: дээр толгой (бүртгэлтэй бол нэр, бүртгэлгүй бол нэвтрэх урилга), захиалгын явц, захиалгууд, цэс
export default async function MePage() {
  const user = await getCurrentUser();
  const favCount = user ? await prisma.favorite.count({ where: { userId: user.id } }) : 0;
  const hasShop = user ? Boolean(await prisma.shopMember.findFirst({ where: { userId: user.id }, select: { id: true } })) : false;

  return (
    <>
      <header className="topbar plain">
        <h1 className="topbar-title">Миний</h1>
      </header>

      {user ? (
        <section className="me-card">
          <span className="me-avatar">
            <UserIcon size={26} />
          </span>
          <span className="me-card-body">
            <strong>{displayName(user, formatPhone)}</strong>
            <span className="muted small-text">
              {user.username ? `@${user.username}` : ""}
              {user.username && user.phone ? " · " : ""}
              {user.phone ? formatPhone(user.phone) : ""}
            </span>
          </span>
          <form action={signOutBuyer}>
            <button type="submit" className="btn small">
              Гарах
            </button>
          </form>
        </section>
      ) : (
        <section className="me-card guest">
          <span className="me-avatar">
            <UserIcon size={26} />
          </span>
          <span className="me-card-body">
            <strong>Бүртгүүлбэл илүү хялбар</strong>
            <span className="muted small-text">Захиалгын түүх, дуртай бараа, хаяг бүх төхөөрөмж дээр хадгалагдана.</span>
          </span>
          <span className="me-card-actions">
            <Link href="/login/register?as=buyer&next=/me" className="btn small primary">
              Бүртгүүлэх
            </Link>
            <Link href="/login?mode=password&next=/me" className="btn small">
              Нэвтрэх
            </Link>
          </span>
        </section>
      )}

      <MyOrders loggedIn={Boolean(user)} />

      <div className="pad">
        <AskBar title="AI туслах" text="Бараа олох, зөвлөгөө авах, хүргэлтийн талаар асуух" />
      </div>
      <ul className="list me-menu">
        <li>
          <Link href="/me/favorites" className="list-row">
            <span className="me-menu-icon">
              <HeartIcon size={20} />
            </span>
            <span className="list-row-body">
              <strong>Дуртай бараа{user && favCount > 0 ? ` (${favCount})` : ""}</strong>
              <span className="muted small-text">{user ? "Зүрх дарж хадгалсан бараанууд" : "Нэвтэрсний дараа зүрх дарж хадгална"}</span>
            </span>
            <ChevronIcon size={18} className="chev" />
          </Link>
        </li>
        <li>
          <Link href="/shops" className="list-row">
            <span className="me-menu-icon">
              <StoreIcon size={20} />
            </span>
            <span className="list-row-body">
              <strong>Дэлгүүрүүд</strong>
              <span className="muted small-text">Sankhuu дээрх бүх дэлгүүр</span>
            </span>
            <ChevronIcon size={18} className="chev" />
          </Link>
        </li>
        <li>
          <div className="list-row">
            <span className="me-menu-icon">
              <TruckIcon size={20} />
            </span>
            <span className="list-row-body">
              <strong>Хүргэлт, төлбөр</strong>
              <span className="muted small-text">УБ хотод 5,000₮-с, 15:00-с өмнө захиалбал маргааш. Төлбөрийг хүлээж авахдаа жолоочид.</span>
            </span>
          </div>
        </li>
        {!user && (
          <li>
            <div className="list-row">
              <span className="me-menu-icon">
                <ShieldIcon size={20} />
              </span>
              <span className="list-row-body">
                <strong>Бүртгэлгүй захиалга</strong>
                <span className="muted small-text">Захиалгын дугаар, утас энэ төхөөрөмж дээр хадгалагдана. Нэвтэрвэл бүртгэлдээ шилжинэ.</span>
              </span>
            </div>
          </li>
        )}
        <li>
          <Link href={hasShop ? "/dashboard" : "/onboarding"} className="list-row">
            <span className="me-menu-icon">
              <HelpIcon size={20} />
            </span>
            <span className="list-row-body">
              <strong>{hasShop ? "Миний дэлгүүр" : "Бараа зардаг уу? Дэлгүүрээ нээ"}</strong>
              <span className="muted small-text">{hasShop ? "Худалдагчийн самбар руу орох" : "Үнэгүй. Зургаа оруулахад AI бүртгэнэ, хүргэлтийг бид хийнэ."}</span>
            </span>
            <ChevronIcon size={18} className="chev" />
          </Link>
        </li>
      </ul>
    </>
  );
}
