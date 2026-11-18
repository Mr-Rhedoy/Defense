// ---------- Helpers & State ----------
let animals = [];
let charts = {};
let currentLang = localStorage.getItem('lang') || 'en';
let aiHistory = [];
let aiBusy = false;
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
        navAI: "AI Assistant",
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
        deleteBtn: "🗑️ Delete ALL System Data",
        labelIdentifier: "Username or Gmail address:",
        labelGmail: "Gmail address:",
        labelOtp: "6-digit OTP:",
        labelNewPass: "New Password (8+ characters):",
        verifyHint: "Enter the 6-digit code sent to your Gmail address.",
        btnVerify: "Verify email",
        btnResend: "Resend code",
        btnSendOtp: "Send code",
        accountEmailTitle: "Account Gmail Verification",
        accountEmailHelp: "Add and verify your Gmail address to receive farm alerts and account emails.",
        aiLauncher: "🤖 Smart-Agro AI",
        aiTitle: "Smart-Agro AI",
        aiSubtitle: "Farm assistant",
        aiWelcome: "Hello! Ask me about your farm records, milk production, costs, profit, or vaccination schedule.",
        aiPlaceholder: "Ask about your farm...",
        aiSend: "Send",
        aiDisclaimer: "AI can make mistakes. For animal illness or treatment, consult a veterinarian.",
        aiThinking: "Thinking...",
        aiLoginRequired: "Please log in as a user to use Smart-Agro AI.",

        dashboardSubline: "Here's what's happening on your farm today.",
        dashPerformanceLabel: "FARM PERFORMANCE",
        dashKeyStatistics: "Key Statistics",
        dashLiveOverview: "LIVE OVERVIEW",
        dashActiveAnimalsSub: "Active animals in your farm",
        dashVaccineSub: "Due within the next 7 days",
        dashDailyUpdate: "Daily Update",
        dashViewAnimals: "View Animals",
        dashInsightsLabel: "DATA & INSIGHTS",
        dashAnalyticsTitle: "Farm Analytics",
        dashAnimalFinanceSub: "Animal-wise financial performance",
        dashMilkTrendSub: "Daily milk production records",
        dashFarmOverview: "Farm Overview",
        dashActivitySnapshot: "Your farm activity snapshot",
        dashActiveLivestock: "Active Livestock",
        dashAnimalsWithLogs: "Animals with Milk Records",
        dashTodayMilk: "Today's Milk Production",
        dashLiters: "Liters",
        dashTodayRecords: "Today's Records",
        dashLatestRecord: "Latest Milk Record",
        dashUpcomingVaccines: "Upcoming Vaccines",
        dashNextSevenDays: "Next 7 days schedule",
        dashViewAllAnimals: "View all animals",
        dashPerformanceHighlights: "Performance Highlights",
        dashBasedOnProfit: "Based on recorded operating profit",
        dashNeedsAttention: "Needs Attention",
        dashNoUpcoming: "No upcoming vaccines",
        dashNoUpcomingSub: "No vaccine is due within the next 7 days.",
        dashNoRecords: "No records yet",
        dashNoAnimalRecords: "No animal records yet",
        dashNoMilkLogs: "Add daily milk logs to see the trend",
        dashVaccineOverdue: "OVERDUE",
        dashVaccineToday: "DUE TODAY",
        dashVaccineUpcoming: "UPCOMING",
        dashVaccineDueOn: "Vaccine due on",
        dashVaccineWasDue: "Vaccine overdue since",
        dashNoVaccineDue: "No vaccine due in the next 7 days",
        dashFarmLoss: "Farm balance currently shows a loss",
        dashAttentionVaccines: "Vaccine reminders need attention"

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
        navAI: "AI সহকারী",
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
        deleteBtn: "🗑️ সব ডেটা ডিলিট করুন",
        labelIdentifier: "ইউজারনেম অথবা Gmail ঠিকানা:",
        labelGmail: "Gmail ঠিকানা:",
        labelOtp: "৬ সংখ্যার OTP:",
        labelNewPass: "নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর):",
        verifyHint: "আপনার Gmail-এ পাঠানো ৬ সংখ্যার কোড লিখুন।",
        btnVerify: "ইমেইল যাচাই করুন",
        btnResend: "আবার কোড পাঠান",
        btnSendOtp: "কোড পাঠান",
        accountEmailTitle: "অ্যাকাউন্ট Gmail যাচাই",
        accountEmailHelp: "খামারের সতর্কবার্তা ও অ্যাকাউন্টের ইমেইল পেতে Gmail ঠিকানা যোগ করে যাচাই করুন।",
        aiLauncher: "🤖 স্মার্ট-এগ্রো AI",
        aiTitle: "স্মার্ট-এগ্রো AI",
        aiSubtitle: "আপনার খামারের সহকারী",
        aiWelcome: "হ্যালো! আপনার খামারের তথ্য, দুধ উৎপাদন, খরচ, লাভ বা টিকা দেওয়ার সময়সূচি সম্পর্কে আমাকে জিজ্ঞাসা করুন।",
        aiPlaceholder: "আপনার খামার সম্পর্কে প্রশ্ন করুন...",
        aiSend: "পাঠান",
        aiDisclaimer: "AI-এর উত্তর ভুল হতে পারে। পশুর অসুস্থতা বা চিকিৎসার জন্য পশু চিকিৎসকের পরামর্শ নিন।",
        aiThinking: "উত্তর তৈরি হচ্ছে...",
        aiLoginRequired: "Smart-Agro AI ব্যবহার করতে User হিসেবে লগইন করুন।",

        dashboardSubline: "আজ আপনার খামারের কার্যক্রমের সংক্ষিপ্ত চিত্র।",
        dashPerformanceLabel: "খামারের পারফরম্যান্স",
        dashKeyStatistics: "প্রধান পরিসংখ্যান",
        dashLiveOverview: "সরাসরি আপডেট",
        dashActiveAnimalsSub: "খামারের সক্রিয় পশু",
        dashVaccineSub: "আগামী ৭ দিনের মধ্যে নির্ধারিত",
        dashDailyUpdate: "দৈনিক আপডেট",
        dashViewAnimals: "পশু দেখুন",
        dashInsightsLabel: "তথ্য ও বিশ্লেষণ",
        dashAnalyticsTitle: "খামারের বিশ্লেষণ",
        dashAnimalFinanceSub: "পশুভিত্তিক আর্থিক পারফরম্যান্স",
        dashMilkTrendSub: "দৈনিক দুধ উৎপাদনের রেকর্ড",
        dashFarmOverview: "খামারের সারসংক্ষেপ",
        dashActivitySnapshot: "খামারের বর্তমান কার্যক্রম",
        dashActiveLivestock: "সক্রিয় পশু",
        dashAnimalsWithLogs: "দুধের রেকর্ড থাকা পশু",
        dashTodayMilk: "আজকের দুধ উৎপাদন",
        dashLiters: "লিটার",
        dashTodayRecords: "আজকের রেকর্ড",
        dashLatestRecord: "সর্বশেষ দুধের রেকর্ড",
        dashUpcomingVaccines: "আসন্ন টিকা",
        dashNextSevenDays: "আগামী ৭ দিনের সময়সূচি",
        dashViewAllAnimals: "সব পশু দেখুন",
        dashPerformanceHighlights: "পারফরম্যান্সের দিকগুলো",
        dashBasedOnProfit: "রেকর্ড করা অপারেটিং লাভের ভিত্তিতে",
        dashNeedsAttention: "বিশেষ নজর প্রয়োজন",
        dashNoUpcoming: "কোনো আসন্ন টিকা নেই",
        dashNoUpcomingSub: "আগামী ৭ দিনে কোনো টিকা নির্ধারিত নেই।",
        dashNoRecords: "এখনও কোনো রেকর্ড নেই",
        dashNoAnimalRecords: "কোনো পশুর রেকর্ড নেই",
        dashNoMilkLogs: "ট্রেন্ড দেখতে দৈনিক দুধের রেকর্ড যোগ করুন",
        dashVaccineOverdue: "সময় পেরিয়েছে",
        dashVaccineToday: "আজ টিকা দিতে হবে",
        dashVaccineUpcoming: "আসন্ন",
        dashVaccineDueOn: "টিকা দেওয়ার তারিখ",
        dashVaccineWasDue: "টিকার সময় পেরিয়েছে",
        dashNoVaccineDue: "আগামী ৭ দিনে কোনো টিকা নেই",
        dashFarmLoss: "খামারের হিসাবে বর্তমানে লোকসান দেখা যাচ্ছে",
        dashAttentionVaccines: "কিছু টিকার বিষয়ে নজর দেওয়া প্রয়োজন"

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


