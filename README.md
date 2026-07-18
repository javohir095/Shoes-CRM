# SoleCare — Oyoq kiyim ta'mirlash boshqaruv tizimi

## ⚡ Tez ishga tushirish

### 1. O'rnatish
```bash
npm install
```

### 2. .env fayl yarating
```bash
cp .env.example .env
```

`.env` faylini oching va Supabase kalitlarini kiriting:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```
> Kalitlar: **Supabase Dashboard → Settings → API**

### 3. Supabase sozlash

**a) SQL Migratsiyalar** — Supabase Dashboard → SQL Editor ga o'ting va bu fayllarni *tartib bilan* ishga tushiring:
```
supabase/migrations/0001_initial_schema.sql
supabase/migrations/0002_rls_policies.sql
supabase/migrations/0003_storage_and_views.sql
supabase/migrations/0004_roles_branches_subscriptions_salaries.sql
```

**b) Storage** — Supabase Dashboard → Storage → New bucket:
- Name: `order-images`  
- Public: ✅ yoqiq

**c) Realtime** — Supabase Dashboard → Database → Replication → `orders` jadvali yoqiq

### 4. Seed (ma'lumotlar yuklash)
`.env` ga qo'shing:
```
SUPABASE_SERVICE_ROLE_KEY=eyJ...  ← service_role secret
SUPER_ADMIN_EMAIL=superadmin@solecare.uz
SUPER_ADMIN_PASSWORD=Admin123456!
```

Keyin ishga tushiring:
```bash
node seed.mjs
```

### 5. Ishga tushirish
```bash
npm run dev
# → http://localhost:5173
```

---

## Login ma'lumotlari (seed dan keyin)

| Rol | Email | Parol |
|-----|-------|-------|
| Super Admin | superadmin@solecare.uz | Admin123456! |
| Direktor | director@solecare.uz | Director123! |
| Admin 1 | admin1@solecare.uz | Admin1234! |
| Admin 2 | admin2@solecare.uz | Admin1234! |
| Ishchi 1 | worker1@solecare.uz | Worker123! |
| Ishchi 2 | worker2@solecare.uz | Worker123! |
| Ishchi 3 | worker3@solecare.uz | Worker123! |

---

## Telegram Bot

```bash
cd bot
cp .env.example .env
# .env ni to'ldiring

npm install
npm start           # asosiy bot
npm run notify-worker  # bildirishnoma worker (alohida terminal)
```

---

## Rollar

| Rol | Sahifalar |
|-----|-----------|
| **Super Admin** | Kompaniyalar, Obunalar, Barcha xodimlar |
| **Director** | Filiallar, Maosh, Statistika, Telegram Bot |
| **Admin** | Buyurtmalar, Xodimlar, Statistika |
| **Worker** | Faqat o'z buyurtmalari |

---

## Muammo? Blank page ko'rinsa

1. `.env` faylida `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` to'g'ri ekanini tekshiring
2. Terminalni qarang — xatolik ko'rsatilgan bo'ladi
3. `npm run dev` ni qayta ishga tushiring
