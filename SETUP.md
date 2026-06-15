# Shoe Cleaning & Restoration ERP/POS — Supabase Setup

Bu 1-bosqich: **Supabase database** (jadvallar, RLS, RBAC, trigger funksiyalar).
Frontend (React 19 + TS + Vite + Telegram bot) keyingi bosqichlarda quriladi.

## 1. Yangi Supabase loyiha yaratish

1. https://supabase.com/dashboard → **New Project**
2. Region: tanlovga ko'ra (масalan Frankfurt yoki Singapore)
3. Database password'ni saqlab qo'ying

## 2. Migration'larni ishga tushirish

Supabase Dashboard → **SQL Editor** → **New query**:

1. `supabase/migrations/0001_init.sql` faylining **butun tarkibini** nusxalab,
   SQL Editor'ga joylang va **Run** bosing.
2. (Ixtiyoriy, test uchun) `supabase/migrations/0002_seed.sql` ni xuddi shunday ishga tushiring.
3. `supabase/migrations/0003_reviews_and_rankings.sql` ni xuddi shunday ishga tushiring —
   bu mijoz baholash (reviews), ishchi reytingi va "Mijozlar Qoniqishi" widget
   uchun kerakli jadval/view'larni qo'shadi.

> Migration'lar **ketma-ket** (0001 → 0002 → 0003) ishga tushirilishi kerak,
> chunki har biri avvalgisiga bog'liq.

> Eslatma: agar Supabase CLI ishlatsangiz —
> `supabase db push` orqali ham qo'llash mumkin.

## 3. Birinchi foydalanuvchini (Super Admin) yaratish

1. Dashboard → **Authentication → Users → Add user**
   - Email va parol kiriting (masalan `admin@cleanshoe.uz`)
2. SQL Editor'da:

```sql
update public.users
set role = 'super_admin', company_id = null, full_name = 'Super Admin'
where id = '<YANGI_USER_UUID>';
```

`<YANGI_USER_UUID>` — Authentication bo'limidagi foydalanuvchi ID'si.

## 4. Menga kerak bo'ladigan ma'lumotlar

Frontendni ulash uchun quyidagilarni yuboring:

| Ma'lumot | Qayerdan olish mumkin |
|---|---|
| **Project URL** | Project Settings → API → Project URL (`https://xxxx.supabase.co`) |
| **Anon (public) key** | Project Settings → API → `anon` `public` key |

> ⚠️ **Service Role Key**'ni frontendga HECH QACHON qo'shmang.
> U faqat Telegram bot server (backend) uchun kerak bo'ladi —
> bot bosqichiga yetganimizda alohida so'rayman.

## 5. Jadvallar tuzilishi (qisqacha)

- `companies` — filiallar (tenant)
- `users` — foydalanuvchilar profili (super_admin / admin / worker), `auth.users` bilan bog'langan
- `orders` — buyurtmalar (avtomatik `SH-YYYYMMDD-XXXX` raqam, status, narx, worker_earning)
- `order_images` — buyurtma rasm(lar)i
- `status_history` — status o'zgarish tarixi (avtomatik log)
- `payments` — mijoz to'lovlari
- `worker_balances` — ishchi balanslari (avtomatik hisoblanadi)
- `salary_payments` — oylik to'lovlar (ishchi tasdiqlashi bilan)
- `notifications` — tizim/bot xabarnomalari
- `telegram_users` — Telegram bot mijozlari

## 6. Avtomatik ishlaydigan mantiq (trigger'lar)

- Buyurtma yaratilganda → `order_number` avtomatik generatsiya qilinadi
- Status o'zgarganda → `status_history`'ga avtomatik yoziladi
- Status = `tugallangan` bo'lganda → ishchi foizi bo'yicha `worker_earning` hisoblanadi va `worker_balances`'ga qo'shiladi
- Oylik to'lov `confirmed` bo'lganda → `worker_balances.current_balance` kamayadi

## 7. Keyingi bosqich

URL va anon key'ni yuborganingizdan keyin men:
1. React 19 + TS + Vite loyiha skeletonini quraman
2. Auth, role-based routing (Super Admin / Admin / Worker)
3. Buyurtma CRUD + QR/Barcode + chek (PDF)
4. Dashboard, statistika, reyting
5. Telegram bot (alohida bosqich, service role key kerak bo'ladi)

bosqichlarini ketma-ket qo'shib boraman.