async function api(url, method = 'GET', body, options = {}) {
    const token = localStorage.getItem('token');

    const controller = new AbortController();

    const timeoutMs = Number(options.timeoutMs || 65000);

    const timer = setTimeout(
        () => controller.abort(),
        timeoutMs
    );

    try {
        const response = await fetch(url, {
            method,

            headers: {
                'Content-Type': 'application/json',

                ...(token
                    ? { Authorization: 'Bearer ' + token }
                    : {})
            },

            body: body
                ? JSON.stringify(body)
                : undefined,

            signal: controller.signal
        });

        const data = await response.json().catch(() => ({}));

        if (response.status === 401 && token) {
            logout();
            throw new Error('Session expired. Please log in again.');
        }

        if (!response.ok) {
            const error = new Error(
                data.message || 'Request failed.'
            );

            error.status = response.status;
            error.data = data;

            throw error;
        }

        return data;

    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error(
                'AI request timed out. Please try again.'
            );
        }

        if (error.status) throw error;

        throw new Error(
            'Could not connect to Smart-Agro server. Check your connection.'
        );

    } finally {
        clearTimeout(timer);
    }
}


async function run(fn) {
    try { await fn(); } catch (e) { alert(e.message); }
}

const activeAnimals = () => animals.filter(a => a.status === 'active');
const colorClass = n => (n > 0 ? 'profit-text' : n < 0 ? 'loss-text' : 'neutral-text');

