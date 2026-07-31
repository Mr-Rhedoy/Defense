// script.js - Final Core Logic with Delete Capabilities

let farmData = JSON.parse(localStorage.getItem('smartAgroData')) || [];

function saveData() {
    localStorage.setItem('smartAgroData', JSON.stringify(farmData));
}

// Custom Helper: Calculate Finance per animal
function getAnimalFinance(animal) {
    let rev = 0, exp = 0, milk = 0;
    animal.logs.forEach(l => { rev += l.income; exp += l.expense; milk += l.milkLiters; });
    
    let operatingProfit = rev - exp;
    
    let finalProfit = 0;
    if (animal.status === 'Sold') {
        finalProfit = (animal.sellPrice + rev) - (animal.buyPrice + exp);
    }

    let hasEnoughLogs = animal.logs.length >= 4;

    return { rev, exp, milk, operatingProfit, finalProfit, hasEnoughLogs };
}

// View Controller
function switchView(viewId) {
    document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.add('hidden');
        sec.classList.remove('active');
    });
    document.getElementById(viewId).classList.remove('hidden');
    document.getElementById(viewId).classList.add('active');
    
    if(viewId === 'dashboard-view') updateDashboard();
    if(viewId === 'animals-view') renderAnimalsTable();
    if(viewId === 'analyzer-view') renderMonthlyAnalyzer();
    if(viewId === 'daily-update-view') renderDailyUpdateList();
}

// Authentication
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    document.getElementById('navbar').classList.remove('hidden');
    document.getElementById('appFooter').classList.remove('hidden');
    switchView('dashboard-view');
});

function logout() {
    document.getElementById('navbar').classList.add('hidden');
    document.getElementById('lossAlertBanner').classList.add('hidden');
    document.getElementById('appFooter').classList.add('hidden');
    document.getElementById('loginForm').reset();
    switchView('login-view');
}

// Charts Initialization
const profitCtx = document.getElementById('profitChart').getContext('2d');
let financialChart = new Chart(profitCtx, {
    type: 'bar',
    data: {
        labels: ['Operating Expense', 'Milk Revenue'],
        datasets: [{
            label: 'Ongoing Operations (BDT)',
            data: [0, 0], 
            backgroundColor: ['#e74c3c', '#27ae60']
        }]
    }
});

const productionCtx = document.getElementById('productionChart').getContext('2d');
let productionChart = new Chart(productionCtx, {
    type: 'line',
    data: {
        labels: [], 
        datasets: [{
            label: 'Daily Milk Production (L)',
            data: [],
            borderColor: '#2980b9', backgroundColor: 'rgba(41, 128, 185, 0.2)', fill: true, tension: 0.3
        }]
    }
});
let monthlyChartInstance = null;

// 1. Add New Animal
document.getElementById('animalForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const newAnimal = {
        id: document.getElementById('animalId').value.trim().toUpperCase(),
        buyPrice: parseFloat(document.getElementById('buyPrice').value),
        birthDate: document.getElementById('birthDate').value,
        lastVaccine: document.getElementById('lastVaccine').value,
        nextVaccine: document.getElementById('nextVaccine').value,
        status: 'Active',
        sellPrice: 0,
        logs: [] 
    };
    
    if(farmData.find(a => a.id === newAnimal.id)) {
        alert("This Animal ID already exists!");
        return;
    }

    farmData.push(newAnimal);
    saveData();
    alert('Animal Registered Successfully!');
    this.reset();
    switchView('dashboard-view');
});

// 2. Edit ALL Data
function searchToEdit() {
    const searchId = document.getElementById('editSearchId').value.trim().toUpperCase();
    const animal = farmData.find(a => a.id === searchId);
    if (animal) {
        document.getElementById('editFormSection').classList.remove('hidden');
        document.getElementById('editId').value = animal.id;
        document.getElementById('editBuyPrice').value = animal.buyPrice;
        document.getElementById('editBirthDate').value = animal.birthDate;
        document.getElementById('editLastVaccine').value = animal.lastVaccine;
        document.getElementById('editNextVaccine').value = animal.nextVaccine;
    } else {
        alert("Animal not found!");
        document.getElementById('editFormSection').classList.add('hidden');
    }
}

function saveProfileUpdate() {
    const editId = document.getElementById('editId').value;
    const animal = farmData.find(a => a.id === editId);
    if(animal) {
        animal.buyPrice = parseFloat(document.getElementById('editBuyPrice').value);
        animal.birthDate = document.getElementById('editBirthDate').value;
        animal.lastVaccine = document.getElementById('editLastVaccine').value;
        animal.nextVaccine = document.getElementById('editNextVaccine').value;
        saveData();
        alert("All Details Updated Successfully!");
        switchView('dashboard-view');
    }
}

