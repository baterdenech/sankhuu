-- Sankhuu: demo өгөгдлийг бүрэн устгана (зөвхөн 'demo_' угтвартай мөрүүд)
BEGIN;
SET LOCAL search_path TO public;
UPDATE public."Product" SET "ratingCount"=0, "ratingSum"=0 WHERE id LIKE 'demo_%';
DELETE FROM public."Review" WHERE id LIKE 'demo_%';
DELETE FROM public."Delivery" WHERE id LIKE 'demo_%';
DELETE FROM public."OrderItem" WHERE "orderId" LIKE 'demo_%';
DELETE FROM public."ProductVariant" WHERE "productId" LIKE 'demo_%';
DELETE FROM public."Order" WHERE id LIKE 'demo_%';
DELETE FROM public."Address" WHERE id LIKE 'demo_%';
DELETE FROM public."Customer" WHERE id LIKE 'demo_%';
DELETE FROM public."Product" WHERE id LIKE 'demo_%';
DELETE FROM public."ShopMember" WHERE "shopId" LIKE 'demo_%';
UPDATE public."Shop" SET "pickupAddressId"=NULL WHERE id LIKE 'demo_%';
DELETE FROM public."Shop" WHERE id LIKE 'demo_%';
COMMIT;