function switchView(id) {
    const target = $(id);
    if (!target) {
        console.error('Smart-Agro view not found:', id);
        return;
    }

    document.querySelectorAll('.view-section').forEach(view => {
        view.classList.add('hidden');
    });

    target.classList.remove('hidden');

    const loggedIn = !!localStorage.getItem('token');
    
    document.body.classList.toggle('dashboard-active', id === 'dashboard-view');

    if (id !== 'sell-animal-view') cancelSale();

    $('navbar').classList.toggle('hidden', !loggedIn);
    $('appFooter').classList.toggle('hidden', !loggedIn);

    // Keep the selected item highlighted in the sidebar.
    document.querySelectorAll('#navbar .nav-links [data-view]').forEach(button => {
        const isCurrent = button.getAttribute('data-view') === id;
        button.classList.toggle('is-current', isCurrent);
        if (isCurrent) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
    });

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

// ---------- Premium Dashboard (real farm data only) ----------
function renderDashboard() {
    const active = activeAnimals();
    const currentDate = today();
    const setText = (id, value) => {
        const el = $(id);
        if (el) el.textContent = value;
    };
    const safeLogs = animal => Array.isArray(animal.logs) ? animal.logs : [];

    // Main KPI values.
    setText('totalAnimals', active.length);

    const totalOpProfit = r2(animals.reduce((sum, animal) => sum + opProfit(animal), 0));
    setText('totalProfit', money(totalOpProfit) + ' BDT');
    if ($('totalProfit')) $('totalProfit').className = colorClass(totalOpProfit);

    const totalNetBalance = r2(animals.reduce((sum, animal) => {
        return sum + (animal.status === 'sold' ? finalProfit(animal) : netSoFar(animal));
    }, 0));
    setText('farmBalance', money(totalNetBalance) + ' BDT');
    if ($('farmBalance')) $('farmBalance').className = 'stat-text ' + colorClass(totalNetBalance);

    // Upcoming vaccine schedule (today through the next seven days, including overdue items).
    const limit = new Date(currentDate + 'T00:00:00');
    limit.setDate(limit.getDate() + 7);
    const limitStr = localDate(limit);
    const due = active
        .filter(animal => animal.nextVaccine && animal.nextVaccine <= limitStr)
        .sort((a, b) => String(a.nextVaccine).localeCompare(String(b.nextVaccine)));

    setText('pendingVaccines', due.length);

    const alertBox = $('vaccineAlertBox');
    if (alertBox) {
        alertBox.classList.toggle('hidden', due.length === 0);
        alertBox.innerHTML = due.map(animal => {
            const overdue = animal.nextVaccine < currentDate;
            const prefix = currentLang === 'bn'
                ? (overdue ? dict.bn.dashVaccineWasDue : dict.bn.dashVaccineDueOn)
                : (overdue ? dict.en.dashVaccineWasDue : dict.en.dashVaccineDueOn);
            return `<p class="alert-red">💉 <strong>${esc(animal.id)}</strong>: ${prefix} ${esc(animal.nextVaccine)}</p>`;
        }).join('');
    }

    // Farm status is based only on actual vaccine and financial records.
    const statusText = $('farmStatusText');
    const statusStrip = $('farmStatusStrip');
    const statusPulse = $('farmStatusPulse');
    const activityText = $('dashboardActivityStatus');
    const activityDot = $('dashboardActivityDot');

    let farmMessage;
    let statusType = 'good';
    if (due.length > 0) {
        farmMessage = currentLang === 'bn'
            ? `${due.length}টি পশুর টিকার বিষয়ে নজর দেওয়া প্রয়োজন`
            : `${due.length} vaccine reminder(s) need attention`;
        statusType = 'warning';
    } else if (totalNetBalance < 0) {
        farmMessage = currentLang === 'bn'
            ? dict.bn.dashFarmLoss
            : dict.en.dashFarmLoss;
        statusType = 'warning';
    } else {
        farmMessage = currentLang === 'bn'
            ? 'আগামী ৭ দিনে কোনো টিকা নির্ধারিত নেই'
            : dict.en.dashNoVaccineDue;
    }

    if (statusText) statusText.textContent = farmMessage;
    if (activityText) activityText.textContent = farmMessage;
    if (statusStrip) {
        statusStrip.dataset.status = statusType;
        statusStrip.style.background = statusType === 'warning'
            ? 'rgba(217,145,47,.14)' : 'rgba(22,163,74,.13)';
        statusStrip.style.color = statusType === 'warning' ? '#efc477' : '#9be7b5';
    }
    if (statusPulse) {
        statusPulse.style.background = statusType === 'warning' ? '#e5aa4e' : '#4ade80';
        statusPulse.style.boxShadow = statusType === 'warning'
            ? '0 0 9px rgba(229,170,78,.7)' : '0 0 9px rgba(74,222,128,.7)';
    }
    if (activityDot) activityDot.className = statusType === 'warning' ? 'is-warning' : 'is-good';

    // Today's milk records and latest record.
    const allLogs = animals.flatMap(animal => safeLogs(animal).map(log => ({
        animalId: animal.id,
        date: log.date,
        milk: num(log.milk),
        price: num(log.price),
        expense: num(log.expense)
    })));
    const todayLogs = allLogs.filter(log => log.date === currentDate);
    const todayMilk = r2(todayLogs.reduce((sum, log) => sum + log.milk, 0));
    const animalsWithLogs = active.filter(animal => safeLogs(animal).length > 0);

    setText('dashboardAsideActive', active.length);
    setText('dashboardAnimalsWithLogs', animalsWithLogs.length);
    setText('dashboardTodayMilk', money(todayMilk));
    setText('dashboardTodayRecords', todayLogs.length);

    allLogs.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const latest = allLogs[0];
    if (latest) {
        const dateLabel = latest.date || '';
        setText('dashboardLatestRecord', `${latest.animalId} · ${dateLabel}`);
    } else {
        setText('dashboardLatestRecord', currentLang === 'bn' ? 'এখনও কোনো রেকর্ড নেই' : 'No records yet');
    }

    // Upcoming vaccine mini-list.
    const vaccineList = $('dashboardVaccineList');
    if (vaccineList) {
        if (!due.length) {
            vaccineList.innerHTML = `
                <div class="dashboard-empty-state">
                    <span>✓</span>
                    <strong>${esc(currentLang === 'bn' ? dict.bn.dashNoUpcoming : dict.en.dashNoUpcoming)}</strong>
                    <small>${esc(currentLang === 'bn' ? dict.bn.dashNoUpcomingSub : dict.en.dashNoUpcomingSub)}</small>
                </div>`;
        } else {
            vaccineList.innerHTML = due.slice(0, 5).map(animal => {
                const overdue = animal.nextVaccine < currentDate;
                const dueToday = animal.nextVaccine === currentDate;
                const status = overdue
                    ? (currentLang === 'bn' ? dict.bn.dashVaccineOverdue : dict.en.dashVaccineOverdue)
                    : dueToday
                        ? (currentLang === 'bn' ? dict.bn.dashVaccineToday : dict.en.dashVaccineToday)
                        : (currentLang === 'bn' ? dict.bn.dashVaccineUpcoming : dict.en.dashVaccineUpcoming);
                const statusClass = overdue || dueToday ? 'vaccine-today' : 'vaccine-upcoming';
                const dateObject = new Date(animal.nextVaccine + 'T00:00:00');
                const dateLabel = Number.isNaN(dateObject.getTime())
                    ? animal.nextVaccine
                    : dateObject.toLocaleDateString(currentLang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short' });
                return `
                    <div class="dashboard-vaccine-item">
                        <span class="vaccine-item-icon">💉</span>
                        <div class="vaccine-item-info">
                            <strong>${esc(animal.id)}</strong>
                            <small>${esc(dateLabel)}</small>
                        </div>
                        <span class="vaccine-status ${statusClass}">${esc(status)}</span>
                    </div>`;
            }).join('');
        }
    }

    // Top and lowest operating-profit performer (only animals with logs).
    const ranked = active
        .filter(animal => safeLogs(animal).length > 0)
        .sort((a, b) => opProfit(b) - opProfit(a));
    setText('topPerformer', ranked.length
        ? `${ranked[0].id} (${money(opProfit(ranked[0]))} BDT)` : 'N/A');
    setText('worstPerformer', ranked.length > 1
        ? `${ranked[ranked.length - 1].id} (${money(opProfit(ranked[ranked.length - 1]))} BDT)` : 'N/A');

    // If Chart.js or a canvas is unavailable, the rest of the dashboard still works.
    if (typeof Chart === 'undefined' || !$('profitChart') || !$('productionChart')) return;

    const withLogs = animals.filter(animal => safeLogs(animal).length > 0);
    const chartText = currentLang === 'bn';
    const isDashboardDark =
    document.documentElement.getAttribute('data-theme') === 'dark';

const gridColor = isDashboardDark
    ? 'rgba(180,210,190,.10)'
    : 'rgba(50,82,60,.14)';

const tickColor = isDashboardDark
    ? '#91aa9a'
    : '#536b5b';
    drawChart('profit', 'profitChart', {
        type: 'bar',
        data: {
            labels: withLogs.map(animal => animal.id + (animal.status === 'sold' ? ' (sold)' : '')),
            datasets: [
                { label: chartText ? 'আয়' : 'Income', backgroundColor: '#45c889', data: withLogs.map(totalIncome), borderRadius: 6, borderSkipped: false },
                { label: chartText ? 'খরচ' : 'Expense', backgroundColor: '#df8585', data: withLogs.map(totalExpense), borderRadius: 6, borderSkipped: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 850, easing: 'easeOutQuart' },
            plugins: { legend: { position: 'bottom', labels: { color: tickColor, usePointStyle: true, boxWidth: 7, padding: 15, font: { size: 10 } } } },
            scales: {
                x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 9 } } },
                y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 9 } } }
            }
        }
    });

    const byDate = {};
    animals.forEach(animal => safeLogs(animal).forEach(log => {
        if (log.date) byDate[log.date] = r2((byDate[log.date] || 0) + num(log.milk));
    }));
    const dates = Object.keys(byDate).sort();

    drawChart('production', 'productionChart', {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: chartText ? 'দুধ (লিটার)' : 'Milk (Liters)',
                data: dates.map(date => byDate[date]),
                borderColor: '#61c3d5',
                backgroundColor: 'rgba(97,195,213,.13)',
                pointBackgroundColor: '#a3e8df',
                pointBorderColor: '#61c3d5',
                pointRadius: 3,
                pointHoverRadius: 5,
                borderWidth: 2,
                tension: .38,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 950, easing: 'easeOutQuart' },
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 9 }, maxRotation: 0 } },
                y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 9 } } }
            }
        }
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

