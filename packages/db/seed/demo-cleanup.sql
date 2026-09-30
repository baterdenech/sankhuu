-- Sankhuu: demo өгөгдлийг бүрэн устгана (зөвхөн 'demo_' угтвартай мөрүүд)
BEGIN;
UPDATE "Product" SET "ratingCount"=0, "ratingSum"=0 WHERE id LIKE 'demo_%';
DELETE FROM "Review" WHERE id LIKE 'demo_%';
DELETE FROM "Delivery" WHERE id LIKE 'demo_%';
DELETE FROM "OrderItem" WHERE "orderId" LIKE 'demo_%';
DELETE FROM "Order" WHERE id LIKE 'demo_%';
DELETE FROM "Address" WHERE id LIKE 'demo_%';
DELETE FROM "Customer" WHERE id LIKE 'demo_%';
DELETE FROM "Product" WHERE id LIKE 'demo_%';
DELETE FROM "ShopMember" WHERE "shopId" LIKE 'demo_%';
UPDATE "Shop" SET "pickupAddressId"=NULL WHERE id LIKE 'demo_%';
DELETE FROM "Shop" WHERE id LIKE 'demo_%';
COMMIT;
