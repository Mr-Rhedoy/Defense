// ---------- Helpers & State ----------
let animals = [];
let charts = {};
let currentLang = localStorage.getItem('lang') || 'en';
const $ = id => document.getElementById(id);
const money = n => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const today = () => localDate();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const findAnimal = id => animals.find(a => a.id.toLowerCase() === String(id).trim().toLowerCase());

// ---------- Translation Dictionary ----------
const dict = {
    en: {
        appTitle: "Smart-Agro System",
        logoSub: "Livestock Management System",
        navDashboard: "Dashboard",
        navDaily: "Daily Update",
        navAnimals: "Animals",
        navAnalyzer: "Analyzer",
        navSell: "Sell",
        navQR: "QR Access",
        navLogout: "Log Out",
        loginTitle: "Smart-Agro Login",
        labelUser: "Username:",
        labelPass: "Password:",
        btnLogin: "Log In",
        labelChooseUser: "Choose Username:",
        labelChoosePass: "Choose Password (6+ characters):",
        btnCreate: "Create Account",
        labelRecovery: "Recovery Code:",
        labelNewPass: "New Password (6+ characters):",
        btnReset: "Reset Password",
        dashHeader: "My Dashboard",
        searchPlaceholder: "Search Animal by ID...",
        btnSearch: "Search",
        cardActiveAnimals: "Total Active Animals",
        cardPendingVaccines: "Pending Vaccines",
        cardOpProfit: "Operating Profit (Milk)",
        cardOpSub: "Excludes Buying Price",
        cardFarmBalance: "Overall Farm Balance",
        cardBalanceSub: "Net Asset/Profit Value",
        cardTop: "🏆 Top Performer",
        cardWorst: "⚠️ Worst Performer",
        btnAddAnimal: "+ Add New Data",
        btnEditData: "✎ Edit Data",
        chartProfitTitle: "Operating Expense vs Income",
        chartProdTitle: "Production Trend Analytics",
        btnBack: "← Back to Dashboard",
        regHeader: "Register New Animal",
        regId: "Animal ID / Tag:",
        regBuy: "Purchase Price (BDT):",
        regBirth: "Birth Date:",
        regLastVac: "Last Vaccination Date:",
        regNextVac: "Next Vaccination Date:",
        regSubmit: "Register Animal",
        editHeader: "Edit All Animal Data",
        saveChanges: "Save Changes",
        dailyHeader: "Daily Data Update",
        dailySub: "Update daily milk production and expenses by ID (Active Animals Only).",
        tblId: "Animal ID",
        tblStatus: "Status (After 4 Logs)",
        tblAction: "Action",
        colDate: "Date",
        colMilk: "Milk (L)",
        colPrice: "Price/L",
        colExp: "Expense",
        colProfit: "Profit",
        logDateLbl: "Record Date:",
        logMilkLbl: "Milk Produced Today (Liters):",
        logPriceLbl: "Sold Price per Liter (BDT):",
        logExpLbl: "Daily Expenses (Food/Meds in BDT):",
        logSubmit: "Save Daily Log",
        cancelEdit: "Cancel edit",
        sellHeader: "Sell Animal & Final Calculation",
        sellHint: "First you will see the profit or loss. The animal is sold only after you press \"Sell Now\".",
        sellPriceLbl: "Selling Price (BDT):",
        calcBtn: "Calculate Profit / Loss",
        allAnimalsHeader: "All Animals Overview",
        downloadBtn: "📥 Download Excel/CSV",
        colState: "State",
        colLogs: "Milk Logs",
        colOpProfit: "Op. Profit (Milk)",
        colFinalProfit: "Final Life Profit",
        analyzerHeader: "Monthly Financial Analyzer",
        qrHeader: "QR Generator",
        qrGenBtn: "Generate QR",
        qrPrintBtn: "🖨️ Print QR Tag",
        settingsHeader: "System Settings & Data Management",
        settingsSub: "Welcome to the admin danger zone. Actions performed here cannot be undone.",
        deleteZoneTitle: "Delete All Farm Data",
        deleteZoneSub: "This will erase every animal and every log from the system forever.",
        deleteBtn: "🗑️ Delete ALL System Data"
    },
    bn: {
        appTitle: "স্মার্ট-এগ্রো সিস্টেম",
        logoSub: "খামার ব্যবস্থাপনা সিস্টেম",
        navDashboard: "ড্যাশবোর্ড",
        navDaily: "দৈনিক আপডেট",
        navAnimals: "পশুসমূহ",
        navAnalyzer: "বিশ্লেষণ",
        navSell: "বিক্রি",
        navQR: "কিউআর কোড",
        navLogout: "লগ আউট",
        loginTitle: "স্মার্ট-এগ্রো লগইন",
        labelUser: "ইউজারনেম:",
        labelPass: "পাসওয়ার্ড:",
        btnLogin: "লগ ইন করুন",
        labelChooseUser: "ইউজারনেম দিন:",
        labelChoosePass: "পাসওয়ার্ড দিন (কমপক্ষে ৬ অক্ষর):",
        btnCreate: "অ্যাকাউন্ট তৈরি করুন",
        labelRecovery: "রিকভারি কোড:",
        labelNewPass: "নতুন পাসওয়ার্ড:",
        btnReset: "পাসওয়ার্ড রিসেট করুন",
        dashHeader: "আমার ড্যাশবোর্ড",
        searchPlaceholder: "আইডি দিয়ে পশু খুঁজুন...",
        btnSearch: "খুঁজুন",
        cardActiveAnimals: "মোট সক্রিয় পশু",
        cardPendingVaccines: "টিকার মেয়াদ বাকি",
        cardOpProfit: "অপারেটিং লাভ (দুধ)",
        cardOpSub: "পশুর ক্রয়মূল্য বাদ দিয়ে",
        cardFarmBalance: "খামারের মোট ব্যালেন্স",
        cardBalanceSub: "নেট অ্যাসেট ও লাভ",
        cardTop: "🏆 সেরা পারফর্মার",
        cardWorst: "⚠️ সবচেয়ে পেছানো",
        btnAddAnimal: "+ নতুন পশু যোগ করুন",
        btnEditData: "✎ ডেটা সম্পাদনা",
        chartProfitTitle: "অপারেটিং খরচ বনাম আয়",
        chartProdTitle: "দুধ উৎপাদনের গ্রাফ",
        btnBack: "← ড্যাশবোর্ডে ফিরে যান",
        regHeader: "নতুন পশু নিবন্ধন",
        regId: "পশুর আইডি / ট্যাগ:",
        regBuy: "ক্রয়মূল্য (টাকা):",
        regBirth: "জন্ম তারিখ:",
        regLastVac: "শেষ টিকার তারিখ:",
        regNextVac: "পরবর্তী টিকার তারিখ:",
        regSubmit: "পশু নিবন্ধন করুন",
        editHeader: "পশুর তথ্য পরিবর্তন",
        saveChanges: "পরিবর্তন সংরক্ষণ করুন",
        dailyHeader: "দৈনিক ডেটা আপডেট",
        dailySub: "সক্রিয় পশুর দৈনিক দুধ ও খরচ আপডেট করুন।",
        tblId: "পশুর আইডি",
        tblStatus: "অবস্থা (৪ দিন পর)",
        tblAction: "কার্যক্রম",
        colDate: "তারিখ",
        colMilk: "দুধ (লিটার)",
        colPrice: "প্রতি লিটার দাম",
        colExp: "খরচ",
        colProfit: "লাভ",
        logDateLbl: "রেকর্ডের তারিখ:",
        logMilkLbl: "আজ কত লিটার দুধ হয়েছে:",
        logPriceLbl: "প্রতি লিটার বিক্রয়মূল্য (টাকা):",
        logExpLbl: "দৈনিক খরচ (খাবার/ওষুধ):",
        logSubmit: "দৈনিক লগ সেভ করুন",
        cancelEdit: "এডিট বাতিল করুন",
        sellHeader: "পশু বিক্রি ও হিসাব",
        sellHint: "আগে লাভ বা ক্ষতি দেখতে পাবেন। \"Sell Now\" চাপলেই কেবল পশু বিক্রি সম্পন্ন হবে।",
        sellPriceLbl: "বিক্রয়মূল্য (টাকা):",
        calcBtn: "লাভ / ক্ষতি হিসাব করুন",
        allAnimalsHeader: "সকল পশুর তালিকা",
        downloadBtn: "📥 এক্সেল/সিএসভি ডাউনলোড",
        colState: "অবস্থা",
        colLogs: "লগ সংখ্যা",
        colOpProfit: "অপারেটিং লাভ",
        colFinalProfit: "সর্বমোট জীবনকাল লাভ",
        analyzerHeader: "মাসিক আর্থিক বিশ্লেষণ",
        qrHeader: "কিউআর কোড জেনারেটর",
        qrGenBtn: "কিউআর তৈরি করুন",
        qrPrintBtn: "🖨️ কিউআর প্রিন্ট করুন",
        settingsHeader: "সিস্টেম সেটিংস ও ডেটা ম্যানেজমেন্ট",
        settingsSub: "সতর্কতা: এই সেকশনের কাজগুলো স্থায়ী এবং অপরিবর্তনীয়।",
        deleteZoneTitle: "সব ডেটা মুছে ফেলুন",
        deleteZoneSub: "এতে খামারের সকল পশু ও লগ চিরতরে মুছে যাবে।",
        deleteBtn: "🗑️ সব ডেটা ডিলিট করুন"
    }
};

