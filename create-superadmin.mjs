#!/usr/bin/env node
 // Faqat Super Admin yaratadi
// Ishga tushirish: node create-superadmin.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

var __dir = dirname(fileURLToPath(
    import.meta.url));
var envPath = join(__dir, '.env');

if (existsSync(envPath)) {
    var raw = readFileSync(envPath, 'utf8');
    var lines = raw.split('\n');
    for (var idx = 0; idx < lines.length; idx++) {
        var line = lines[idx].trim();
        if (line.length === 0) continue;
        if (line.indexOf('#') === 0) continue;
        var eqPos = line.indexOf('=');
        if (eqPos < 0) continue;
        var key = line.substring(0, eqPos).trim();
        var val = line.substring(eqPos + 1).trim();
        if (process.env[key] === undefined) {
            process.env[key] = val;
        }
    }
    console.log('.env fayl topildi: ' + envPath);
} else {
    console.log('OGOHLANTIRISH: .env fayl topilmadi: ' + envPath);
}

var SUPABASE_URL = process.env.SUPABASE_URL;
var SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
var EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@solecare.uz';
var PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Admin123456!';

console.log('');
console.log('Tekshiruv:');
console.log('  URL: ' + (SUPABASE_URL || 'YOQ'));
console.log('  KEY uzunligi: ' + (SERVICE_KEY ? SERVICE_KEY.length : 0) + ' belgi');
console.log('  KEY boshlanishi: ' + (SERVICE_KEY ? SERVICE_KEY.substring(0, 20) + '...' : 'YOQ'));
console.log('  Email: ' + EMAIL);
console.log('');

if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('XATO: .env da SUPABASE_URL va SUPABASE_SERVICE_ROLE_KEY bolishi kerak!');
    process.exit(1);
}

var supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
});

function printError(label, err) {
    console.error('');
    console.error('===== XATOLIK: ' + label + ' =====');
    if (err) {
        console.error('  message: ' + (err.message || '(yoq)'));
        console.error('  status: ' + (err.status || '(yoq)'));
        console.error('  code: ' + (err.code || '(yoq)'));
        console.error('  name: ' + (err.name || '(yoq)'));
        try {
            console.error('  full JSON: ' + JSON.stringify(err, Object.getOwnPropertyNames(err)));
        } catch (e) {
            console.error('  (JSON.stringify ishlamadi)');
        }
    } else {
        console.error('  (error obyekti yoq)');
    }
    console.error('=====================================');
    console.error('');
}

async function run() {
    // 0. Avval ulanishni sinab ko'ramiz - oddiy so'rov bilan
    console.log('Supabase ulanishi tekshirilmoqda...');
    var testResult = await supabase.from('companies').select('id').limit(1);
    if (testResult.error) {
        printError('Ulanish testi (companies jadvali)', testResult.error);
        console.error('Bu degani: yoki SERVICE_ROLE_KEY notogri, yoki migratsiyalar bajarilmagan (companies jadvali yoq).');
        process.exit(1);
    }
    console.log('  OK - bazaga ulanish ishladi, companies jadvali mavjud.');
    console.log('');

    // 1. Auth user yaratish
    console.log('Auth user yaratilmoqda...');
    var userId = null;

    var createResult = await supabase.auth.admin.createUser({
        email: EMAIL,
        password: PASSWORD,
        email_confirm: true
    });

    if (createResult.error) {
        printError('auth.admin.createUser', createResult.error);

        var errMsg = (createResult.error.message || '').toLowerCase();
        var errStatus = createResult.error.status || 0;

        if (errMsg.indexOf('already') >= 0 || errStatus === 422 || errStatus === 400) {
            console.log('User allaqachon mavjud bolishi mumkin, royxatdan qidirilmoqda...');
            var listResult = await supabase.auth.admin.listUsers({ perPage: 1000 });
            if (listResult.error) {
                printError('auth.admin.listUsers', listResult.error);
                process.exit(1);
            }
            var allUsers = (listResult.data && listResult.data.users) ? listResult.data.users : [];
            console.log('  Jami auth userlar soni: ' + allUsers.length);
            var found = null;
            for (var i = 0; i < allUsers.length; i++) {
                if (allUsers[i].email === EMAIL) {
                    found = allUsers[i];
                    break;
                }
            }
            if (!found) {
                console.error('XATO: "' + EMAIL + '" emailli user royxatda ham topilmadi.');
                console.error('Bu degani: SERVICE_ROLE_KEY notogri yoki ruxsatlar yetarli emas.');
                console.error('Supabase Dashboard -> Settings -> API Keys -> "Legacy anon, service_role API keys"');
                console.error('tabidan eski formatdagi (eyJ... bilan boshlanuvchi) service_role kalitni oling.');
                process.exit(1);
            }
            userId = found.id;
            console.log('  Mavjud user topildi: ' + userId);
        } else {
            console.error('Kutilmagan xatolik turi. Status: ' + errStatus);
            process.exit(1);
        }
    } else {
        userId = createResult.data.user.id;
        console.log('  Auth user yaratildi: ' + userId);
    }

    console.log('');
    console.log('Profil tekshirilmoqda...');
    var existingResult = await supabase.from('users').select('id').eq('id', userId).maybeSingle();
    if (existingResult.error) {
        printError('users select', existingResult.error);
        process.exit(1);
    }

    // Login email prefiksidan olinadi (masalan superadmin@solecare.uz → superadmin)
    var loginVal = EMAIL.includes('@') ? EMAIL.split('@')[0] : EMAIL;

    if (existingResult.data) {
        var updResult = await supabase.from('users').update({ role: 'super_admin', login: loginVal }).eq('id', userId);
        if (updResult.error) {
            printError('users update', updResult.error);
            process.exit(1);
        }
        console.log('  Profil mavjud edi, yangilandi (role=super_admin, login=' + loginVal + ')');
    } else {
        var insertResult = await supabase.from('users').insert({
            id: userId,
            company_id: null,
            fullname: 'Super Admin',
            phone: '+998900000000',
            role: 'super_admin',
            login: loginVal
        });
        if (insertResult.error) {
            printError('users insert', insertResult.error);
            process.exit(1);
        }
        console.log('  Profil yaratildi (login=' + loginVal + ')');
    }

    console.log('');
    console.log('===============================================');
    console.log('  SUPER ADMIN TAYYOR!');
    console.log('');
    console.log('  Login : ' + loginVal);
    console.log('  Parol : ' + PASSWORD);
    console.log('  URL   : http://localhost:5173/login');
    console.log('===============================================');
    console.log('');
}

run().catch(function(e) {
    printError('Kutilmagan istisno (catch)', e);
    process.exit(1);
});