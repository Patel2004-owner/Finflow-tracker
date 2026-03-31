# 💸 FinFlow — Personal Finance Tracker

> A sleek, zero-dependency personal finance tracker that runs entirely in the browser.

![FinFlow Screenshot](https://via.placeholder.com/900x500/0a0a0f/c8f542?text=FinFlow+Finance+Tracker)

## ✨ Features

- **Dashboard** — At-a-glance balance, income, expenses, and savings rate with animated progress bars
- **Transactions** — Add, filter by type/category, and delete transactions; persisted in `localStorage`
- **Analytics** — Interactive donut chart (spending by category) and bar chart (monthly income vs expenses)
- **Zero dependencies** — Pure HTML, CSS, and vanilla JavaScript; no build step required
- **Responsive** — Works on desktop and mobile

## 🚀 Getting Started

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/finflow.git

# Navigate into the project
cd finflow

# Open directly in your browser
open index.html
# or just double-click index.html
```

No npm, no bundler, no server required.

## 📁 Project Structure

```
finflow/
├── index.html   # App shell & markup
├── style.css    # All styles (CSS variables, animations)
├── app.js       # App logic, chart rendering, localStorage
└── README.md
```

## 🛠️ How It Works

| Layer | Tech |
|-------|------|
| Markup | Semantic HTML5 |
| Styles | CSS3 (custom properties, animations, grid, flexbox) |
| Logic | Vanilla ES6+ JavaScript |
| Charts | HTML Canvas API (no chart library) |
| Storage | `localStorage` (no backend needed) |

## 📊 Charts

Both charts are drawn from scratch using the **Canvas 2D API** — no Chart.js, no D3.

- **Donut chart** — segments per spending category with percentage legend
- **Bar chart** — grouped bars for income vs. expenses over the last 6 months

## 🎨 Design

- Typography: [Syne](https://fonts.google.com/specimen/Syne) + [DM Mono](https://fonts.google.com/specimen/DM+Mono)
- Dark editorial aesthetic with grain overlay
- Accent: **#c8f542** (electric lime)
- Animated tab transitions and hover micro-interactions

## 🔧 Customization

Add more categories in `index.html` (`<select id="category">`) and map them to emoji icons in `app.js` (`CATEGORY_ICONS`). Chart colors can be customized via the `CHART_COLORS` array.

## 📄 License

MIT © 2025 — free to use and modify.
