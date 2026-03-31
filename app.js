// ── FinFlow: App Logic ──────────────────────────────────────
// Persists data in localStorage, renders charts with Canvas API

const STORAGE_KEY = 'finflow_transactions';

const CATEGORY_ICONS = {
  Food: '🍔', Transport: '🚗', Housing: '🏠',
  Entertainment: '🎮', Health: '💊', Salary: '💼',
  Freelance: '💻', Other: '📦'
};

const CHART_COLORS = [
  '#c8f542','#42a5f5','#ff5252','#ff9f43','#a29bfe',
  '#fd79a8','#00cec9','#fdcb6e'
];

// ── State ────────────────────────────────────────────────────
let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let selectedType = 'income';

// ── Helpers ──────────────────────────────────────────────────
const fmt = n => '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
const today = () => new Date().toISOString().split('T')[0];

function totals() {
  const income  = transactions.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
  const balance = income - expense;
  const savings = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
  return { income, expense, balance, savings };
}

// ── Render ───────────────────────────────────────────────────
function render() {
  const { income, expense, balance, savings } = totals();
  const maxVal = Math.max(income, expense, 1);

  // Header
  document.getElementById('header-balance').textContent = fmt(balance);

  // Dashboard
  document.getElementById('dash-balance').textContent = fmt(balance);
  document.getElementById('dash-income').textContent   = fmt(income);
  document.getElementById('dash-expense').textContent  = fmt(expense);
  document.getElementById('dash-savings').textContent  = savings + '%';

  document.getElementById('income-bar').style.width  = (income  / maxVal * 100) + '%';
  document.getElementById('expense-bar').style.width = (expense / maxVal * 100) + '%';
  document.getElementById('savings-bar').style.width = Math.max(0, savings) + '%';

  // Recent list (last 5)
  renderList('recent-list', transactions.slice(-5).reverse(), true);

  // All list (filtered)
  const fType = document.getElementById('filter-type').value;
  const fCat  = document.getElementById('filter-cat').value;
  const filtered = transactions.filter(t =>
    (fType === 'all' || t.type === fType) &&
    (fCat  === 'all' || t.category === fCat)
  ).reverse();
  renderList('all-list', filtered, false);

  drawPieChart();
  drawBarChart();
}

function renderList(id, list, compact) {
  const ul = document.getElementById(id);
  ul.innerHTML = '';
  if (!list.length) {
    ul.innerHTML = '<li class="empty-state">No transactions here yet.</li>';
    return;
  }
  list.forEach(t => {
    const li = document.createElement('li');
    li.className = 'tx-item';
    li.innerHTML = `
      <span class="tx-icon">${CATEGORY_ICONS[t.category] || '📦'}</span>
      <div class="tx-info">
        <div class="tx-desc">${t.description}</div>
        <div class="tx-meta">${t.category} · ${t.date}</div>
      </div>
      <span class="tx-amount ${t.type}">${t.type === 'income' ? '+' : '−'}${fmt(t.amount)}</span>
      ${compact ? '' : `<button class="tx-delete" data-id="${t.id}" title="Delete">✕</button>`}
    `;
    ul.appendChild(li);
  });

  ul.querySelectorAll('.tx-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteTransaction(btn.dataset.id));
  });
}

