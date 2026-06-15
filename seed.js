/**
 * Shoe Care ERP - Seed Script
 * ---------------------------
 * Bu skript quyidagilarni yaratadi:
 *  - 1 ta test kompaniya (filial)
 *  - 1 super_admin, 1 admin, 3 worker (Supabase Auth + users jadvali)
 *    Login-asoslangan: har bir foydalanuvchi "login" bilan kiradi,
 *    orqa fonda "login@shoecare.local" sifatida saqlanadi.
 *  - Bir nechta test buyurtma (turli statuslarda)
 *
 * ISHGA TUSHIRISH:
 *   1) Shu papkada: npm install @supabase/supabase-js
 *   2) node seed.js
 *
 * ESLATMA: SUPABASE_SECRET_KEY faqat shu skript uchun ishlatiladi.
 * Hech qachon frontendga yoki public repo'ga qo'shmang!
 *
 * MUHIM: Bu skriptni ishlatishdan oldin 0004_login_auth.sql
 * migratsiyasini ham Supabase SQL Editor orqali ishga tushiring
 * (users jadvaliga `login` ustuni qo'shadi).
 */

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = "https://pkgysljbccfmvklgwgyj.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const LOGIN_DOMAIN = "shoecare.local";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------
// Test foydalanuvchilar
// ---------------------------------------------------------------------
const COMPANY = {
    name: "Shoe Care - Chilonzor",
    legal_name: '"Shoe Care Tashkent" MChJ',
    phone: "+998901234567",
    address: "Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko'chasi 12",
    receipt_footer_text: "Xizmatimizdan foydalanganingiz uchun rahmat!",
};

const USERS = [{
        login: "superadmin",
        password: "Super2026!",
        full_name: "Javohir Jo'rayev",
        phone: "+998901111111",
        role: "super_admin",
        percentage: 0,
    },
    {
        login: "admin",
        password: "Admin2026!",
        full_name: "Aziz Karimov",
        phone: "+998902222222",
        role: "admin",
        percentage: 0,
    },
    {
        login: "sardor",
        password: "Ishchi2026!",
        full_name: "Sardor Tojiyev",
        phone: "+998903333333",
        role: "worker",
        percentage: 30,
    },
    {
        login: "bekzod",
        password: "Ishchi2026!",
        full_name: "Bekzod Yusupov",
        phone: "+998904444444",
        role: "worker",
        percentage: 35,
    },
    {
        login: "davron",
        password: "Ishchi2026!",
        full_name: "Davron Rashidov",
        phone: "+998905555555",
        role: "worker",
        percentage: 25,
    },
];

function loginToEmail(login) {
    return `${login.toLowerCase()}@${LOGIN_DOMAIN}`;
}

// Test buyurtmalar: turli statuslarda, ishchilarga taqsimlangan
function buildOrders(companyId, workers) {
    const [sardor, bekzod, davron] = workers;
    const now = new Date();
    const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

    return [{
            company_id: companyId,
            worker_id: sardor.id,
            customer_name: "Aliyev Vali",
            customer_phone: "+998991234567",
            shoe_type: "Krossovka",
            brand: "Nike Air Max",
            color: "Oq",
            service_type: "tozalash",
            price: 80000,
            status: "qabul_qilindi",
            created_at: daysAgo(0),
            comment: "Ko'p iflos, ehtiyot bo'lib tozalash kerak",
        },
        {
            company_id: companyId,
            worker_id: bekzod.id,
            customer_name: "Hasanova Madina",
            customer_phone: "+998992345678",
            shoe_type: "Botilka",
            brand: "Timberland",
            color: "Jigarrang",
            service_type: "tamirlash",
            price: 150000,
            status: "diagnostika",
            created_at: daysAgo(0),
        },
        {
            company_id: companyId,
            worker_id: sardor.id,
            customer_name: "Yusupov Jasur",
            customer_phone: "+998993456789",
            shoe_type: "Krossovka",
            brand: "Adidas Yeezy",
            color: "Kul rang",
            service_type: "tozalash_va_tamirlash",
            price: 200000,
            status: "tozalanmoqda",
            created_at: daysAgo(1),
        },
        {
            company_id: companyId,
            worker_id: davron.id,
            customer_name: "Rahimova Dilnoza",
            customer_phone: "+998994567890",
            shoe_type: "Tufli",
            brand: "Gucci",
            color: "Qora",
            service_type: "tamirlash",
            price: 250000,
            status: "tamirlanmoqda",
            created_at: daysAgo(1),
            comment: "Taqasi tushib qolgan, almashtirish kerak",
        },
        {
            company_id: companyId,
            worker_id: bekzod.id,
            customer_name: "Tursunov Otabek",
            customer_phone: "+998995678901",
            shoe_type: "Krossovka",
            brand: "New Balance",
            color: "Yashil",
            service_type: "tozalash",
            price: 70000,
            status: "tayyor",
            created_at: daysAgo(2),
            estimated_ready_at: daysAgo(0),
        },
        {
            company_id: companyId,
            worker_id: sardor.id,
            customer_name: "Karimova Nilufar",
            customer_phone: "+998996789012",
            shoe_type: "Botilka",
            brand: "UGG",
            color: "Bej",
            service_type: "bo_yash",
            price: 120000,
            status: "topshirildi",
            created_at: daysAgo(3),
        },
        {
            company_id: companyId,
            worker_id: davron.id,
            customer_name: "Ismoilov Bobur",
            customer_phone: "+998997890123",
            shoe_type: "Krossovka",
            brand: "Puma",
            color: "Qizil",
            service_type: "tozalash",
            price: 60000,
            status: "tugallangan",
            created_at: daysAgo(5),
            payment_method: "naqd",
            paid_at: daysAgo(4),
        },
        {
            company_id: companyId,
            worker_id: bekzod.id,
            customer_name: "Saidova Madina",
            customer_phone: "+998998901234",
            shoe_type: "Tufli",
            brand: "Zara",
            color: "Oq",
            service_type: "tamirlash",
            price: 90000,
            status: "tugallangan",
            created_at: daysAgo(6),
            payment_method: "click",
            paid_at: daysAgo(5),
        },
        {
            company_id: companyId,
            worker_id: sardor.id,
            customer_name: "Nazarov Sherzod",
            customer_phone: "+998999012345",
            shoe_type: "Krossovka",
            brand: "Reebok",
            color: "Ko'k",
            service_type: "tozalash",
            price: 75000,
            status: "bekor_qilindi",
            created_at: daysAgo(7),
        },
    ];
}

