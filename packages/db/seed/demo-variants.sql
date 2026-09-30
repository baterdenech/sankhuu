-- Demo: барааны хувилбар (размер). demo.sql-ийн дараа ажиллуулна. Барааны stock = хувилбаруудын нийлбэр.
BEGIN;
SET LOCAL search_path TO public;
DELETE FROM public."ProductVariant" WHERE id LIKE 'demo_%';
-- Цагаан хөвөн футболк (demo_p01): S–XL, нийт 25
INSERT INTO public."ProductVariant"(id,"productId",name,price,stock,"sortOrder") VALUES
 ('demo_v01','demo_p01','S',NULL,5,0),('demo_v02','demo_p01','M',NULL,8,1),('demo_v03','demo_p01','L',NULL,8,2),('demo_v04','demo_p01','XL',NULL,4,3);
UPDATE public."Product" SET stock=25 WHERE id='demo_p01';
-- Эмэгтэй урт даашинз (demo_p02): S, M, L, нийт 6; L дууссан
INSERT INTO public."ProductVariant"(id,"productId",name,price,stock,"sortOrder") VALUES
 ('demo_v05','demo_p02','S',NULL,2,0),('demo_v06','demo_p02','M',NULL,4,1),('demo_v07','demo_p02','L',NULL,0,2);
UPDATE public."Product" SET stock=6 WHERE id='demo_p02';
-- Улаан пүүз (demo_p06): 38–42, 42 нь 5,000₮ үнэтэй
INSERT INTO public."ProductVariant"(id,"productId",name,price,stock,"sortOrder") VALUES
 ('demo_v08','demo_p06','38',NULL,1,0),('demo_v09','demo_p06','39',NULL,2,1),('demo_v10','demo_p06','40',NULL,2,2),('demo_v11','demo_p06','41',NULL,1,3),('demo_v12','demo_p06','42',215000,1,4);
UPDATE public."Product" SET stock=7 WHERE id='demo_p06';
COMMIT;