// ---------- Authentication ----------
function showAuth(mode) {
    const titles = {
        login: currentLang === 'bn' ? 'স্মার্ট-এগ্রো লগইন' : 'Smart-Agro Login',
        signup: currentLang === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি' : 'Create Account',
        verify: currentLang === 'bn' ? 'Gmail যাচাই' : 'Verify Gmail',
        forgot: currentLang === 'bn' ? 'পাসওয়ার্ড রিসেট' : 'Reset Password'
    };

    $('loginForm').classList.toggle('hidden', mode !== 'login');
    $('signupForm').classList.toggle('hidden', mode !== 'signup');
    $('verifyForm').classList.toggle('hidden', mode !== 'verify');
    $('forgotForm').classList.toggle('hidden', mode !== 'forgot');
    $('authTitle').textContent = titles[mode] || titles.login;

    if (mode === 'login') {
        $('authLinks').innerHTML = currentLang === 'bn'
            ? `<a href="#" onclick="showAuth('forgot');return false;">পাসওয়ার্ড ভুলে গেছেন?</a><a href="#" onclick="showAuth('signup');return false;">অ্যাকাউন্ট তৈরি করুন</a>`
            : `<a href="#" onclick="showAuth('forgot');return false;">Forgot password?</a><a href="#" onclick="showAuth('signup');return false;">Create account</a>`;
    } else {
        $('authLinks').innerHTML = currentLang === 'bn'
            ? `<a href="#" onclick="showAuth('login');return false;">← লগইনে ফিরে যান</a>`
            : `<a href="#" onclick="showAuth('login');return false;">← Back to login</a>`;
    }
}

