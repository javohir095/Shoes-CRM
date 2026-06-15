# Shoe Care ERP — Frontend

Ko'p filiallik (multi-tenant) poyabzal tozalash/ta'mirlash SaaS tizimi uchun
React 19 + TypeScript + Vite frontend.

## Texnologiyalar

- React 19, TypeScript (strict), Vite
- TailwindCSS v3 + hand-built Shadcn-style UI komponentlar
- Supabase (auth, database, storage, RLS)
- React Query (TanStack Query) — data fetching/caching
- Zustand — global holat (auth)
- React Hook Form + Zod — formalar va validatsiya
- Framer Motion — animatsiyalar
- Recharts — grafiklar
- jsPDF + qrcode + jsbarcode — PDF chek, QR va shtrix kod
- jsQR — QR skanerlash (kamera orqali)

## O'rnatish

```bash
npm install
```

`.env` faylida Supabase ma'lumotlari allaqachon to'ldirilgan:

```
VITE_SUPABASE_URL=https://pkgysljbccfmvklgwgyj.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

> ⚠️ `sb_secret_...` (secret key) frontendda HECH QACHON ishlatilmasligi kerak —
> u faqat Telegram bot serveri (backend) uchun.

## Ishga tushirish

```bash
npm run dev      # development server (http://localhost:5173)
npm run build    # production build (dist/)
npm run preview  # production buildni lokal ko'rish
```

## Supabase sozlash

Loyihaning Supabase qismi (`supabase/migrations/`) alohida yetkazib berilgan.
Migratsiyalarni tartib bilan ishlatish kerak:

1. `0001_init.sql` — asosiy jadvallar, RLS, trigger'lar
2. `0002_seed.sql` — test kompaniya + foydalanuvchi yaratish bo'yicha ko'rsatma
3. `0003_reviews_and_rankings.sql` — review/rating/ranking funksiyalari

Birinchi foydalanuvchi (super_admin)ni Supabase Dashboard → Authentication
orqali yaratib, so'ng `users` jadvalida `role = 'super_admin'` va kerakli
`company_id` ni belgilang.

## Loyiha tuzilmasi

```
src/
  app/            # router, layout, providers, nav config
  pages/          # route komponentlari
  widgets/        # qayta ishlatiluvchi UI bloklari (StatCard, StatusRail...)
  features/       # domain logikasi (auth, orders, workers, payments...)
  shared/         # UI primitivlar, lib, constants, theme
  types/          # Supabase schema bilan mos TypeScript turlari
```

## Rollar

- **super_admin** — barcha filiallarni ko'radi, filiallarni boshqaradi
- **admin** — o'z filiali: buyurtmalar, xodimlar, moliya, mijozlar, sozlamalar
- **worker** — buyurtmalar, QR scanner, o'z balansi/reytingi

## Hali qilinmagan / keyingi bosqichlar

- Telegram bot (Telegraf.js, alohida Node.js servis) — mijozlar uchun
  buyurtma kuzatish, chek olish, baholash
- Push/real-time bildirishnomalar (Supabase Realtime orqali)
- Xodim/admin yaratish formasi (hozircha Supabase Dashboard orqali)
