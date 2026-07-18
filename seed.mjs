#!/usr/bin/env node
/**
 * SoleCare — Database Seed
 * node seed.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))

// .env o'qish
const envPath = join(__dir, '.env')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i < 0) continue
    const k = t.slice(0, i).trim()
    const v = t.slice(i + 1).trim()
    if (!process.env[k]) process.env[k] = v
  }
  console.log('✅ .env yuklandi')
} else {
  console.error('❌ .env topilmadi:', envPath)
  process.exit(1)
}

const URL   = process.env.SUPABASE_URL
const KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY
const EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@solecare.uz'
const PASS  = process.env.SUPER_ADMIN_PASSWORD || 'Admin123456!'

console.log('URL:', URL ? '✅' : '❌ YO\'Q')
console.log('KEY:', KEY ? '✅ (uzunlik: ' + KEY.length + ')' : '❌ YO\'Q')

if (!URL || !KEY) { console.error('❌ Kalitlar yo\'q!'); process.exit(1) }

// Service role client
const db = createClient(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

// Anon client — signUp uchun
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || KEY
const anonDb  = createClient(URL, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const ok   = m => console.log(' ✅', m)
const warn = m => console.log(' ⚠️ ', m)
const sec  = t => console.log('\n' + '─'.repeat(48) + '\n ' + t + '\n' + '─'.repeat(48))

async function getOrCreateUser(email, password) {
  // 1. admin.createUser bilan urinib ko'ramiz
  try {
    const { data, error } = await db.auth.admin.createUser({
      email, password, email_confirm: true
    })
    if (!error && data?.user) { ok('Admin API orqali yaratildi: ' + email); return data.user.id }
    if (error?.message?.includes('already')) {
      // mavjud — listUsers orqali topamiz
      const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 })
      const u = list?.users?.find(x => x.email === email)
      if (u) { warn('Mavjud (admin API): ' + email); return u.id }
    }
    warn('Admin API ishlamadi (' + email + '): ' + error?.message)
  } catch (e) {
    warn('Admin API exception: ' + e.message)
  }

  // 2. signUp bilan urinib ko'ramiz
  try {
    const { data, error } = await anonDb.auth.signUp({ email, password })
    if (!error && data?.user) { ok('SignUp orqali yaratildi: ' + email); return data.user.id }
    warn('SignUp ishlamadi (' + email + '): ' + error?.message)
  } catch (e) {
    warn('SignUp exception: ' + e.message)
  }

  // 3. Mavjud userni qidirish
  try {
    const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 })
    const u = list?.users?.find(x => x.email === email)
    if (u) { warn('Mavjud topildi: ' + email); return u.id }
  } catch(e) {}

  throw new Error('User yaratib bo\'lmadi: ' + email)
}

async function upsertProfile(id, data) {
  const { data: ex } = await db.from('users').select('id').eq('id', id).maybeSingle()
  if (ex) { warn('Profil mavjud: ' + data.fullname); return }
  const { error } = await db.from('users').insert({ id, ...data })
  if (error) warn('Profil xato (' + data.fullname + '): ' + error.message)
  else ok('Profil: ' + data.fullname + ' [' + data.role + ']')
}

async function main() {
  console.log('\n🚀 Seed boshlandi...\n')

  // ── 1. Super Admin ───────────────────────────────────────────────
  // Super admin is platform-level and NOT tied to any company (company_id
  // is nullable for this role) — anchoring it to a real company risks
  // cascade-deleting the super admin's own profile if that company is
  // ever deleted from the Companies page.
  sec('1. Super Admin')
  let saId
  try {
    saId = await getOrCreateUser(EMAIL, PASS)
    await upsertProfile(saId, {
      company_id: null,
      fullname: 'Super Admin',
      phone: '+998900000000',
      role: 'super_admin'
    })
  } catch(e) {
    console.error('❌ Super Admin:', e.message)
    process.exit(1)
  }

  // ── 3. Demo kompaniya ────────────────────────────────────────────
  sec('3. Demo Kompaniya')
  let { data: co } = await db.from('companies').select('id').eq('name','CleanShoe Tashkent').maybeSingle()
  if (!co) {
    const { data, error } = await db.from('companies')
      .insert({ name:'CleanShoe Tashkent', phone:'+998712345678', monthly_fee:500000 })
      .select().single()
    if (error) { console.error('❌ Kompaniya:', error.message); process.exit(1) }
    co = data; ok('Demo kompaniya yaratildi')
  } else warn('Demo kompaniya mavjud')
  const coId = co.id

  // ── 4. Filiallar ─────────────────────────────────────────────────
  sec('4. Filiallar')
  const bIds = {}
  for (const b of [
    { name:'Chilonzor filiali', address:'Toshkent, Chilonzor', phone:'+998712340001' },
    { name:'Yunusobod filiali', address:'Toshkent, Yunusobod', phone:'+998712340002' },
  ]) {
    let { data: br } = await db.from('branches').select('id').eq('company_id',coId).eq('name',b.name).maybeSingle()
    if (!br) {
      const { data, error } = await db.from('branches').insert({...b, company_id:coId}).select().single()
      if (error) { warn('Filial xato: '+error.message); continue }
      br = data; ok('Filial: '+b.name)
    } else warn('Filial mavjud: '+b.name)
    bIds[b.name] = br.id
  }
  const b1 = bIds['Chilonzor filiali']
  const b2 = bIds['Yunusobod filiali']

  // ── 5. Xodimlar ──────────────────────────────────────────────────
  sec('5. Xodimlar')
  const workers = [
    { email:'director@solecare.uz', pass:'Director123!', fullname:'Jasur Toshmatov',  phone:'+998901111111', role:'director', br:null },
    { email:'admin1@solecare.uz',   pass:'Admin1234!',   fullname:'Malika Yusupova',  phone:'+998902222222', role:'admin',    br:b1 },
    { email:'admin2@solecare.uz',   pass:'Admin1234!',   fullname:'Sanjar Nazarov',   phone:'+998903333333', role:'admin',    br:b2 },
    { email:'worker1@solecare.uz',  pass:'Worker123!',   fullname:'Bobur Karimov',    phone:'+998904444444', role:'worker',   br:b1 },
    { email:'worker2@solecare.uz',  pass:'Worker123!',   fullname:'Dilnoza Rahimova', phone:'+998905555555', role:'worker',   br:b1 },
    { email:'worker3@solecare.uz',  pass:'Worker123!',   fullname:'Ulugbek Sobirov',  phone:'+998906666666', role:'worker',   br:b2 },
  ]
  const uIds = {}
  for (const w of workers) {
    try {
      const uid = await getOrCreateUser(w.email, w.pass)
      uIds[w.email] = uid
      await upsertProfile(uid, { company_id:coId, branch_id:w.br, fullname:w.fullname, phone:w.phone, role:w.role })
    } catch(e) { warn(e.message) }
  }

  // ── 6. Obunalar ──────────────────────────────────────────────────
  sec('6. Obunalar')
  const now = new Date()
  const tm  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10)
  const lm  = new Date(now.getFullYear(), now.getMonth()-1, 1).toISOString().slice(0,10)
  const nm  = new Date(now.getFullYear(), now.getMonth()+1, 1).toISOString().slice(0,10)
  const { count: sc } = await db.from('company_subscriptions').select('*',{count:'exact',head:true}).eq('company_id',coId)
  if (!sc) {
    for (const s of [
      { company_id:coId, period_start:lm, period_end:tm, amount:500000, status:'paid', paid_at:new Date(now.getFullYear(),now.getMonth(),5).toISOString() },
      { company_id:coId, period_start:tm, period_end:nm, amount:500000, status:'pending' },
    ]) {
      const { error } = await db.from('company_subscriptions').insert(s)
      if (error) warn('Obuna: '+error.message); else ok('Obuna ('+s.status+')')
    }
  } else warn('Obunalar mavjud')

  // ── 7. Buyurtmalar ───────────────────────────────────────────────
  sec('7. Buyurtmalar')
  const { count: oc } = await db.from('orders').select('*',{count:'exact',head:true}).eq('company_id',coId)
  if (!oc) {
    const w1 = uIds['worker1@solecare.uz']
    const w2 = uIds['worker2@solecare.uz']
    if (!w1) { warn('Worker topilmadi'); }
    else {
      const statuses = ['qabul_qilindi','diagnostika','tozalanmoqda',"ta'mirlanmoqda",'tayyor','topshirildi']
      const custs    = [{name:'Alisher Umarov',phone:'+998901234567'},{name:'Nodira Hasanova',phone:'+998902345678'},{name:'Timur Bekmurodov',phone:'+998903456789'},{name:'Zulfiya Mirzayeva',phone:'+998904567890'}]
      const svcs     = ['Chuqur tozalash',"Ta'mirlash",'Yuzaki tozalash','Rang berish']
      const shoes    = ['Krossovka','Botinka','Tufli','Sandal']
      const rows = Array.from({length:16},(_,i)=>({
        company_id:coId, branch_id:i<10?b1:b2,
        customer_name:custs[i%4].name, customer_phone:custs[i%4].phone,
        shoe_type:shoes[i%4], service_type:svcs[i%4],
        price:(Math.floor(Math.random()*8)+2)*25000,
        status:statuses[i%6],
        created_by:i%2===0?w1:(w2||w1),
        created_at:new Date(Date.now()-(16-i)*86400000).toISOString()
      }))
      const { error } = await db.from('orders').insert(rows)
      if (error) warn('Buyurtmalar: '+error.message); else ok(rows.length+' ta buyurtma qo\'shildi')
    }
  } else warn(oc+' ta buyurtma mavjud')

  // ── 8. Maoshlar ──────────────────────────────────────────────────
  sec('8. Maoshlar')
  const pm = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10)
  for (const email of ['worker1@solecare.uz','worker2@solecare.uz','worker3@solecare.uz']) {
    const wid = uIds[email]
    if (!wid) continue
    const { data: ex } = await db.from('employee_salaries').select('id').eq('employee_id',wid).eq('period_month',pm).maybeSingle()
    if (!ex) {
      const { error } = await db.from('employee_salaries').insert({
        employee_id:wid, company_id:coId,
        salary_amount:2000000, paid_amount:1000000, period_month:pm
      })
      if (error) warn('Maosh ('+email+'): '+error.message); else ok('Maosh: '+email)
    } else warn('Maosh mavjud: '+email)
  }

  // ── DONE ─────────────────────────────────────────────────────────
  console.log(`
${'═'.repeat(48)}
 ✅ SEED MUVAFFAQIYATLI YAKUNLANDI!
${'═'.repeat(48)}

 LOGIN MA'LUMOTLARI:
 Super Admin : ${EMAIL} / ${PASS}
 Direktor    : director@solecare.uz / Director123!
 Admin 1     : admin1@solecare.uz   / Admin1234!
 Admin 2     : admin2@solecare.uz   / Admin1234!
 Ishchi 1    : worker1@solecare.uz  / Worker123!
 Ishchi 2    : worker2@solecare.uz  / Worker123!
 Ishchi 3    : worker3@solecare.uz  / Worker123!
${'═'.repeat(48)}

 Ishga tushirish: npm run dev
`)
}

main().catch(e => { console.error('\n❌', e.message); process.exit(1) })
