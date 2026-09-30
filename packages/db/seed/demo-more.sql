-- Sankhuu: нэмэлт demo өгөгдөл (demo.sql-ийн дараа ажиллуулна): 2 дэлгүүр, 16 бараа, 4 үнэлгээ.
-- Хүнс, Гэр ахуй, Спорт, Электрон ангиллыг баяжуулна. Устгах бол demo-cleanup.sql (id-ууд 'demo_' угтвартай).

BEGIN;

INSERT INTO "Address"(id,district,khoroo,details) VALUES ('demo_a4','Чингэлтэй','3','Бага тойруу 22, Органик дэлгүүр') ON CONFLICT DO NOTHING;
INSERT INTO "Shop"(id,name,slug,phone,"isActive","createdAt","updatedAt","pickupAddressId") VALUES ('demo_s4','Тэрэлж Органик','demo-terelj-organic','+97699110004',true,now()-interval '20 days',now(),'demo_a4') ON CONFLICT DO NOTHING;
INSERT INTO "Address"(id,district,khoroo,details) VALUES ('demo_a5','Баянзүрх','26','Дүнжингарав худалдааны төв, 2 давхар B-14') ON CONFLICT DO NOTHING;
INSERT INTO "Shop"(id,name,slug,phone,"isActive","createdAt","updatedAt","pickupAddressId") VALUES ('demo_s5','Хоум Плюс','demo-home-plus','+97699110005',true,now()-interval '18 days',now(),'demo_a5') ON CONFLICT DO NOTHING;