async function main() {
    console.log("1) Kompaniya yaratilmoqda...");
    let { data: company, error: companyError } = await supabase
        .from("companies")
        .insert(COMPANY)
        .select()
        .single();

    if (companyError) {
        if (companyError.code === "23505") {
            console.log("   Kompaniya allaqachon mavjud, mavjudini olamiz...");
            const { data: existing } = await supabase
                .from("companies")
                .select("*")
                .eq("name", COMPANY.name)
                .single();
            company = existing;
        } else {
            throw companyError;
        }
    }
    console.log(`   ✓ Kompaniya: ${company.name} (${company.id})`);

    console.log("\n2) Foydalanuvchilar yaratilmoqda...");
    const createdUsers = [];

    for (const u of USERS) {
        const email = loginToEmail(u.login);

        // 1. Auth user yaratish
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password: u.password,
            email_confirm: true,
        });

        let userId;
        if (authError) {
            if (authError.message.includes("already been registered") || authError.code === "email_exists") {
                console.log(`   - ${u.login} allaqachon mavjud, ID olinmoqda...`);
                const { data: list } = await supabase.auth.admin.listUsers();
                const found = list.users.find((x) => x.email === email);
                if (!found) throw new Error(`${email} topilmadi`);
                userId = found.id;
            } else {
                throw authError;
            }
        } else {
            userId = authData.user.id;
            console.log(`   ✓ Auth user yaratildi: ${u.login}`);
        }

        // 2. users jadvalida profil yozish/yangilash (login ustuni bilan)
        const isSuperAdmin = u.role === "super_admin";
        const { error: profileError } = await supabase
            .from("users")
            .upsert({
                id: userId,
                company_id: isSuperAdmin ? null : company.id,
                full_name: u.full_name,
                phone: u.phone,
                role: u.role,
                login: u.login,
                percentage: u.percentage,
                is_active: true,
            }, { onConflict: "id" });

        if (profileError) throw profileError;
        console.log(`   ✓ Profil tayyor: ${u.full_name} (${u.role}) - login: ${u.login}`);

        createdUsers.push({...u, id: userId });
    }

    console.log("\n3) Test buyurtmalar yaratilmoqda...");
    const workers = createdUsers.filter((u) => u.role === "worker");
    const orders = buildOrders(company.id, workers);

    const { data: insertedOrders, error: ordersError } = await supabase
        .from("orders")
        .insert(orders)
        .select("order_number, status, customer_name");

    if (ordersError) throw ordersError;
    console.log(`   ✓ ${insertedOrders.length} ta buyurtma yaratildi:`);
    for (const o of insertedOrders) {
        console.log(`     - ${o.order_number} | ${o.status} | ${o.customer_name}`);
    }

    console.log("\n4) Worker balanslarini tekshirish...");
    const { data: balances } = await supabase
        .from("worker_balances")
        .select("*")
        .eq("company_id", company.id);
    console.log(`   ✓ ${balances?.length ?? 0} ta worker_balance yozuvi mavjud`);

    console.log("\n========================================");
    console.log("✅ TAYYOR! Login ma'lumotlari:");
    console.log("========================================");
    for (const u of USERS) {
        console.log(`${u.role.toUpperCase().padEnd(12)} | login: ${u.login.padEnd(15)} | parol: ${u.password}`);
    }
    console.log("========================================");
}

main().catch((err) => {
    console.error("\n❌ XATOLIK:", err.message || err);
    process.exit(1);
});