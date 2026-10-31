-- ============================================================================
-- KOLABORA - Data demo (0002_seed_demo.sql)
-- Jalankan SETELAH 0001_init.sql. Idempoten: baris yang sudah ada dilewati.
-- Cara pakai:
--   a) Supabase: Dashboard -> SQL Editor -> tempel seluruh isi file -> Run
--   b) VPS/local: psql -d kolabora -f supabase/migrations/0002_seed_demo.sql
--   c) Alternatif: npm run db:seed (naskah Node, hasil sama)
--
-- Akun demo (semua memakai password: password123)
--   umkm@kolabora.id        UMKM      Kopi Senja
--   brand@kolabora.id       UMKM      Batik Ayu
--   influencer@kolabora.id  Influencer Sarah Beauty
--   foodie@kolabora.id      Influencer Rizky Foodie
-- ============================================================================

BEGIN;

SET search_path TO public;

INSERT INTO public."User" (id, name, email, "emailVerified", "passwordHash", image, role, "createdAt", "updatedAt") VALUES ('cmvwjpgkx0000tw4n4civ941d', 'Ayu Prameswari', 'umkm@kolabora.id', NULL, '$2a$10$FpNNDoddmW8VV/jgxX72UeJdkC9E2B4DeVAvL6FffzDrbOB/V8A.u', NULL, 'UMKM', '2026-10-31 15:18:00.753', '2026-10-31 15:18:00.753' ) ON CONFLICT DO NOTHING;

INSERT INTO public."User" (id, name, email, "emailVerified", "passwordHash", image, role, "createdAt", "updatedAt") VALUES ('cmvwjpgmx0001tw4nmyl8n205', 'Dewi Anggraini', 'brand@kolabora.id', NULL, '$2a$10$s8ea.sbfL5B2ftXG0c50ZO0s2i.XK7S9rLY6zfrwgwNKRvu5Bhfhm', NULL, 'UMKM', '2026-10-31 15:18:00.825', '2026-10-31 15:18:00.825' ) ON CONFLICT DO NOTHING;

INSERT INTO public."User" (id, name, email, "emailVerified", "passwordHash", image, role, "createdAt", "updatedAt") VALUES ('cmvwjpgor0002tw4nqjdunhoy', 'Sarah Beauty', 'influencer@kolabora.id', NULL, '$2a$10$sRnEpULt7eeqVNihBrEA2ea70jM2Uw6KgFzEA.iZqdkqx14IwnrYu', NULL, 'INFLUENCER', '2026-10-31 15:18:00.891', '2026-10-31 15:18:00.891' ) ON CONFLICT DO NOTHING;