function finishLogin(result) {
    localStorage.setItem('token', result.token);
    if (result.email && $('accountEmail')) $('accountEmail').value = result.email;
    aiHistory = [];
    if (result.role === 'admin') {
        window.location.href = '/admin.html';
        return;
    }
    $('loginForm').reset();
    loadAnimals().then(() => {
        $('aiLauncher').classList.remove('hidden');
        switchView('dashboard-view');
    }).catch(error => alert(error.message));
}

function logout() {
    localStorage.removeItem('token');
    animals = [];
    aiHistory = [];
    $('lossAlertBanner').classList.add('hidden');
    $('aiLauncher').classList.add('hidden');
    $('aiPanel').classList.add('hidden');
    switchView('login-view');
}

$('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    run(async () => {
        let result;
        try {
            result = await api('/api/auth/login', 'POST', {
                identifier: $('loginUser').value,
                password: $('loginPass').value,
                loginAs: $('loginRole').value
            });
        } catch (error) {
            if (error.data && error.data.needsVerification) {
                $('verifyEmail').value = error.data.email || $('loginUser').value;
                $('verifyCode').value = '';
                $('verifyMessage').textContent = error.message;
                showAuth('verify');
                return;
            }
            throw error;
        }
        finishLogin(result);
    });
});

$('signupForm').addEventListener('submit', e => {
    e.preventDefault();
    run(async () => {
        const result = await api('/api/auth/signup', 'POST', {
            username: $('signupUser').value,
            email: $('signupEmail').value,
            password: $('signupPass').value
        });
        $('verifyEmail').value = result.email;
        $('verifyCode').value = '';
        $('verifyMessage').textContent = result.message;
        $('signupForm').reset();
        showAuth('verify');
    });
});

