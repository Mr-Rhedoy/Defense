// calc.js - ALL profit/loss math lives here (used by the website and by the server)

// Round to 2 decimals so 0.1 * 3 - 0.3 gives 0, not 5.5e-17
const r2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
// Bad or missing numbers count as 0
const num = n => (Number.isFinite(Number(n)) ? Number(n) : 0);

// Today's date in the user's own time zone (toISOString uses UTC and shows yesterday after midnight in Bangladesh)
const localDate = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// One daily record
const logIncome = l => r2(num(l.milk) * num(l.price));
const logExpense = l => r2(num(l.expense));
const logProfit = l => r2(logIncome(l) - logExpense(l));

// One animal
const totalIncome = a => r2(a.logs.reduce((s, l) => s + logIncome(l), 0));
const totalExpense = a => r2(a.logs.reduce((s, l) => s + logExpense(l), 0));
const opProfit = a => r2(totalIncome(a) - totalExpense(a));            // milk profit, buying price NOT included
const logDays = a => new Set(a.logs.map(l => l.date)).size;           // number of different days recorded
const netSoFar = a => r2(opProfit(a) - num(a.buyPrice));              // profit after buying price (animal not sold yet)
const finalProfit = a =>                                              // only after selling
    a.status === 'sold' ? r2(opProfit(a) + num(a.sellPrice) - num(a.buyPrice)) : null;

if (typeof module !== 'undefined') {
    module.exports = { r2, num, localDate, logIncome, logExpense, logProfit, totalIncome, totalExpense, opProfit, logDays, netSoFar, finalProfit };
}