function applyLanguage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[currentLang][key]) el.textContent = dict[currentLang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[currentLang][key]) el.placeholder = dict[currentLang][key];
    });
    $('langBtn').textContent = currentLang === 'en' ? 'বাংলা' : 'English';
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'bn' : 'en';
    localStorage.setItem('lang', currentLang);
    applyLanguage();
}

// ---------- Dark Mode Toggle ----------
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    $('themeBtn').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    window.addEventListener('DOMContentLoaded', () => { if($('themeBtn'))$('themeBtn').textContent = '☀️'; });
}

async function api(url, method = 'GET', body) {
    const token = localStorage.getItem('token');
    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && token) { logout(); throw new Error('Session expired. Please log in again.'); }
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

async function run(fn) {
    try { await fn(); } catch (e) { alert(e.message); }
}

const activeAnimals = () => animals.filter(a => a.status === 'active');
const colorClass = n => (n > 0 ? 'profit-text' : n < 0 ? 'loss-text' : 'neutral-text');

function switchView(id) {
    document.querySelectorAll('.view-section').forEach(v => v.classList.add('hidden'));
    $(id).classList.remove('hidden');
    const loggedIn = !!localStorage.getItem('token');
    if (id !== 'sell-animal-view') cancelSale();
    $('navbar').classList.toggle('hidden', !loggedIn);$('appFooter').classList.toggle('hidden', !loggedIn);
    if (loggedIn) renderAll(id);
}

