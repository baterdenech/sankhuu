import Link from "next/link";
import { MyOrders } from "./my-orders";
import { AskBar } from "../_components/ask-bar";
import { ChevronIcon, StoreIcon, TruckIcon } from "../_components/icons";
import { HelpIcon, ShieldIcon } from "../_components/catalog-icons";

export const metadata = { title: "Миний · Sankhuu" };

// Coupang "마이쿠팡" маяг: дээр толгой, захиалгын явц, захиалгууд, доор нь цэс
export default function MePage() {
  return (
    <>
      <header className="topbar plain">
        <h1 className="topbar-title">Миний</h1>
      </header>
      <MyOrders />
      <div className="pad">
        <AskBar title="AI туслах" text="Бараа олох, зөвлөгөө авах, хүргэлтийн талаар асуух" />
      </div>
      <ul className="list me-menu">
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
        <li>
          <div className="list-row">
            <span className="me-menu-icon">
              <ShieldIcon size={20} />
            </span>
            <span className="list-row-body">
              <strong>Бүртгэлгүй захиалга</strong>
              <span className="muted small-text">Захиалгын дугаар, утас энэ төхөөрөмж дээр хадгалагдана. Өөр төхөөрөмжөөс харагдахгүй.</span>
            </span>
          </div>
        </li>
        <li>
          <Link href="/login/register" className="list-row">
            <span className="me-menu-icon">
              <HelpIcon size={20} />
            </span>
            <span className="list-row-body">
              <strong>Бараа зардаг уу? Дэлгүүрээ нээ</strong>
              <span className="muted small-text">Үнэгүй. Зургаа оруулахад AI бүртгэнэ, хүргэлтийг бид хийнэ.</span>
            </span>
            <ChevronIcon size={18} className="chev" />
          </Link>
        </li>
      </ul>
    </>
  );
}