INSERT INTO public."User" (id, name, email, "emailVerified", "passwordHash", image, role, "createdAt", "updatedAt") VALUES ('cmvwjpgr30003tw4nvcs2tqqc', 'Rizky Foodie', 'foodie@kolabora.id', NULL, '$2a$10$17hH2TguZzS2XhfH9CS0qec/voR4/QK.TWQ5FkKoo5rbyNCy1xnDS', NULL, 'INFLUENCER', '2026-10-31 15:18:00.976', '2026-10-31 15:18:00.976' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Campaign" (id, "ownerId", title, description, category, "budgetMin", "budgetMax", location, requirements, deliverables, status, "startDate", "endDate", "createdAt", "updatedAt") VALUES ('cmvwjpgrk000dtw4nq4ke9exa', 'cmvwjpgkx0000tw4n4civ941d', 'Review Menu Kopi Senja', 'Kami mencari food creator untuk mereview 3 menu signature Kopi Senja: Kopi Susu Gula Aren, Es Kopi Senja, dan Croissant Butter. Konten berupa 1 video TikTok (minimal 45 detik) + 1 feed Instagram.', 'Kuliner', 500000, 1500000, 'Yogyakarta', 'Domisili Yogyakarta atau sekitarnya, followers minimal 10K, gaya konten natural dan storytelling.', '1 video TikTok + 1 feed Instagram + 3 stories', 'ACTIVE', NULL, NULL, '2026-10-31 15:18:00.993', '2026-10-31 15:18:00.993' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Campaign" (id, "ownerId", title, description, category, "budgetMin", "budgetMax", location, requirements, deliverables, status, "startDate", "endDate", "createdAt", "updatedAt") VALUES ('cmvwjpgrm000ftw4n2vq4yafa', 'cmvwjpgkx0000tw4n4civ941d', 'Konten TikTok Racikan Signature', 'Buat konten TikTok kreatif yang menampilkan proses pembuatan racikan signature barista kami. Fokus pada visual, ASMR, dan cerita di balik setiap cangkir.', 'Kuliner', 750000, 2000000, 'Yogyakarta', 'Menguasai editing video, followers minimal 20K.', '2 video TikTok + hak pakai konten untuk ads 30 hari', 'ACTIVE', NULL, NULL, '2026-10-31 15:18:00.995', '2026-10-31 15:18:00.995' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Campaign" (id, "ownerId", title, description, category, "budgetMin", "budgetMax", location, requirements, deliverables, status, "startDate", "endDate", "createdAt", "updatedAt") VALUES ('cmvwjpgrn000htw4nzv3v8fp5', 'cmvwjpgmx0001tw4nmyl8n205', 'Batik Ayu Lebaran Collection', 'Kampanye peluncuran koleksi Lebaran 2026. Kami mencari fashion creator untuk menampilkan 3 look batik kontemporer dalam konten reels dan carousel.', 'Fashion', 1000000, 3500000, 'Jakarta', 'Niche fashion/lifestyle, followers minimal 30K.', '1 reels + 1 carousel + 2 stories', 'ACTIVE', NULL, NULL, '2026-10-31 15:18:00.996', '2026-10-31 15:18:00.996' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Application" (id, "campaignId", "applicantId", proposal, "proposedRate", status, "createdAt", "updatedAt") VALUES ('cmvwjpgrp000jtw4nhysprbt0', 'cmvwjpgrk000dtw4nq4ke9exa', 'cmvwjpgor0002tw4nqjdunhoy', 'Halo Kopi Senja! Saya Sarah, beauty & lifestyle creator dengan audiens perempuan 18-34 tahun. Saya tertarik membuat konten review menu signature dengan pendekatan estetik dan storytelling. Saya akan menonjolkan suasana kedai dan detail rasa kopi.', 1200000, 'PENDING', '2026-10-31 15:18:00.997', '2026-10-31 15:18:00.997' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Application" (id, "campaignId", "applicantId", proposal, "proposedRate", status, "createdAt", "updatedAt") VALUES ('cmvwjpgrq000ltw4nn3ictcx2', 'cmvwjpgrm000ftw4n2vq4yafa', 'cmvwjpgr30003tw4nvcs2tqqc', 'Hai Kopi Senja! Saya Rizky, food vlogger Jogja dengan 128K followers. Saya bisa bikin konten proses racikan signature dengan gaya ASMR yang engaging, plus rekomendasi menu.', 1500000, 'PENDING', '2026-10-31 15:18:00.999', '2026-10-31 15:18:00.999' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Collaboration" (id, "campaignId", title, brief, budget, status, "escrowAmount", "escrowStatus", "escrowHeldAt", "escrowReleasedAt", "agreedAt", "startedAt", "submittedAt", "approvedAt", "completedAt", "createdAt", "updatedAt") VALUES ('cmvwjpgrt000ntw4nzsn8aqj3', 'cmvwjpgrm000ftw4n2vq4yafa', 'Konten TikTok Racikan Signature', 'Buat 2 video TikTok yang menampilkan proses racikan signature barista. Durasi 45-60 detik, vertikal, dengan voice-over storytelling. Kirim draft untuk review sebelum publikasi.', 1500000, 'IN_PRODUCTION', 1500000, 'HELD', '2026-10-28 15:18:01.001', NULL, '2026-10-27 15:18:01.001', '2026-10-29 15:18:01.001', NULL, NULL, NULL, '2026-10-31 15:18:01.002', '2026-10-31 15:18:01.002' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Collaboration" (id, "campaignId", title, brief, budget, status, "escrowAmount", "escrowStatus", "escrowHeldAt", "escrowReleasedAt", "agreedAt", "startedAt", "submittedAt", "approvedAt", "completedAt", "createdAt", "updatedAt") VALUES ('cmvwjpgs3000stw4ni62134ha', 'cmvwjpgrn000htw4nzv3v8fp5', 'Batik Ayu Lebaran Collection', 'Tampilkan 3 look koleksi Lebaran dalam 1 reels dan 1 carousel. Tone warna earthy, natural light, lokasi café atau rumah dengan dekorasi minimalis.', 2500000, 'PROPOSED', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-10-31 15:18:01.012', '2026-10-31 15:18:01.012' ) ON CONFLICT DO NOTHING;

INSERT INTO public."InfluencerProfile" (id, "userId", "displayName", category, bio, location, followers, engagement, platforms, niches, "rateMin", "rateMax", "createdAt", "updatedAt") VALUES ('cmvwjpgre0009tw4ns3odp0ax', 'cmvwjpgor0002tw4nqjdunhoy', 'Sarah Beauty', 'Kecantikan', 'Beauty creator yang fokus pada review skincare lokal dan makeup sehari-hari. Audiens perempuan 18-34 tahun di Jabodetabek.', 'Jakarta', 48500, 4.8, '["Instagram", "TikTok"]', '{Skincare,Makeup,"Beauty Review"}', 750000, 2500000, '2026-10-31 15:18:00.987', '2026-10-31 15:18:00.987' ) ON CONFLICT DO NOTHING;

INSERT INTO public."InfluencerProfile" (id, "userId", "displayName", category, bio, location, followers, engagement, platforms, niches, "rateMin", "rateMax", "createdAt", "updatedAt") VALUES ('cmvwjpgri000btw4n72oigfic', 'cmvwjpgr30003tw4nvcs2tqqc', 'Rizky Foodie', 'Kuliner', 'Food vlogger Yogyakarta. Konten review kuliner dengan gaya storytelling dan rekomendasi tempat makan hits.', 'Yogyakarta', 128000, 6.2, '["TikTok", "Instagram", "YouTube"]', '{Kuliner,"Food Review",Travel}', 1000000, 4000000, '2026-10-31 15:18:00.991', '2026-10-31 15:18:00.991' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Message" (id, "collaborationId", "senderId", content, type, "fileUrl", read, "createdAt") VALUES ('cmvwjpgs0000otw4nynq9qhj0', 'cmvwjpgrt000ntw4nzsn8aqj3', 'cmvwjpgkx0000tw4n4civ941d', 'Halo Rizky! Selamat, lamaranmu kami terima. Dana sudah kami kunci di escrow. Silakan mulai produksi kontennya ya.', 'BRIEF', NULL, true, '2026-10-27 15:18:01.008' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Message" (id, "collaborationId", "senderId", content, type, "fileUrl", read, "createdAt") VALUES ('cmvwjpgs0000ptw4n5jz3nk1f', 'cmvwjpgrt000ntw4nzsn8aqj3', 'cmvwjpgr30003tw4nvcs2tqqc', 'Siap Kak Ayu! Saya mulai syuting minggu ini. Apakah ada referensi visual atau menu yang wajib ditonjolkan?', 'TEXT', NULL, true, '2026-10-28 15:18:01.008' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Message" (id, "collaborationId", "senderId", content, type, "fileUrl", read, "createdAt") VALUES ('cmvwjpgs0000qtw4n2rrec42x', 'cmvwjpgrt000ntw4nzsn8aqj3', 'cmvwjpgkx0000tw4n4civ941d', 'Fokus ke Es Kopi Senja dan Croissant Butter ya. Nuansa kedai sore hari, hangat, banyak kayu. Nanti kirim draft dulu sebelum upload.', 'TEXT', NULL, true, '2026-10-29 15:18:01.008' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Message" (id, "collaborationId", "senderId", content, type, "fileUrl", read, "createdAt") VALUES ('cmvwjpgs7000utw4nprju6n4i', 'cmvwjpgs3000stw4ni62134ha', 'cmvwjpgmx0001tw4nmyl8n205', 'Halo Sarah! Kami ingin mengajak kamu berkolaborasi untuk koleksi Lebaran Batik Ayu. Brief lengkap ada di halaman kolaborasi. Kami tunggu responsnya ya!', 'BRIEF', NULL, false, '2026-10-31 15:18:01.016' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Notification" (id, "userId", type, title, message, link, read, "createdAt") VALUES ('cmvwjpgs9000wtw4nid9wwkf0', 'cmvwjpgor0002tw4nqjdunhoy', 'COLLABORATION', 'Tawaran kolaborasi baru', 'Batik Ayu mengajak Anda berkolaborasi pada campaign "Batik Ayu Lebaran Collection".', '/dashboard/influencer/history', false, '2026-10-31 15:18:01.017' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Notification" (id, "userId", type, title, message, link, read, "createdAt") VALUES ('cmvwjpgsb000xtw4ns1aslwsp', 'cmvwjpgr30003tw4nvcs2tqqc', 'MESSAGE', 'Pesan baru dari Kopi Senja', 'Kopi Senja mengirim detail brief untuk konten TikTok.', '/dashboard/influencer/chat', false, '2026-10-31 15:18:01.02' ) ON CONFLICT DO NOTHING;

INSERT INTO public."Notification" (id, "userId", type, title, message, link, read, "createdAt") VALUES ('cmvwjpgsb000ytw4nj57c7mzf', 'cmvwjpgkx0000tw4n4civ941d', 'APPLICATION', 'Pelamar baru', 'Sarah Beauty melamar campaign "Review Menu Kopi Senja".', '/dashboard/umkm/campaigns/cmvwjpgrk000dtw4nq4ke9exa', false, '2026-10-31 15:18:01.02' ) ON CONFLICT DO NOTHING;

INSERT INTO public."PortfolioItem" (id, "profileId", title, "imageUrl", link, "createdAt") VALUES ('cmvwjpgsd000ztw4n2iv92b15', 'cmvwjpgre0009tw4ns3odp0ax', 'Review Skincare Lokal — 120K views', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=1200', 'https://instagram.com/p/example-skincare', '2026-10-31 15:18:01.022' ) ON CONFLICT DO NOTHING;

INSERT INTO public."PortfolioItem" (id, "profileId", title, "imageUrl", link, "createdAt") VALUES ('cmvwjpgsd0010tw4n8y6s4xfw', 'cmvwjpgre0009tw4ns3odp0ax', 'Get Ready With Me — Soft Glam', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200', 'https://tiktok.com/@example/video/1', '2026-10-31 15:18:01.022' ) ON CONFLICT DO NOTHING;

INSERT INTO public."UMKMProfile" (id, "userId", "businessName", category, description, location, website, "logoUrl", "createdAt", "updatedAt") VALUES ('cmvwjpgr50005tw4n7zwb54n8', 'cmvwjpgkx0000tw4n4civ941d', 'Kopi Senja', 'Kuliner', 'Kedai kopi lokal di Yogyakarta dengan biji kopi single origin dari petani Sleman. Menyediakan kopi susu gula aren, manual brew, dan pastry rumahan.', 'Yogyakarta', 'https://kopisenja.example.com', NULL, '2026-10-31 15:18:00.977', '2026-10-31 15:18:00.977' ) ON CONFLICT DO NOTHING;

INSERT INTO public."UMKMProfile" (id, "userId", "businessName", category, description, location, website, "logoUrl", "createdAt", "updatedAt") VALUES ('cmvwjpgrd0007tw4n9ff28iid', 'cmvwjpgmx0001tw4nmyl8n205', 'Batik Ayu', 'Fashion', 'Batik tulis handmade dengan motif kontemporer. Diproduksi oleh pengrajin lokal di Solo dengan pewarna alami.', 'Solo', 'https://batikayu.example.com', NULL, '2026-10-31 15:18:00.985', '2026-10-31 15:18:00.985' ) ON CONFLICT DO NOTHING;

INSERT INTO public."_CollaborationParticipants" ("A", "B") VALUES ('cmvwjpgrt000ntw4nzsn8aqj3', 'cmvwjpgkx0000tw4n4civ941d' ) ON CONFLICT DO NOTHING;

INSERT INTO public."_CollaborationParticipants" ("A", "B") VALUES ('cmvwjpgrt000ntw4nzsn8aqj3', 'cmvwjpgr30003tw4nvcs2tqqc' ) ON CONFLICT DO NOTHING;

INSERT INTO public."_CollaborationParticipants" ("A", "B") VALUES ('cmvwjpgs3000stw4ni62134ha', 'cmvwjpgmx0001tw4nmyl8n205' ) ON CONFLICT DO NOTHING;

INSERT INTO public."_CollaborationParticipants" ("A", "B") VALUES ('cmvwjpgs3000stw4ni62134ha', 'cmvwjpgor0002tw4nqjdunhoy' ) ON CONFLICT DO NOTHING;

COMMIT;