async function loadAnimals() {
    animals = await api('/api/animals');
}

function renderAll(viewId) {
    renderLossBanner();
    applyLanguage();
    if (viewId === 'dashboard-view') renderDashboard();
    if (viewId === 'daily-update-view') renderDailyTable();
    if (viewId === 'animals-view') renderAnimalsTable();
    if (viewId === 'analyzer-view') renderMonthlyChart();
}

function renderLossBanner() {
    const losing = activeAnimals().filter(a => logDays(a) >= 4 && opProfit(a) < 0).map(a => a.id);
    $('lossAlertBanner').classList.toggle('hidden', losing.length === 0);$('lossAlertText').textContent = '⚠️ WARNING: These animals are operating at a LOSS (after 4+ days analysis): ' + losing.join(', ');
}

function drawChart(key, canvasId, config) {
    if (charts[key]) charts[key].destroy();
    charts[key] = new Chart($(canvasId), config);
}

// ---------- Dashboard ----------
function renderDashboard() {
    const active = activeAnimals();
    $('totalAnimals').textContent = active.length;

    const totalOpProfit = r2(animals.reduce((s, a) => s + opProfit(a), 0));
    $('totalProfit').textContent = money(totalOpProfit) + ' BDT';$('totalProfit').className = colorClass(totalOpProfit);

    const totalNetBalance = r2(animals.reduce((s, a) => {
        return s + (a.status === 'sold' ? finalProfit(a) : netSoFar(a));
    }, 0));
    if ($('farmBalance')) {
        $('farmBalance').textContent = money(totalNetBalance) + ' BDT';$('farmBalance').className = 'stat-text ' + colorClass(totalNetBalance);
    }

    const limit = new Date(); limit.setDate(limit.getDate() + 7);
    const limitStr = localDate(limit);
    const due = active.filter(a => a.nextVaccine && a.nextVaccine <= limitStr);
    $('pendingVaccines').textContent = due.length;
    const box = $('vaccineAlertBox');
    box.classList.toggle('hidden', due.length === 0);
    box.innerHTML = due.map(a =>
        `<p class="alert-red">💉 ${esc(a.id)}: vaccine ${a.nextVaccine < today() ? 'was due on' : 'due on'} ${esc(a.nextVaccine)}</p>`).join('');

    // --- Dashboard Farm Status Strip Logic ---
    if ($('farmStatusText') && $('farmStatusStrip') &&$('farmStatusPulse')) {
        if (due.length > 0) {
            $('farmStatusText').textContent = currentLang === 'bn' ? `সতর্কতা: ${due.length}টি পশুর টিকার মেয়াদ কাছাকাছি!` : `Attention: ${due.length} pending vaccine(s)!`;
            $('farmStatusStrip').style.background = 'rgba(220, 38, 38, 0.1)';$('farmStatusStrip').style.color = '#dc2626';
            $('farmStatusPulse').style.background = '#dc2626';
            $('farmStatusPulse').style.boxShadow = '0 0 8px #dc2626';
        } else if (totalNetBalance < 0) {
            $('farmStatusText').textContent = currentLang === 'bn' ? `খামার বর্তমানে লসে চলছে` : `Farm is running at a loss`;
            $('farmStatusStrip').style.background = 'rgba(217, 119, 6, 0.1)';$('farmStatusStrip').style.color = '#d97706';
            $('farmStatusPulse').style.background = '#d97706';
            $('farmStatusPulse').style.boxShadow = '0 0 8px #d97706';
        } else {
            $('farmStatusText').textContent = currentLang === 'bn' ? `খামার সম্পূর্ণ সুস্থ ও লাভজনক অবস্থায় আছে` : `All systems normal & farm is profitable`;
            $('farmStatusStrip').style.background = 'rgba(22, 163, 74, 0.1)';$('farmStatusStrip').style.color = '#16a34a';
            $('farmStatusPulse').style.background = '#16a34a';
            $('farmStatusPulse').style.boxShadow = '0 0 8px #16a34a';
        }
    }

    const ranked = active.filter(a => a.logs.length).sort((a, b) => opProfit(b) - opProfit(a));
    $('topPerformer').textContent = ranked.length ? `${ranked[0].id} (${money(opProfit(ranked[0]))} BDT)` : 'N/A';
    $('worstPerformer').textContent = ranked.length > 1 ? `${ranked[ranked.length - 1].id} (${money(opProfit(ranked[ranked.length - 1]))} BDT)` : 'N/A';

    const withLogs = animals.filter(a => a.logs.length);
    drawChart('profit', 'profitChart', {
        type: 'bar',
        data: {
            labels: withLogs.map(a => a.id + (a.status === 'sold' ? ' (sold)' : '')),
            datasets: [
                { label: 'Income', backgroundColor: '#27ae60', data: withLogs.map(totalIncome) },
                { label: 'Expense', backgroundColor: '#e74c3c', data: withLogs.map(totalExpense) }
            ]
        }
    });

    const byDate = {};
    animals.forEach(a => a.logs.forEach(l => { byDate[l.date] = r2((byDate[l.date] || 0) + num(l.milk)); }));
    const dates = Object.keys(byDate).sort();
    drawChart('production', 'productionChart', {
        type: 'line',
        data: { labels: dates, datasets: [{ label: 'Milk (Liters)', borderColor: '#2980b9', tension: 0.3, data: dates.map(d => byDate[d]) }] }
    });
}

