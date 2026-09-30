import Link from "next/link";

// PC дэлгэцийн хөл (утсан дээр нуугдана): холбоосууд + хүргэлт/төлбөрийн товч мэдээлэл
export function DesktopFooter() {
  return (
    <footer className="dfoot">
      <div className="dfoot-in">
        <nav className="dfoot-links" aria-label="Хөлийн цэс">
          <Link href="/shops">Дэлгүүрүүд</Link>
          <Link href="/categories">Ангилал</Link>
          <Link href="/search?q=&sale=1">Хямдрал</Link>
          <Link href="/me">Захиалгын түүх</Link>
          <Link href="/login/register">Худалдагч болох</Link>
        </nav>
        <div className="dfoot-cols">
          <div>
            <strong>Хүргэлт</strong>
            <span>Улаанбаатар хотод дүүргээр 5,000₮-с. 15:00-с өмнөх захиалга маргааш, дараах нь нөгөөдөр хүрнэ.</span>
          </div>
          <div>
            <strong>Төлбөр</strong>
            <span>Бараагаа хүлээж авахдаа жолоочид бэлнээр эсвэл шилжүүлгээр төлнө.</span>
          </div>
          <div>
            <strong>Худалдагчид</strong>
            <span>Дэлгүүрээ үнэгүй нээ. Зургаа оруулахад AI нэр, тайлбарыг бичнэ, хүргэлтийг Sankhuu хийнэ.</span>
          </div>
        </div>
        <p className="dfoot-copy">© {new Date().getFullYear()} Sankhuu · Онлайн худалдаа, хүргэлтийн систем</p>
      </div>
    </footer>
  );
}