// ── Charts ───────────────────────────────────────────────────
function drawPieChart() {
  const canvas = document.getElementById('cat-chart');
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const cx = size / 2, cy = size / 2, r = size * 0.38;

  ctx.clearRect(0, 0, size, size);

  const expenses = transactions.filter(t => t.type === 'expense');
  if (!expenses.length) {
    ctx.fillStyle = '#22222e';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6b6b80';
    ctx.font = '600 14px Syne, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('No expense data', cx, cy);
    document.getElementById('chart-legend').innerHTML = '';
    return;
  }

  const catMap = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const total = Object.values(catMap).reduce((a,b) => a+b, 0);
  const cats = Object.entries(catMap).sort((a,b) => b[1]-a[1]);

  let angle = -Math.PI / 2;
  const colorMap = {};
  cats.forEach(([cat, val], i) => {
    const slice = (val / total) * Math.PI * 2;
    colorMap[cat] = CHART_COLORS[i % CHART_COLORS.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = colorMap[cat];
    ctx.fill();
    ctx.strokeStyle = '#0a0a0f';
    ctx.lineWidth = 2;
    ctx.stroke();
    angle += slice;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0f';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#f0f0f5';
  ctx.font = '800 22px Syne, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(fmt(total), cx, cy - 10);
  ctx.fillStyle = '#6b6b80';
  ctx.font = '500 11px Syne, sans-serif';
  ctx.fillText('TOTAL SPEND', cx, cy + 14);

  // Legend
  const legend = document.getElementById('chart-legend');
  legend.innerHTML = cats.map(([cat, val]) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${colorMap[cat]}"></span>
      <span class="legend-name">${cat}</span>
      <span class="legend-pct">${Math.round(val/total*100)}%</span>
    </div>
  `).join('');
}

function drawBarChart() {
  const canvas = document.getElementById('monthly-chart');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Build last 6 months
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push({ label: d.toLocaleString('default', { month: 'short' }), key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}` });
  }

  const incomeByMonth  = {}, expenseByMonth = {};
  transactions.forEach(t => {
    const mk = t.date.slice(0,7);
    if (t.type === 'income')  incomeByMonth[mk]  = (incomeByMonth[mk]  || 0) + t.amount;
    if (t.type === 'expense') expenseByMonth[mk] = (expenseByMonth[mk] || 0) + t.amount;
  });

  const maxVal = Math.max(1, ...months.map(m => Math.max(incomeByMonth[m.key]||0, expenseByMonth[m.key]||0)));

  const pad = { l: 50, r: 20, t: 20, b: 40 };
  const chartW = W - pad.l - pad.r;
  const chartH = H - pad.t - pad.b;
  const groupW = chartW / months.length;
  const barW = Math.min(24, groupW * 0.32);

  // Axis
  ctx.strokeStyle = '#22222e'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t + chartH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t + chartH); ctx.lineTo(W - pad.r, pad.t + chartH); ctx.stroke();

  // Y gridlines
  for (let g = 0; g <= 4; g++) {
    const y = pad.t + (chartH / 4) * g;
    ctx.strokeStyle = '#1a1a24'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y); ctx.stroke();
    ctx.fillStyle = '#6b6b80';
    ctx.font = '10px DM Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText('$' + Math.round(maxVal * (1 - g/4)).toLocaleString(), pad.l - 6, y + 4);
  }

  months.forEach((m, i) => {
    const cx = pad.l + groupW * i + groupW / 2;
    const inc = incomeByMonth[m.key] || 0;
    const exp = expenseByMonth[m.key] || 0;

    // Income bar
    const iH = (inc / maxVal) * chartH;
    ctx.fillStyle = 'rgba(200,245,66,0.85)';
    ctx.beginPath();
    ctx.roundRect(cx - barW - 2, pad.t + chartH - iH, barW, iH, [4,4,0,0]);
    ctx.fill();

    // Expense bar
    const eH = (exp / maxVal) * chartH;
    ctx.fillStyle = 'rgba(255,82,82,0.85)';
    ctx.beginPath();
    ctx.roundRect(cx + 2, pad.t + chartH - eH, barW, eH, [4,4,0,0]);
    ctx.fill();

    // Month label
    ctx.fillStyle = '#6b6b80';
    ctx.font = '11px Syne, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, cx, pad.t + chartH + 20);
  });

  // Legend
  const lx = W - pad.r - 140, ly = pad.t + 10;
  ctx.fillStyle = 'rgba(200,245,66,0.85)';
  ctx.fillRect(lx, ly, 12, 12);
  ctx.fillStyle = '#f0f0f5'; ctx.font = '11px Syne'; ctx.textAlign = 'left';
  ctx.fillText('Income', lx + 16, ly + 10);
  ctx.fillStyle = 'rgba(255,82,82,0.85)';
  ctx.fillRect(lx + 80, ly, 12, 12);
  ctx.fillStyle = '#f0f0f5';
  ctx.fillText('Expense', lx + 96, ly + 10);
}

// ── Add Transaction ───────────────────────────────────────────
document.getElementById('add-btn').addEventListener('click', () => {
  const desc   = document.getElementById('desc').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const cat    = document.getElementById('category').value;
  const date   = document.getElementById('date').value || today();

  if (!desc || isNaN(amount) || amount <= 0) {
    alert('Please fill in a valid description and amount.');
    return;
  }

  transactions.push({ id: Date.now().toString(), description: desc, amount, category: cat, type: selectedType, date });
  save(); render();

  document.getElementById('desc').value   = '';
  document.getElementById('amount').value = '';
  document.getElementById('date').value   = '';
});

// ── Type Toggle ───────────────────────────────────────────────
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedType = btn.dataset.type;
  });
});

// ── Delete ────────────────────────────────────────────────────
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  save(); render();
}

// ── Clear All ─────────────────────────────────────────────────
document.getElementById('clear-btn').addEventListener('click', () => {
  if (confirm('Delete ALL transactions? This cannot be undone.')) {
    transactions = [];
    save(); render();
  }
});

// ── Filters ───────────────────────────────────────────────────
document.getElementById('filter-type').addEventListener('change', render);
document.getElementById('filter-cat').addEventListener('change', render);

// ── Tab Navigation ────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'analytics') { drawPieChart(); drawBarChart(); }
  });
});

// ── Seed Demo Data (first visit) ──────────────────────────────
if (!transactions.length) {
  const demo = [
    { id:'1', description:'Monthly Salary',    amount:4500, category:'Salary',        type:'income',  date:'2025-03-01' },
    { id:'2', description:'Freelance Project', amount:900,  category:'Freelance',     type:'income',  date:'2025-03-08' },
    { id:'3', description:'Rent',              amount:1200, category:'Housing',       type:'expense', date:'2025-03-02' },
    { id:'4', description:'Grocery Shopping',  amount:180,  category:'Food',          type:'expense', date:'2025-03-05' },
    { id:'5', description:'Uber rides',        amount:65,   category:'Transport',     type:'expense', date:'2025-03-10' },
    { id:'6', description:'Netflix + Spotify', amount:28,   category:'Entertainment', type:'expense', date:'2025-03-11' },
    { id:'7', description:'Doctor visit',      amount:90,   category:'Health',        type:'expense', date:'2025-03-15' },
    { id:'8', description:'Dinner out',        amount:55,   category:'Food',          type:'expense', date:'2025-03-18' },
    { id:'9', description:'Salary',            amount:4500, category:'Salary',        type:'income',  date:'2025-04-01' },
    { id:'10',description:'Groceries',         amount:210,  category:'Food',          type:'expense', date:'2025-04-06' },
  ];
  transactions = demo;
  save();
}

// ── Init ──────────────────────────────────────────────────────
document.getElementById('date').value = today();
render();