// 3. Sell Animal Logic
document.getElementById('sellForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const sellId = document.getElementById('sellAnimalId').value.trim().toUpperCase();
    const sellPrice = parseFloat(document.getElementById('sellPrice').value);
    const animal = farmData.find(a => a.id === sellId);

    const resultBox = document.getElementById('sellResult');
    
    if (!animal) {
        alert("Animal ID not found.");
        return;
    }
    if (animal.status === 'Sold') {
        alert("This animal is already sold!");
        return;
    }

    animal.status = 'Sold';
    animal.sellPrice = sellPrice;
    saveData();

    const stats = getAnimalFinance(animal);
    
    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `
        <h3 style="color: black;">Sale Confirmation: ${animal.id}</h3>
        <p style="color: black;">Buying Price: ${animal.buyPrice} BDT</p>
        <p style="color: black;">Total Expenses: ${stats.exp} BDT</p>
        <p style="color: black;">Total Milk Revenue: ${stats.rev} BDT</p>
        <p style="color: black;">Selling Price: ${animal.sellPrice} BDT</p>
        <hr>
        <h3 class="${stats.finalProfit >= 0 ? 'profit-text' : 'loss-text'}">Final Life-time Result: ${stats.finalProfit} BDT</h3>
    `;
    this.reset();
});

// 4. Daily Update View 
function renderDailyUpdateList() {
    const tbody = document.getElementById('dailyUpdateTableBody');
    tbody.innerHTML = "";
    document.getElementById('dailyLogUpdateSection').classList.add('hidden');

    const activeAnimals = farmData.filter(a => a.status === 'Active');

    activeAnimals.forEach(animal => {
        const stats = getAnimalFinance(animal);
        let statusHTML = `<span class="neutral-text">Need 4 Logs (Has ${animal.logs.length})</span>`;
        
        if(stats.hasEnoughLogs) {
            statusHTML = stats.operatingProfit >= 0 ? `<span class="profit-text">Profit</span>` : `<span class="loss-text">Loss</span>`;
        }

        tbody.innerHTML += `
            <tr>
                <td><strong>${animal.id}</strong></td>
                <td>${statusHTML}</td>
                <td><button class="update-btn" onclick="openUpdateLog('${animal.id}')">Update</button></td>
            </tr>
        `;
    });
}

function openUpdateLog(animalId) {
    document.getElementById('dailyLogUpdateSection').classList.remove('hidden');
    document.getElementById('updateAnimalHeader').innerText = `Add Daily Record for: ${animalId}`;
    document.getElementById('logAnimalId').value = animalId;
    document.getElementById('logDate').value = new Date().toISOString().split('T')[0];
}

document.getElementById('dailyLogForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const animalId = document.getElementById('logAnimalId').value;
    const animal = farmData.find(a => a.id === animalId);
    if(!animal) return;

    animal.logs.push({
        date: document.getElementById('logDate').value,
        milkLiters: parseFloat(document.getElementById('logMilk').value),
        income: parseFloat(document.getElementById('logMilk').value) * parseFloat(document.getElementById('logPrice').value),
        expense: parseFloat(document.getElementById('logExpense').value)
    });

    saveData();
    alert(`Daily Log Saved for ${animalId}!`);
    this.reset();
    document.getElementById('dailyLogUpdateSection').classList.add('hidden');
    renderDailyUpdateList(); 
});

// 5. Update Dashboard
function updateDashboard() {
    let totalOperatingExpense = 0, totalOperatingRevenue = 0;
    let pendingVaccineCount = 0;
    let animalsAtLoss = []; 
    let milkByDate = {}; 
    let activeAnimalCount = 0;

    const alertBox = document.getElementById('vaccineAlertBox');
    alertBox.innerHTML = '<h3>⚠️ Upcoming Vaccination Alerts</h3>';
    let hasAlerts = false;
    const today = new Date();

    farmData.forEach(animal => {
        if (animal.status === 'Active') {
            activeAnimalCount++;
            const nextVacDate = new Date(animal.nextVaccine);
            if (nextVacDate <= today || (nextVacDate - today) / (1000 * 60 * 60 * 24) <= 7) {
                pendingVaccineCount++;
                hasAlerts = true;
                alertBox.innerHTML += `<p class="alert-red">ID: ${animal.id} - Vaccine due on ${animal.nextVaccine}</p>`;
            }
        }

        const stats = getAnimalFinance(animal);
        totalOperatingExpense += stats.exp;
        totalOperatingRevenue += stats.rev;

        if (animal.status === 'Active' && stats.hasEnoughLogs && stats.operatingProfit < 0) {
            animalsAtLoss.push(animal.id);
        }

        animal.logs.forEach(log => {
            if(!milkByDate[log.date]) milkByDate[log.date] = 0;
            milkByDate[log.date] += log.milkLiters;
        });
    });

    const totalOperatingProfit = totalOperatingRevenue - totalOperatingExpense;

    const lossBanner = document.getElementById('lossAlertBanner');
    const lossText = document.getElementById('lossAlertText');
    if (animalsAtLoss.length > 0) {
        lossText.innerText = `⚠️ WARNING: The following animals are operating at a LOSS (After 4+ days of logs): ${animalsAtLoss.join(', ')} ⚠️`;
        lossBanner.classList.remove('hidden');
    } else {
        lossBanner.classList.add('hidden');
    }

    document.getElementById('totalAnimals').innerText = activeAnimalCount;
    document.getElementById('pendingVaccines').innerText = pendingVaccineCount;
    document.getElementById('totalProfit').innerText = totalOperatingProfit;
    document.getElementById('totalProfit').className = totalOperatingProfit >= 0 ? "profit-text" : "loss-text";

    if (hasAlerts) alertBox.classList.remove('hidden'); else alertBox.classList.add('hidden');

    financialChart.data.datasets[0].data = [totalOperatingExpense, totalOperatingRevenue];
    financialChart.update();

    const sortedDates = Object.keys(milkByDate).sort();
    productionChart.data.labels = sortedDates;
    productionChart.data.datasets[0].data = sortedDates.map(date => milkByDate[date]);
    productionChart.update();
}