$('verifyForm').addEventListener('submit', e => {
    e.preventDefault();
    run(async () => {
        const result = await api('/api/auth/verify-email', 'POST', {
            email: $('verifyEmail').value,
            code: $('verifyCode').value
        });
        if (result.token) finishLogin(result);
        else $('verifyMessage').textContent = result.message;
    });
});

$('resendVerificationBtn').addEventListener('click', () => {
    run(async () => {
        const result = await api('/api/auth/resend-verification', 'POST', {
            email: $('verifyEmail').value
        });
        $('verifyMessage').textContent = result.message;
    });
});

$('forgotRequestForm').addEventListener('submit', e => {
    e.preventDefault();
    run(async () => {
        const email = $('forgotEmail').value.trim();
        const result = await api('/api/auth/forgot/send-otp', 'POST', { email });
        $('forgotResetEmail').value = email;
        $('forgotRequestForm').classList.add('hidden');
        $('forgotResetForm').classList.remove('hidden');
        $('forgotMessage').textContent = result.message;
    });
});

$('forgotResetForm').addEventListener('submit', e => {
    e.preventDefault();
    run(async () => {
        const result = await api('/api/auth/forgot/reset', 'POST', {
            email: $('forgotResetEmail').value,
            code: $('forgotCode').value,
            newPassword: $('forgotPass').value
        });
        $('forgotMessage').textContent = result.message;
        $('forgotResetForm').reset();
        $('forgotResetForm').classList.add('hidden');
        $('forgotRequestForm').classList.remove('hidden');
        showAuth('login');
        alert(result.message);
    });
});