function renderMonthlyChart() {
    const byMonth = {};
    animals.forEach(a => a.logs.forEach(l => {
        const m = l.date.slice(0, 7);
        if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0, profit: 0 };
        byMonth[m].income += logIncome(l);
        byMonth[m].expense += logExpense(l);
        byMonth[m].profit += logProfit(l);
    }));

    const months = Object.keys(byMonth).sort();
    drawChart('monthly', 'monthlyChart', {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                { label: 'Total Income', data: months.map(m => r2(byMonth[m].income)), backgroundColor: '#27ae60' },
                { label: 'Total Expense', data: months.map(m => r2(byMonth[m].expense)), backgroundColor: '#e74c3c' },
                { label: 'Net Profit', data: months.map(m => r2(byMonth[m].profit)), backgroundColor: months.map(m => r2(byMonth[m].profit) >= 0 ? '#2980b9' : '#c0392b') }
            ]
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function renderDailyTable() {
    const rows = activeAnimals().map(a => {
        let status = `Collecting data (${logDays(a)}/4)`;
        let cls = 'neutral-text';
        if (logDays(a) >= 4) {
            const p = opProfit(a);
            status = p >= 0 ? `Profit: ${money(p)}` : `Loss: ${money(p)}`;
            cls = colorClass(p);
        }
        return `<tr><td>${esc(a.id)}</td><td class="${cls}">${status}</td>
            <td><button class="update-btn" data-id="${esc(a.id)}" onclick="openLog(this.dataset.id)">Update</button></td></tr>`;
    });
    $('dailyUpdateTableBody').innerHTML = rows.join('') || '<tr><td colspan="3">No active animals yet. Add one from the dashboard.</td></tr>';
}

function renderAnimalsTable() {
    const rows = animals.map(a => {
        const p = opProfit(a), f = finalProfit(a);
        return `<tr><td>${esc(a.id)}</td><td>${a.status === 'active' ? 'Active' : 'Sold'}</td><td>${a.logs.length}</td>
            <td class="${colorClass(p)}">${money(p)}</td>
            <td class="${f === null ? '' : colorClass(f)}">${f === null ? '-' : money(f)}</td>
            <td><button class="delete-btn" data-id="${esc(a.id)}" onclick="deleteAnimal(this.dataset.id)">Delete</button></td></tr>`;
    });
    $('animalTableBody').innerHTML = rows.join('') || '<tr><td colspan="6">No animals yet.</td></tr>';
}

// ---------- Auth ----------
function showAuth(mode) {
    const titles = { login: 'Smart-Agro Login', signup: 'Create Account', forgot: 'Reset Password' };
    $('loginForm').classList.toggle('hidden', mode !== 'login');
    $('signupForm').classList.toggle('hidden', mode !== 'signup');$('forgotForm').classList.toggle('hidden', mode !== 'forgot');
    $('authTitle').textContent = titles[mode];$('authLinks').innerHTML = mode === 'login'
        ? `<a href="#" onclick="showAuth('forgot'); return false;">Forgot password?</a><a href="#" onclick="showAuth('signup'); return false;">Create account</a>`
        : `<a href="#" onclick="showAuth('login'); return false;">← Back to login</a>`;
}

function logout() {
    localStorage.removeItem('token');
    animals = [];
    $('lossAlertBanner').classList.add('hidden');
    switchView('login-view');
}

$('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    run(async () => {
        const r = await api('/api/auth/login', 'POST', { username: $('loginUser').value, password:$('loginPass').value });
        localStorage.setItem('token', r.token);
        if (r.recoveryCode) alert('Your RECOVERY CODE: ' + r.recoveryCode + '\n\nWrite it down. You need it if you forget your password.');
        $('loginForm').reset();
        await loadAnimals();
        switchView('dashboard-view');
    });
});

