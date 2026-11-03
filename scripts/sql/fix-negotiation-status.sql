-- ============================================================================
-- Kolabora — koreksi status kolaborasi yang lahir dari Lamaran DITERIMA
--
-- Masalah   : /api/applications (UMKM menerima pelamar) membuat Collaboration
--             dengan status PROPOSED. PROPOSED berarti "menunggu respons",
--             sehingga dashboard influencer masih menampilkan "Terima Tawaran"
--             dan dashboard UMKM masih menampilkan "Ajukan Kolaborasi", padahal
--             lamaran sudah disetujui dan chat sudah berjalan.
-- Perbaikan : jalur itu kini membuat kolaborasi di status NEGOTIATION
--             (lihat src/app/api/applications/route.ts). Jalur undangan
--             langsung (POST /api/collaborations) TETAP PROPOSED.
--
-- Skrip ini hanya menormalkan data LAMA. Guard-nya ketat:
--   1. hanya baris berstatus PROPOSED,
--   2. hanya bila ada Application ACCEPTED pada campaign yang sama dari
--      influencer yang benar-benar ikut kolaborasi itu,
--   3. kolaborasi tanpa campaign (undangan manual) tidak tersentuh karena
--      co."campaignId" IS NULL membuat EXISTS selalu false.
-- Idempotent: dijalankan dua kali tidak mengubah apa pun lagi. `updatedAt`
-- sengaja tidak disentuh supaya urutan daftar (yang bertumpu kolom ini) tidak
-- melompatkan baris lama ke paling atas.
--
-- Cara pakai (VPS, sebagai superuser):
--   scp scripts/sql/fix-negotiation-status.sql root@IP:/tmp/
--   su postgres -c "psql -q -v ON_ERROR_STOP=1 -d kolabora -f /tmp/fix-negotiation-status.sql"
--
-- Riwayat pemakaian:
--   3 Nov 2026 — dijalankan di kolabora.tech (PostgreSQL lokal, database
--   `kolabora`). Mengubah TEPAT 1 baris: cmvxnqfch000nbzgcnbd5tjw0
--   "Review Koleksi Batik Ayu Solo untuk Gaya Etnik Harian"
--   PROPOSED -> NEGOTIATION. Kolaborasi undangan ("Batik Ayu Lebaran
--   Collection") dan data seed lain tidak tersentuh.
-- ============================================================================

\echo '== SEBELUM: baris yang akan dikoreksi =='
SELECT co.id,
       co.status AS status_lama,
       co.title,
       u.email   AS influencer,
       a.status  AS status_lamaran
FROM "Collaboration" co
JOIN "Campaign"      c  ON c.id = co."campaignId"
JOIN "_CollaborationParticipants" cp ON cp."A" = co.id
JOIN "User"         u  ON u.id = cp."B" AND u.role = 'INFLUENCER'
JOIN "Application"  a  ON a."campaignId" = co."campaignId"
                      AND a."applicantId" = u.id
                      AND a.status = 'ACCEPTED'
WHERE co.status = 'PROPOSED';

BEGIN;

UPDATE "Collaboration" co
SET    status    = 'NEGOTIATION',
       "updatedAt" = co."updatedAt"
WHERE  co.status = 'PROPOSED'
  AND  EXISTS (
        SELECT 1
        FROM   "Application" a
        JOIN   "_CollaborationParticipants" cp ON cp."A" = co.id AND cp."B" = a."applicantId"
        JOIN   "User"        inf               ON inf.id = a."applicantId" AND inf.role = 'INFLUENCER'
        WHERE  a."campaignId" = co."campaignId"
          AND  a.status = 'ACCEPTED'
       );

\echo '== HASIL: baris yang sekarang NEGOTIATION dari jalur lamaran =='
SELECT COALESCE(string_agg(id || ' -> ' || status, ', '), 'tidak ada baris yang berubah') AS hasil
FROM   "Collaboration"
WHERE  status = 'NEGOTIATION'
  AND  id IN (
        SELECT co2.id
        FROM   "Collaboration" co2
        WHERE  co2.status = 'NEGOTIATION'
          AND  EXISTS (
                SELECT 1
                FROM   "Application" a2
                WHERE  a2."campaignId" = co2."campaignId"
                  AND  a2.status = 'ACCEPTED'
                  AND  EXISTS (SELECT 1 FROM "_CollaborationParticipants" cp2
                               WHERE cp2."A" = co2.id AND cp2."B" = a2."applicantId")
              )
       );

COMMIT;

\echo '== SESUDAH: semua kolaborasi =='
SELECT co.status,
       co.title,
       (SELECT string_agg(p.email, ', ')
          FROM "_CollaborationParticipants" cp
          JOIN "User" p ON p.id = cp."B"
         WHERE cp."A" = co.id) AS pihak
FROM   "Collaboration" co
ORDER  BY co."createdAt";
