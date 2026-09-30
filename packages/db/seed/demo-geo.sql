-- Sankhuu: demo дэлгүүрүүдийн барааг авах хаягт координат өгнө (диспетчерийн газрын зураг дээр харагдана).
-- demo.sql, demo-more.sql-ийн дараа ажиллуулна; дахин ажиллуулахад аюулгүй.
BEGIN;
SET LOCAL search_path TO public;
UPDATE public."Address" SET lat=47.9215, lng=106.9200 WHERE id='demo_a1'; -- Сүхбаатар, Их сургуулийн гудамж
UPDATE public."Address" SET lat=47.9145, lng=106.8730 WHERE id='demo_a2'; -- Баянгол, Энхтайвны өргөн чөлөө
UPDATE public."Address" SET lat=47.8890, lng=106.9230 WHERE id='demo_a3'; -- Хан-Уул, Зайсан
UPDATE public."Address" SET lat=47.9260, lng=106.9110 WHERE id='demo_a4'; -- Чингэлтэй, Бага тойруу
UPDATE public."Address" SET lat=47.9190, lng=106.9760 WHERE id='demo_a5'; -- Баянзүрх, Дүнжингарав
COMMIT;