$('signupForm').addEventListener('submit', e => {
    e.preventDefault();
    run(async () => {
        const r = await api('/api/auth/signup', 'POST', { username: $('signupUser').value, password:$('signupPass').value });
        alert(r.message + '\n\nYour RECOVERY CODE: ' + r.recoveryCode + '\n\nWrite it down now. You need it if you forget your password.');
        $('signupForm').reset();
        showAuth('login');
    });
});

$('forgotForm').addEventListener('submit', e => {
    e.preventDefault();
    run(async () => {
        const r = await api('/api/auth/forgot', 'POST', {
            username: $('forgotUser').value, recoveryCode: $('forgotCode').value, newPassword:$('forgotPass').value
        });
        alert(r.message + '\n\nYour NEW recovery code: ' + r.recoveryCode + '\n\nWrite it down. The old code no longer works.');
        $('forgotForm').reset();
        showAuth('login');
    });
});

// ---------- Add / Edit animal ----------
$('animalForm').addEventListener('submit', e => {
    e.preventDefault();
    run(async () => {
        const r = await api('/api/animals', 'POST', {
            id: $('animalId').value.trim(), buyPrice: $('buyPrice').value, birthDate:$('birthDate').value,
            lastVaccine: $('lastVaccine').value, nextVaccine:$('nextVaccine').value
        });
        alert(r.message);
        $('animalForm').reset();
        await loadAnimals();
        switchView('dashboard-view');
    });
});