// 6. Animals View (With Specific Delete Action)
function renderAnimalsTable() {
    const tbody = document.getElementById('animalTableBody');
    tbody.innerHTML = "";
    farmData.forEach(animal => {
        const stats = getAnimalFinance(animal);
        const stateColor = animal.status === 'Active' ? 'green' : 'gray';
        
        let opProfitText = "Pending 4 logs";
        if(stats.hasEnoughLogs) {
            opProfitText = `<span class="${stats.operatingProfit >= 0 ? 'profit-text' : 'loss-text'}">${stats.operatingProfit}</span>`;
        }

        let finalProfitText = "-";
        if(animal.status === 'Sold') {
            finalProfitText = `<span class="${stats.finalProfit >= 0 ? 'profit-text' : 'loss-text'}">${stats.finalProfit}</span>`;
            opProfitText = "N/A (Sold)";
        }

        tbody.innerHTML += `
            <tr>
                <td><strong>${animal.id}</strong></td>
                <td style="color:${stateColor}; font-weight:bold;">${animal.status}</td>
                <td>${animal.logs.length}</td>
                <td>${opProfitText}</td>
                <td>${finalProfitText}</td>
                <td><button class="delete-btn" onclick="deleteAnimalData('${animal.id}')">Delete</button></td>
            </tr>
        `;
    });
}

// Search dashboard
function searchAnimalOnDashboard() {
    const searchId = document.getElementById('dashboardSearchId').value.trim().toUpperCase();
    const animal = farmData.find(a => a.id === searchId);
    if(animal) {
        const stats = getAnimalFinance(animal);
        alert(`Found!\nID: ${animal.id}\nStatus: ${animal.status}\nNext Vaccine: ${animal.nextVaccine}\nMilk Logs: ${animal.logs.length}\nOperating Profit: ${stats.operatingProfit} BDT`);
    } else {
        alert("Animal ID not found.");
    }
}

// 7. Analyzer View
function renderMonthlyAnalyzer() {
    const monthlyData = {}; 
    farmData.forEach(animal => {
        animal.logs.forEach(log => {
            const monthYear = log.date.substring(0, 7); 
            if(!monthlyData[monthYear]) monthlyData[monthYear] = { income: 0, expense: 0 };
            monthlyData[monthYear].income += log.income;
            monthlyData[monthYear].expense += log.expense;
        });
    });

    const labels = Object.keys(monthlyData).sort();
    const profitData = labels.map(m => monthlyData[m].income - monthlyData[m].expense);

    const ctx = document.getElementById('monthlyChart').getContext('2d');
    if(monthlyChartInstance) monthlyChartInstance.destroy(); 
    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Net Operating Profit/Loss (BDT)',
                data: profitData,
                backgroundColor: profitData.map(p => p >= 0 ? '#27ae60' : '#e74c3c')
            }]
        }
    });
}

// 8. QR Generator
function generateQR() {
    const searchId = document.getElementById('qrSearchId').value.trim().toUpperCase();
    const animal = farmData.find(a => a.id === searchId);
    const qrDiv = document.getElementById('qrcode');
    qrDiv.innerHTML = ""; 

    if (animal) {
        const qrText = `ID: ${animal.id} | Born: ${animal.birthDate} | Next Vac: ${animal.nextVaccine}`;
        new QRCode(qrDiv, { text: qrText, width: 200, height: 200 });
        document.getElementById('qrResult').classList.remove('hidden');
    } else {
        alert("Animal ID not found.");
        document.getElementById('qrResult').classList.add('hidden');
    }
}

// 9. Delete Specific Animal Function
function deleteAnimalData(id) {
    if(confirm(`Are you sure you want to permanently delete data for Animal ID: ${id}?`)) {
        farmData = farmData.filter(animal => animal.id !== id);
        saveData();
        alert(`Animal ${id} deleted successfully.`);
        updateDashboard();
        renderAnimalsTable();
    }
}

// 10. Delete ALL System Data
function deleteAllSystemData() {
    if(confirm("🚨 WARNING: Are you absolutely sure you want to delete ALL data? This action cannot be undone!")) {
        if(confirm("Please confirm ONE MORE TIME to wipe the entire database.")) {
            farmData = [];
            saveData();
            alert("All system data has been wiped clean.");
            logout(); 
            window.location.reload(); 
        }
    }
}

// Init Dashboard data
updateDashboard();