// Current account can add/change its own Gmail address and verify it.
if ($('accountEmailForm')) {
    $('accountEmailForm').addEventListener('submit', e => {
        e.preventDefault();
        run(async () => {
            const result = await api('/api/auth/email/request-verification', 'POST', {
                email: $('accountEmail').value
            });
            $('accountEmailVerifyForm').classList.remove('hidden');
            $('accountEmailMessage').textContent = result.message;
        });
    });

    $('accountEmailVerifyForm').addEventListener('submit', e => {
        e.preventDefault();
        run(async () => {
            const result = await api('/api/auth/email/verify', 'POST', {
                code: $('accountEmailOtp').value
            });
            $('accountEmailMessage').textContent = result.message;
            $('accountEmailVerifyForm').classList.add('hidden');
            $('accountEmailOtp').value = '';
        });
    });
}

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

// ---------- Smart-Agro AI Chat ----------

// ---------- Smart-Agro AI Chat ----------

function toggleAIChat() {

    if (!localStorage.getItem('token')) {
        alert(dict[currentLang].aiLoginRequired);
        return;
    }

    $('aiPanel').classList.toggle('hidden');

    if (!$('aiPanel').classList.contains('hidden')) {
        $('aiInput').focus();
    }
}


// ---------- ADD CHAT MESSAGE ----------