function searchToEdit() {
    const a = findAnimal($('editSearchId').value);
    if (!a) { alert('Animal not found.'); $('editFormSection').classList.add('hidden'); return; }$('editId').value = a.id;
    $('editBuyPrice').value = a.buyPrice;
    $('editBirthDate').value = a.birthDate;
    $('editLastVaccine').value = a.lastVaccine;
    $('editNextVaccine').value = a.nextVaccine;
    $('editFormSection').classList.remove('hidden');
}

$('updateProfileForm').addEventListener('submit', e => {
    e.preventDefault();
    run(async () => {
        const r = await api('/api/animals/' + encodeURIComponent($('editId').value), 'PUT', {
            buyPrice: $('editBuyPrice').value, birthDate:$('editBirthDate').value,
            lastVaccine: $('editLastVaccine').value, nextVaccine:$('editNextVaccine').value
        });
        alert(r.message);
        $('editFormSection').classList.add('hidden');$('editSearchId').value = '';
        await loadAnimals();
        switchView('dashboard-view');
    });
});

function searchAnimalOnDashboard() {
    const a = findAnimal($('dashboardSearchId').value);
    if (!a) { alert('Animal not found.'); return; }
    const f = finalProfit(a);
    alert(`ID: ${a.id}\nStatus: ${a.status}\nBought for: ${money(a.buyPrice)} BDT\nBirth date: ${a.birthDate}\nNext vaccine: ${a.nextVaccine}\nMilk logs: ${a.logs.length}\nOperating profit: ${money(opProfit(a))} BDT\nProfit after buying price so far: ${money(netSoFar(a))} BDT` +
        (f !== null ? `\nFinal life profit: ${money(f)} BDT` : ''));
}

// ---------- Daily log ----------
function openLog(id) {
    $('logAnimalId').value = id;
    cancelLogEdit();
    $('dailyLogUpdateSection').classList.remove('hidden');
    renderLogHistory();
    $('dailyLogUpdateSection').scrollIntoView({ behavior: 'smooth' });
}

function renderLogHistory() {
    const a = findAnimal($('logAnimalId').value);$('historyHeader').textContent = a ? `Records of ${a.id} (fix mistakes here)` : 'Previous Records';
    const rows = a ? [...a.logs].sort((x, y) => y.date.localeCompare(x.date)).map(l => {
        const p = logProfit(l);
        return `<tr><td>${esc(l.date)}</td><td>${l.milk}</td><td>${money(l.price)}</td><td>${money(l.expense)}</td>
            <td class="${colorClass(p)}">${money(p)}</td>
            <td><button class="update-btn" data-date="${esc(l.date)}" onclick="editLog(this.dataset.date)">Edit</button><button class="delete-btn" data-date="${esc(l.date)}" onclick="deleteLog(this.dataset.date)">Delete</button></td></tr>`;
    }) : [];
    $('logHistoryBody').innerHTML = rows.join('') || '<tr><td colspan="6">No records yet.</td></tr>';
}