-- Хүнс (Тэрэлж Органик)
INSERT INTO "Product"(id,"shopId",name,price,"compareAtPrice",stock,category,description,images,"isActive","createdAt","updatedAt") VALUES
('demo_p19','demo_s4','Хар зээрдийн зөгийн бал 500гр',38000,45000,24,'Хүнс','Хэнтий аймгийн уулын зөгийн бал. Байгалийн, нэмэлтгүй. Шилэн саванд.',ARRAY['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '1 days',now()),
('demo_p20','demo_s4','Кофены үр, Этиоп 250гр',29000,NULL,30,'Хүнс','Дунд зэрэг хуурсан, жимсний амттай. Захиалга бүрд шинээр хуурна.',ARRAY['https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '2 days',now()),
('demo_p21','demo_s4','Ногоон цай, жасмин 100гр',18000,22000,40,'Хүнс','Жасмины цэцгээр үнэртүүлсэн ногоон цай. Цаасан савлагаатай.',ARRAY['https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '3 days',now()),
('demo_p22','demo_s4','Гар аргаар хийсэн хар шоколад 90гр',12000,NULL,50,'Хүнс','72% какао, сахар багатай. Бэлгийн боодолтой.',ARRAY['https://images.unsplash.com/photo-1511381939415-e44015466834?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '4 days',now()),
('demo_p23','demo_s4','Шинэ жимс, ногооны сагс',45000,NULL,15,'Хүнс','7 хоногийн ногоо, жимсний багц: алим, банана, өргөст хэмх, улаан лооль, навчит ногоо.',ARRAY['https://images.unsplash.com/photo-1540420773420-3366772f4999?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '1 days',now()),
('demo_p24','demo_s4','Исгэсэн талх, бүхэл үрийн',9000,NULL,20,'Хүнс','Өдөр бүр өглөө жигнэнэ. Хадгалах бодисгүй.',ARRAY['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '2 days',now());

-- Гэр ахуй, Спорт, Электрон (Хоум Плюс)
INSERT INTO "Product"(id,"shopId",name,price,"compareAtPrice",stock,category,description,images,"isActive","createdAt","updatedAt") VALUES
('demo_p25','demo_s5','Ширээний гэрэл, модон суурьтай',68000,85000,12,'Гэр ахуй','Дулаан гэрэлтэй LED, 3 шатлалт тодрол. USB цэнэглэгчтэй.',ARRAY['https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '2 days',now()),
('demo_p26','demo_s5','Керамик аяга, 350мл, 2 ширхэг',24000,NULL,35,'Гэр ахуй','Гар аргаар паалангаар бүрсэн. Аяга угаагчид зориулсан.',ARRAY['https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '5 days',now()),
('demo_p27','demo_s5','Орны даавуу, 100% хөвөн, 2 хүний',129000,159000,8,'Гэр ахуй','Зөөлөн сатин хөвөн, дэрний уут 2 ширхэгтэй. Бор, саарал, цагаан өнгөтэй.',ARRAY['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '3 days',now()),
('demo_p28','demo_s5','Өрөөний ургамал, монстера',55000,NULL,6,'Гэр ахуй','40-50 см өндөр, керамик тавагтай. Арчилгааны заавар дагалдана.',ARRAY['https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '6 days',now()),
('demo_p29','demo_s5','Гантель, 2×5 кг',79000,NULL,10,'Спорт','Резин бүрхүүлтэй, гулсдаггүй бариултай. Гэрийн дасгалд.',ARRAY['https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '4 days',now()),
('demo_p30','demo_s5','Хотын дугуй, 7 араатай',890000,990000,3,'Спорт','Хөнгөн хөнгөн цагаан рам, LED гэрэл, түгжээ дагалдана. Угсарч өгнө.',ARRAY['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '7 days',now()),
('demo_p31','demo_s5','Bluetooth чанга яригч, усны хамгаалалттай',95000,120000,14,'Электрон бараа','12 цаг ажиллана, IPX7. Хоёрыг холбож стерео болгоно.',ARRAY['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '1 days',now()),
('demo_p32','demo_s5','Механик гар, RGB гэрэлтэй',145000,NULL,9,'Электрон бараа','Улаан свичтэй, кирилл/латин тэмдэглэгээтэй. USB-C кабель.',ARRAY['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '3 days',now()),
('demo_p33','demo_s5','Эрэгтэй арьсан куртка',390000,450000,4,'Хувцас','Жинхэнэ хонины арьс, дотор нь дулаан доторлогоотой. M–XL.',ARRAY['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '2 days',now()),
('demo_p34','demo_s5','Хүүхдийн барилгын блок, 500 ширхэг',49000,NULL,22,'Хүүхдийн бараа','Хоргүй ABS хуванцар, 3+ насны хүүхдэд. Хайрцагтай.',ARRAY['https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=900&q=80&auto=format&fit=crop']::text[],true,now()-interval '5 days',now());

-- Хэдэн захиалга, үнэлгээ (эрэлттэй, үнэлгээтэй бараа харагдуулах)
INSERT INTO "Customer"(id,"shopId",name,phone,"createdAt","updatedAt") VALUES ('demo_c13','demo_s4','Энхжин','+97688000013',now()-interval '6 days',now()) ON CONFLICT DO NOTHING;
INSERT INTO "Address"(id,"customerId",district,khoroo,details) VALUES ('demo_ad13','demo_c13','Сүхбаатар','8','Туршилтын хаяг 13') ON CONFLICT DO NOTHING;
INSERT INTO "Order"(id,"shopId","customerId",source,status,subtotal,"deliveryFee",total,"paymentMethod","paymentStatus","createdAt","updatedAt") VALUES ('demo_o13','demo_s4','demo_c13','OTHER','DELIVERED',76000,5000,81000,'CASH_ON_DELIVERY','PAID',now()-interval '6 days',now()) ON CONFLICT DO NOTHING;
INSERT INTO "OrderItem"(id,"orderId","productId",name,"unitPrice",quantity) VALUES ('demo_o13_i','demo_o13','demo_p19','Хар зээрдийн зөгийн бал 500гр',38000,2) ON CONFLICT DO NOTHING;
INSERT INTO "Delivery"(id,"orderId",status,"pickupAddressId","dropoffAddressId",fee,"codAmount","codCollected","deliveredAt","createdAt","updatedAt") VALUES ('demo_d13','demo_o13','DELIVERED','demo_a4','demo_ad13',5000,81000,81000,now()-interval '5 days',now()-interval '6 days',now()) ON CONFLICT DO NOTHING;
INSERT INTO "Review"(id,"productId","orderId","shopId",rating,comment,images,"customerName","createdAt") VALUES ('demo_r13','demo_p19','demo_o13','demo_s4',5,'Жинхэнэ уулын бал, өтгөн бас үнэртэй. Ээждээ бас захиалж өгсөн.','{}','Энхжин',now()-interval '4 days') ON CONFLICT DO NOTHING;

INSERT INTO "Customer"(id,"shopId",name,phone,"createdAt","updatedAt") VALUES ('demo_c14','demo_s4','Ганзориг','+97688000014',now()-interval '3 days',now()) ON CONFLICT DO NOTHING;
INSERT INTO "Address"(id,"customerId",district,khoroo,details) VALUES ('demo_ad14','demo_c14','Хан-Уул','15','Туршилтын хаяг 14') ON CONFLICT DO NOTHING;
INSERT INTO "Order"(id,"shopId","customerId",source,status,subtotal,"deliveryFee",total,"paymentMethod","paymentStatus","createdAt","updatedAt") VALUES ('demo_o14','demo_s4','demo_c14','OTHER','DELIVERED',58000,5000,63000,'CASH_ON_DELIVERY','PAID',now()-interval '3 days',now()) ON CONFLICT DO NOTHING;
INSERT INTO "OrderItem"(id,"orderId","productId",name,"unitPrice",quantity) VALUES ('demo_o14_i','demo_o14','demo_p20','Кофены үр, Этиоп 250гр',29000,2) ON CONFLICT DO NOTHING;
INSERT INTO "Delivery"(id,"orderId",status,"pickupAddressId","dropoffAddressId",fee,"codAmount","codCollected","deliveredAt","createdAt","updatedAt") VALUES ('demo_d14','demo_o14','DELIVERED','demo_a4','demo_ad14',5000,63000,63000,now()-interval '2 days',now()-interval '3 days',now()) ON CONFLICT DO NOTHING;
INSERT INTO "Review"(id,"productId","orderId","shopId",rating,comment,images,"customerName","createdAt") VALUES ('demo_r14','demo_p20','demo_o14','demo_s4',4,'Шинэхэн хуурсан нь мэдрэгдэж байна. Бага зэрэг исгэлэн, надад таалагдсан.','{}','Ганзориг',now()-interval '1 days') ON CONFLICT DO NOTHING;

INSERT INTO "Customer"(id,"shopId",name,phone,"createdAt","updatedAt") VALUES ('demo_c15','demo_s5','Мөнхцэцэг','+97688000015',now()-interval '5 days',now()) ON CONFLICT DO NOTHING;
INSERT INTO "Address"(id,"customerId",district,khoroo,details) VALUES ('demo_ad15','demo_c15','Баянгол','20','Туршилтын хаяг 15') ON CONFLICT DO NOTHING;
INSERT INTO "Order"(id,"shopId","customerId",source,status,subtotal,"deliveryFee",total,"paymentMethod","paymentStatus","createdAt","updatedAt") VALUES ('demo_o15','demo_s5','demo_c15','OTHER','DELIVERED',129000,5000,134000,'CASH_ON_DELIVERY','PAID',now()-interval '5 days',now()) ON CONFLICT DO NOTHING;
INSERT INTO "OrderItem"(id,"orderId","productId",name,"unitPrice",quantity) VALUES ('demo_o15_i','demo_o15','demo_p27','Орны даавуу, 100% хөвөн, 2 хүний',129000,1) ON CONFLICT DO NOTHING;
INSERT INTO "Delivery"(id,"orderId",status,"pickupAddressId","dropoffAddressId",fee,"codAmount","codCollected","deliveredAt","createdAt","updatedAt") VALUES ('demo_d15','demo_o15','DELIVERED','demo_a5','demo_ad15',5000,134000,134000,now()-interval '4 days',now()-interval '5 days',now()) ON CONFLICT DO NOTHING;
INSERT INTO "Review"(id,"productId","orderId","shopId",rating,comment,images,"customerName","createdAt") VALUES ('demo_r15','demo_p27','demo_o15','demo_s5',5,'Маш зөөлөн, угаасны дараа ч хэвээрээ. Өнгө нь зурагтайгаа адил.','{}','Мөнхцэцэг',now()-interval '3 days') ON CONFLICT DO NOTHING;

INSERT INTO "Customer"(id,"shopId",name,phone,"createdAt","updatedAt") VALUES ('demo_c16','demo_s5','Бямбасүрэн','+97688000016',now()-interval '2 days',now()) ON CONFLICT DO NOTHING;
INSERT INTO "Address"(id,"customerId",district,khoroo,details) VALUES ('demo_ad16','demo_c16','Сонгинохайрхан','12','Туршилтын хаяг 16') ON CONFLICT DO NOTHING;
INSERT INTO "Order"(id,"shopId","customerId",source,status,subtotal,"deliveryFee",total,"paymentMethod","paymentStatus","createdAt","updatedAt") VALUES ('demo_o16','demo_s5','demo_c16','OTHER','DELIVERED',95000,6000,101000,'CASH_ON_DELIVERY','PAID',now()-interval '2 days',now()) ON CONFLICT DO NOTHING;
INSERT INTO "OrderItem"(id,"orderId","productId",name,"unitPrice",quantity) VALUES ('demo_o16_i','demo_o16','demo_p31','Bluetooth чанга яригч, усны хамгаалалттай',95000,1) ON CONFLICT DO NOTHING;
INSERT INTO "Delivery"(id,"orderId",status,"pickupAddressId","dropoffAddressId",fee,"codAmount","codCollected","deliveredAt","createdAt","updatedAt") VALUES ('demo_d16','demo_o16','DELIVERED','demo_a5','demo_ad16',6000,101000,101000,now()-interval '1 days',now()-interval '2 days',now()) ON CONFLICT DO NOTHING;
INSERT INTO "Review"(id,"productId","orderId","shopId",rating,comment,images,"customerName","createdAt") VALUES ('demo_r16','demo_p31','demo_o16','demo_s5',5,'Дуу нь хэмжээнээсээ хамаагүй хүчтэй. Усанд орохдоо ашиглаж байна.','{}','Бямбасүрэн',now()-interval '12 hours') ON CONFLICT DO NOTHING;

UPDATE "Product" SET "ratingCount"=1,"ratingSum"=5 WHERE id IN ('demo_p19','demo_p27','demo_p31');
UPDATE "Product" SET "ratingCount"=1,"ratingSum"=4 WHERE id='demo_p20';

COMMIT;