function addAIMessage(role, content) {

    const node = document.createElement('div');

    node.className =
        'ai-message ' +
        (role === 'user' ? 'user' : 'assistant');

    // textContent prevents HTML injection.
    node.textContent = content;

    $('aiMessages').appendChild(node);

    $('aiMessages').scrollTop =
        $('aiMessages').scrollHeight;

    return node;
}


// ---------- CLEAR CHAT ----------

function clearAIChat() {

    aiHistory = [];

    $('aiMessages').innerHTML = '';

    const welcome = document.createElement('div');

    welcome.className = 'ai-message assistant';

    welcome.textContent =
        dict[currentLang].aiWelcome;

    $('aiMessages').appendChild(welcome);
}


// ---------- AI FORM ----------

if ($('aiForm')) {

    $('aiForm').addEventListener('submit', async event => {

        event.preventDefault();

        const input = $('aiInput');

        const sendButton = $('aiSendBtn');

        const content = input.value.trim();

        if (!content || aiBusy) return;

        if (!localStorage.getItem('token')) {
            alert(dict[currentLang].aiLoginRequired);
            return;
        }

        aiBusy = true;

        sendButton.disabled = true;

        input.disabled = true;

        // Show user message.
        aiHistory.push({
            role: 'user',
            content
        });

        addAIMessage('user', content);

        input.value = '';

        // Show loading state.
        const thinking = addAIMessage(
            'assistant',
            dict[currentLang].aiThinking
        );

        thinking.classList.add('ai-thinking');

        sendButton.textContent =
            currentLang === 'bn' ? 'অপেক্ষা করুন...' : 'Waiting...';

        $('aiMessages').scrollTop =
            $('aiMessages').scrollHeight;

        try {

            const response = await api(
                '/api/ai/chat',
                'POST',
                {
                    messages: aiHistory.slice(-10),
                    language: currentLang
                },
                {
                    timeoutMs: 65000
                }
            );

            if (!response.answer) {
                throw new Error(
                    currentLang === 'bn'
                        ? 'AI কোনো উত্তর দেয়নি। আবার চেষ্টা করুন।'
                        : 'AI returned no answer. Please try again.'
                );
            }

            // Save AI answer for future conversation context.
            aiHistory.push({
                role: 'assistant',
                content: response.answer
            });

            thinking.textContent = response.answer;

            thinking.classList.remove('ai-thinking');

        } catch (error) {

            // Remove failed request from history.
            if (
                aiHistory.length &&
                aiHistory[aiHistory.length - 1].role === 'user'
            ) {
                aiHistory.pop();
            }

            // Show the real error instead of loading forever.
            thinking.textContent =
                error.message || 'Something went wrong.';

            thinking.classList.remove('ai-thinking');

            console.error('Smart-Agro AI Error:', error);

        } finally {

            aiBusy = false;

            sendButton.disabled = false;

            input.disabled = false;

            sendButton.textContent =
                dict[currentLang].aiSend;

            input.focus();

            $('aiMessages').scrollTop =
                $('aiMessages').scrollHeight;

        }

    });

}


// ---------- Start ----------
(async function init() {
    fetch('/api/config').then(r => r.json()).then(c => { publicUrl = c.publicUrl || ''; }).catch(() => {});
    if (localStorage.getItem('token')) {
        try {
            const profile = await api('/api/auth/me');
            const isMainAdminFarmView = profile.role === 'admin' && profile.isMainAdmin && new URLSearchParams(location.search).get('farm') === '1';
            if (profile.role === 'admin' && !isMainAdminFarmView) { window.location.href = '/admin.html'; return; }
            if (profile.email && $('accountEmail')) $('accountEmail').value = profile.email;
            await loadAnimals();
            if (profile.role === 'user' || profile.isMainAdmin) $('aiLauncher').classList.remove('hidden');
            switchView('dashboard-view');
            applyLanguage();
            return;
        } catch (e) {
            localStorage.removeItem('token');
        }
    }
    $('aiLauncher').classList.add('hidden');
    showAuth('login');
    switchView('login-view');
    applyLanguage();
})();