function cancelLogEdit() {
    const id = $('logAnimalId').value;
    $('dailyLogForm').reset();$('logAnimalId').value = id;
    $('logEditDate').value = '';$('logDate').readOnly = false;
    $('logDate').value = today();$('updateAnimalHeader').textContent = 'Add Daily Record for ' + id;
    $('logSubmitBtn').textContent = 'Save Daily Log';$('cancelEditBtn').classList.add('hidden');
}

function editLog(date) {
    const a = findAnimal($('logAnimalId').value);
    const l = a && a.logs.find(x => x.date === date);
    if (!l) return;
    $('logEditDate').value = date;
    $('logDate').value = date;
    $('logDate').readOnly = true;
    $('logMilk').value = l.milk;
    $('logPrice').value = l.price;
    $('logExpense').value = l.expense;
    $('updateAnimalHeader').textContent = `Fix the record of ${date} for ${a.id}`;
    $('logSubmitBtn').textContent = 'Update Record';
    $('cancelEditBtn').classList.remove('hidden');$('dailyLogForm').scrollIntoView({ behavior: 'smooth' });
}

function deleteLog(date) {
    const id = $('logAnimalId').value;
    if (!confirm(`Delete the record of ${date} for ${id}?`)) return;
    run(async () => {
        await api('/api/animals/' + encodeURIComponent(id) + '/logs/' + encodeURIComponent(date), 'DELETE');
        await loadAnimals();
        if ($('logEditDate').value === date) cancelLogEdit();
        renderLogHistory(); renderDailyTable(); renderLossBanner();
    });
}

$('dailyLogForm').addEventListener('submit', e => {
    e.preventDefault();
    run(async () => {
        const id = $('logAnimalId').value;
        const editing = $('logEditDate').value;
        const body = { date: $('logDate').value, milk:$('logMilk').value, price: $('logPrice').value, expense:$('logExpense').value };
        const base = '/api/animals/' + encodeURIComponent(id) + '/logs';
        const r = editing ? await api(base + '/' + encodeURIComponent(editing), 'PUT', body) : await api(base, 'POST', body);
        if (editing || r.replaced) alert(r.message);
        cancelLogEdit();
        await loadAnimals();
        renderLogHistory(); renderDailyTable(); renderLossBanner();
    });
});

// ---------- Sell ----------
let pendingSale = null;

$('sellForm').addEventListener('submit', e => {
    e.preventDefault();
    run(async () => {
        await loadAnimals();
        const a = findAnimal($('sellAnimalId').value);
        const price = Number($('sellPrice').value);
        if (!a) throw new Error('Animal not found.');
        if (a.status === 'sold') throw new Error('This animal is already sold.');
        if (!Number.isFinite(price) || price < 0) throw new Error('Enter a valid selling price.');
        pendingSale = { id: a.id, price };
        const f = finalProfit({ ...a, status: 'sold', sellPrice: price });
        const box = $('sellResult');
        box.classList.remove('hidden');
        box.innerHTML = `<h3>Result for ${esc(a.id)} (preview only)</h3>
            <p>Buying price: ${money(a.buyPrice)} BDT</p>
            <p>Selling price: ${money(price)} BDT</p>
            <p>Total milk income: ${money(totalIncome(a))} BDT</p>
            <p>Total expenses: ${money(totalExpense(a))} BDT</p>
            <p>Operating profit (milk): ${money(opProfit(a))} BDT</p>
            <p><strong>${f > 0 ? 'FINAL PROFIT' : f < 0 ? 'FINAL LOSS' : 'BREAK-EVEN'}:</strong> <span class="${colorClass(f)}">${money(Math.abs(f))} BDT</span></p>
            <p><strong>Nothing is saved yet.</strong> ${esc(a.id)} stays active until you press "Sell Now".</p>
            <div class="sell-actions">
                <button type="button" class="btn-danger" onclick="confirmSale()">✅ Sell Now</button>
                <button type="button" class="back-btn" onclick="cancelSale()">Cancel</button>
            </div>`;
    });
});

function confirmSale() {
    if (!pendingSale) return;
    run(async () => {
        const { id, price } = pendingSale;
        await api('/api/animals/' + encodeURIComponent(id) + '/sell', 'POST', { sellPrice: price });
        pendingSale = null;
        await loadAnimals();
        const a = findAnimal(id), f = finalProfit(a);
        $('sellResult').innerHTML = `<h3>${esc(a.id)} is sold ✔</h3>
            <p>Final life profit: <span class="${colorClass(f)}">${money(f)} BDT</span></p>
            <p>The record stays in the Animals list. You can delete it there if you want.</p>`;
        $('sellForm').reset();
        renderLossBanner();
    });
}

function cancelSale() {
    pendingSale = null;
    $('sellResult').classList.add('hidden');
}

// ---------- Animals table actions ----------
function deleteAnimal(id) {
    if (!confirm(`Delete ${id} and all its logs?`)) return;
    run(async () => {
        await api('/api/animals/' + encodeURIComponent(id), 'DELETE');
        await loadAnimals();
        switchView('animals-view');
    });
}

function downloadReport() {
    const q = v => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [['ID', 'State', 'Buy Price', 'Sell Price', 'Milk Logs', 'Total Income', 'Total Expense', 'Operating Profit', 'Final Life Profit'].join(',')];
    animals.forEach(a => {
        const f = finalProfit(a);
        lines.push([q(a.id), a.status, a.buyPrice, a.sellPrice ?? '', a.logs.length, totalIncome(a), totalExpense(a), opProfit(a), f ?? ''].join(','));
    });
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'smart-agro-report.csv';
    link.click();
    URL.revokeObjectURL(link.href);
}

// ---------- QR ----------
let publicUrl = '';

function generateQR() {
    const a = findAnimal($('qrSearchId').value);
    if (!a) { alert('Animal not found.'); return; }
    if (!a.qrKey) { alert('Please refresh the page and try again.'); return; }
    const base = (publicUrl || location.origin).replace(/\/$/, '');
    const link = base + '/a/' + a.qrKey;
    $('qrcode').innerHTML = '';
    new QRCode($('qrcode'), { text: link, width: 220, height: 220 });$('qrcode').dataset.id = a.id;
    const onLocalhost = !publicUrl && /^(localhost|127\.|[::1])/.test(location.hostname);
    $('qrInfo').innerHTML = `Scan to see all details of <strong>${esc(a.id)}</strong>.<br><small>${esc(link)}</small>` +
        (onLocalhost ? `<br><span class="loss-text">Phones cannot open "localhost". Open this website with the "Phone on same Wi-Fi" address shown in the server terminal (or set PUBLIC_URL in .env), then generate the QR again.</span>` : '');
    $('qrResult').classList.remove('hidden');
}

function printQR() {
    const img = $('qrcode').querySelector('img');
    const canvas = $('qrcode').querySelector('canvas');
    const src = img && img.src ? img.src : canvas.toDataURL();
    const w = window.open('', '_blank');
    w.document.write(`<body style="text-align:center;font-family:sans-serif"><h2>${esc($('qrcode').dataset.id)}</h2><img src="${src}" onload="window.print()"></body>`);
    w.document.close();
}

// ---------- Settings ----------
function deleteAllSystemData() {
    if (!confirm('Delete ALL animals and logs forever?')) return;
    if (prompt('Type DELETE to confirm:') !== 'DELETE') return;
    run(async () => {
        await api('/api/animals', 'DELETE');
        await loadAnimals();
        alert('All data deleted.');
        switchView('dashboard-view');
    });
}

// ---------- Start ----------
(async function init() {
    fetch('/api/config').then(r => r.json()).then(c => { publicUrl = c.publicUrl || ''; }).catch(() => {});
    if (localStorage.getItem('token')) {
        try {
            await loadAnimals();
            switchView('dashboard-view');
            applyLanguage();
            return;
        } catch (e) { /* token invalid, show login */ }
    }
    showAuth('login');
    switchView('login-view');
    applyLanguage();
})();