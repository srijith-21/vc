import { lazy, Suspense, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CarFront,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clapperboard,
  Download,
  Ellipsis,
  HeartPulse,
  Home,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  Utensils,
  Wallet,
  X,
} from 'lucide-react'
import './App.css'

const TransactionModal = lazy(() => import('./TransactionModal.jsx'))

const TRANSACTIONS_KEY = 'moneta-transactions'
const BUDGETS_KEY = 'moneta-budgets'

const categories = [
  { name: 'Housing', icon: Home, color: 'lavender' },
  { name: 'Food & drink', icon: Utensils, color: 'peach' },
  { name: 'Transport', icon: CarFront, color: 'blue' },
  { name: 'Shopping', icon: ShoppingBag, color: 'pink' },
  { name: 'Health', icon: HeartPulse, color: 'green' },
  { name: 'Entertainment', icon: Clapperboard, color: 'yellow' },
  { name: 'Income', icon: BriefcaseBusiness, color: 'mint' },
  { name: 'Other', icon: Wallet, color: 'gray' },
]

const categoryColors = {
  Housing: '#9083e8',
  'Food & drink': '#f5a77a',
  Transport: '#74a9e8',
  Shopping: '#e78eaf',
  Health: '#70bd9d',
  Entertainment: '#e5bd66',
  Income: '#50b995',
  Other: '#9da6b5',
}

const defaultBudgets = {
  Housing: 1600,
  'Food & drink': 350,
  Transport: 250,
  Shopping: 300,
  Health: 180,
  Entertainment: 200,
}

const money = (amount, compact = false) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(amount)

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const formatDate = (date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(`${date}T12:00:00`),
  )

function readStorage(key, fallback, validate) {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const value = JSON.parse(saved)
    return validate(value) ? value : fallback
  } catch {
    return fallback
  }
}

function createExampleTransactions() {
  const now = new Date()
  const makeDate = (offset, day) => {
    const latestDay = offset === 0 ? now.getDate() : 25
    const date = new Date(now.getFullYear(), now.getMonth() - offset, Math.min(day, latestDay))
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }
  const monthlyTransactions = [
    { title: 'Monthly salary', category: 'Income', amount: 4800, type: 'income', day: 1 },
    { title: 'Rent payment', category: 'Housing', amount: 1450, type: 'expense', day: 2 },
    { title: 'Weekly groceries', category: 'Food & drink', amount: 142, type: 'expense', day: 3 },
    { title: 'Electricity bill', category: 'Housing', amount: 86, type: 'expense', day: 4 },
    { title: 'Coffee & lunch', category: 'Food & drink', amount: 38, type: 'expense', day: 5 },
    { title: 'Metro pass', category: 'Transport', amount: 74, type: 'expense', day: 6 },
    { title: 'Freelance project', category: 'Income', amount: 650, type: 'income', day: 7 },
    { title: 'Home supplies', category: 'Shopping', amount: 118, type: 'expense', day: 8 },
    { title: 'Dinner out', category: 'Food & drink', amount: 72, type: 'expense', day: 9 },
    { title: 'Streaming services', category: 'Entertainment', amount: 28, type: 'expense', day: 10 },
    { title: 'Pharmacy', category: 'Health', amount: 32, type: 'expense', day: 11 },
  ]
  return Array.from({ length: 6 }, (_, offset) =>
    monthlyTransactions.map((transaction, index) => ({
      ...transaction,
      id: `sample-${offset}-${index}`,
      date: makeDate(offset, transaction.day),
      amount:
        offset === 0
          ? transaction.amount
          : transaction.type === 'income'
            ? transaction.amount + [0, -150, 280, -80, 120][offset - 1]
            : Math.round(transaction.amount * (1 + [0, 0.14, -0.08, 0.1, -0.04][offset - 1])),
    })),
  ).flat()
}

function App() {
  const [transactions, setTransactions] = useState(() =>
    readStorage(TRANSACTIONS_KEY, null, (value) => Array.isArray(value)) ?? createExampleTransactions(),
  )
  const [budgets, setBudgets] = useState(() =>
    readStorage(BUDGETS_KEY, defaultBudgets, (value) => value && typeof value === 'object' && !Array.isArray(value)),
  )
  const [selectedMonth, setSelectedMonth] = useState(() => new Date())
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All categories')
  const [typeFilter, setTypeFilter] = useState('All types')
  const [showForm, setShowForm] = useState(false)
  const [editingBudgets, setEditingBudgets] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const activeMonth = monthKey(selectedMonth)
  const monthTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.date.startsWith(activeMonth)),
    [transactions, activeMonth],
  )
  const income = monthTransactions
    .filter((transaction) => transaction.type === 'income')
    .reduce((total, transaction) => total + Number(transaction.amount), 0)
  const expenses = monthTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((total, transaction) => total + Number(transaction.amount), 0)

  const filteredTransactions = useMemo(() => {
    const search = query.trim().toLowerCase()
    return monthTransactions
      .filter((transaction) => {
        const matchesSearch =
          !search ||
          transaction.title.toLowerCase().includes(search) ||
          transaction.category.toLowerCase().includes(search)
        const matchesCategory = categoryFilter === 'All categories' || transaction.category === categoryFilter
        const matchesType = typeFilter === 'All types' || transaction.type === typeFilter.toLowerCase()
        return matchesSearch && matchesCategory && matchesType
      })
      .sort((left, right) => right.date.localeCompare(left.date))
  }, [monthTransactions, query, categoryFilter, typeFilter])

  const expenseByCategory = useMemo(
    () =>
      categories
        .filter((category) => category.name !== 'Income')
        .map((category) => ({
          ...category,
          amount: monthTransactions
            .filter((transaction) => transaction.type === 'expense' && transaction.category === category.name)
            .reduce((total, transaction) => total + Number(transaction.amount), 0),
        }))
        .filter((category) => category.amount > 0)
        .sort((a, b) => b.amount - a.amount),
    [monthTransactions],
  )

  const chartMonths = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => {
        const date = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 5 + index, 1)
        const key = monthKey(date)
        const monthEntries = transactions.filter((transaction) => transaction.date.startsWith(key))
        return {
          label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date),
          income: monthEntries
            .filter((transaction) => transaction.type === 'income')
            .reduce((total, transaction) => total + Number(transaction.amount), 0),
          expenses: monthEntries
            .filter((transaction) => transaction.type === 'expense')
            .reduce((total, transaction) => total + Number(transaction.amount), 0),
        }
      }),
    [transactions, selectedMonth],
  )

  function persistTransactions(nextTransactions) {
    setTransactions(nextTransactions)
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(nextTransactions))
  }

  function persistBudgets(nextBudgets) {
    setBudgets(nextBudgets)
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(nextBudgets))
  }

  function handleAddTransaction(transaction) {
    persistTransactions([transaction, ...transactions])
    setSelectedMonth(new Date(`${transaction.date}T12:00:00`))
    setQuery('')
    setCategoryFilter('All categories')
    setTypeFilter('All types')
    setShowForm(false)
  }

  function shiftMonth(offset) {
    setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + offset, 1))
  }

  const monthlyTitle = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(selectedMonth)

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <a href="#" className="brand" aria-label="Moneta home">
          <span className="brand-mark"><Wallet size={20} strokeWidth={2.4} /></span>
          <span>moneta<span className="brand-period">.</span></span>
        </a>
        <div className="workspace-switcher">
          <span className="avatar avatar-purple">S</span>
          <span className="workspace-copy"><strong>Sarah’s workspace</strong><small>Personal account</small></span>
          <ChevronDown size={15} />
        </div>
        <p className="sidebar-label">WORKSPACE</p>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#overview"><LayoutDashboard size={18} /> Overview</a>
          <a className="nav-link" href="#transactions"><ArrowDownLeft size={18} /> Transactions</a>
          <a className="nav-link" href="#budgets"><ChartNoAxesCombined size={18} /> Budgets <span className="nav-count">2</span></a>
        </nav>
        <p className="sidebar-label tools-label">PREFERENCES</p>
        <nav className="main-nav" aria-label="Preferences">
          <button className="nav-link" type="button" onClick={() => setEditingBudgets(true)}><Settings size={18} /> Settings</button>
          <a className="nav-link" href="mailto:hello@moneta.example"><CircleHelp size={18} /> Help & support</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><ChartNoAxesCombined size={17} /></div>
            <strong>Make your money work smarter</strong>
            <p>Get a clearer picture of your financial future.</p>
            <button type="button" onClick={() => document.getElementById('budgets')?.scrollIntoView({ behavior: 'smooth' })}>
              Explore insights <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="profile-button" type="button" aria-label="Sarah's profile">
            <span className="avatar avatar-photo">S</span>
            <span className="workspace-copy"><strong>Sarah Johnson</strong><small>Free plan</small></span>
            <Ellipsis size={19} />
          </button>
        </div>
      </aside>

      {mobileMenuOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} />}

      <main className="main-content" id="overview">
        <header className="topbar">
          <button className="mobile-menu-button icon-button" type="button" aria-label="Open menu" onClick={() => setMobileMenuOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumb">Workspace <ChevronRight size={14} /> <strong>Overview</strong></div>
          <div className="topbar-actions">
            <button className="icon-button notification-button" type="button" aria-label="Notifications"><Bell size={18} /><span /></button>
            <span className="topbar-divider" />
            <span className="avatar avatar-purple topbar-avatar">S</span>
          </div>
        </header>

        <div className="dashboard">
          <section className="page-heading">
            <div>
              <p className="eyebrow">YOUR FINANCES AT A GLANCE</p>
              <h1>Good morning, Sarah <span className="wave">✳</span></h1>
              <p className="page-subtitle">Here’s what’s happening with your money.</p>
            </div>
            <button className="primary-button" type="button" onClick={() => setShowForm(true)}>
              <Plus size={17} strokeWidth={2.5} /> Add transaction
            </button>
          </section>

          <section className="summary-grid" aria-label="Monthly summary">
            <article className="summary-card balance-card">
              <div className="summary-card-top"><span className="summary-icon balance-icon"><Wallet size={17} /></span><span className="summary-period">THIS MONTH</span><button className="subtle-icon" aria-label="Balance options" type="button"><Ellipsis size={19} /></button></div>
              <p className="metric-label">Remaining balance</p>
              <p className="metric-value">{money(income - expenses)}</p>
              <p className="metric-note"><span className="positive-note"><ArrowUpRight size={14} /> 12.8%</span> vs. last month</p>
            </article>
            <article className="summary-card">
              <div className="summary-card-top"><span className="summary-icon income-icon"><ArrowDownLeft size={17} /></span><span className="summary-period">THIS MONTH</span><button className="subtle-icon" aria-label="Income options" type="button"><Ellipsis size={19} /></button></div>
              <p className="metric-label">Total income</p>
              <p className="metric-value">{money(income)}</p>
              <p className="metric-note"><span className="positive-note"><ArrowUpRight size={14} /> 8.2%</span> vs. last month</p>
            </article>
            <article className="summary-card">
              <div className="summary-card-top"><span className="summary-icon expense-icon"><ArrowUpRight size={17} /></span><span className="summary-period">THIS MONTH</span><button className="subtle-icon" aria-label="Expense options" type="button"><Ellipsis size={19} /></button></div>
              <p className="metric-label">Total expenses</p>
              <p className="metric-value">{money(expenses)}</p>
              <p className="metric-note"><span className="negative-note"><ArrowDownRight size={14} /> 3.4%</span> vs. last month</p>
            </article>
            <article className="summary-card">
              <div className="summary-card-top"><span className="summary-icon savings-icon"><ChartNoAxesCombined size={17} /></span><span className="summary-period">SAVINGS RATE</span><button className="subtle-icon" aria-label="Savings options" type="button"><Ellipsis size={19} /></button></div>
              <p className="metric-label">You’re saving</p>
              <p className="metric-value">{income ? `${Math.round(((income - expenses) / income) * 100)}%` : '0%'}</p>
              <p className="metric-note">of your monthly income</p>
            </article>
          </section>

          <section className="middle-grid">
            <article className="panel cashflow-panel">
              <div className="panel-heading">
                <div><h2>Cash flow</h2><p className="panel-subtitle">Your income and expenses over time</p></div>
                <button className="select-button" type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft size={15} /><span>6 months</span><ChevronDown size={13} /></button>
              </div>
              <div className="chart-legend">
                <span><i className="legend-dot income-dot" /> Income</span>
                <span><i className="legend-dot expense-dot" /> Expenses</span>
              </div>
              <CashflowChart data={chartMonths} />
            </article>

            <article className="panel spending-panel">
              <div className="panel-heading">
                <div><h2>Spending breakdown</h2><p className="panel-subtitle">Where your money goes</p></div>
                <button className="subtle-icon" type="button" aria-label="Spending breakdown options"><Ellipsis size={19} /></button>
              </div>
              <div className="spending-content">
                <div className="donut-wrap">
                  <div className="donut-chart" style={{ '--donut': donutGradient(expenseByCategory, expenses) }}>
                    <div className="donut-center"><strong>{money(expenses, true)}</strong><span>total spent</span></div>
                  </div>
                </div>
                <div className="category-legend">
                  {expenseByCategory.slice(0, 5).map((item) => (
                    <div className="category-legend-row" key={item.name}>
                      <span className="category-name"><i className="legend-dot" style={{ backgroundColor: categoryColors[item.name] }} />{item.name}</span>
                      <span className="category-amount">{expenses ? Math.round((item.amount / expenses) * 100) : 0}%</span>
                    </div>
                  ))}
                  {expenseByCategory.length === 0 && <p className="empty-chart">No expenses this month yet.</p>}
                </div>
              </div>
              <div className="spending-footer"><span>Highest category</span><strong>{expenseByCategory[0]?.name ?? '—'} <span>{expenseByCategory[0] ? money(expenseByCategory[0].amount) : ''}</span></strong></div>
            </article>
          </section>

          <section className="lower-grid">
            <article className="panel transactions-panel" id="transactions">
              <div className="panel-heading transactions-heading">
                <div><h2>Recent transactions</h2><p className="panel-subtitle">Keep an eye on where it all goes</p></div>
                <div className="month-picker">
                  <button className="subtle-icon" aria-label="Previous month" type="button" onClick={() => shiftMonth(-1)}><ChevronLeft size={17} /></button>
                  <span>{monthlyTitle}</span>
                  <button className="subtle-icon" aria-label="Next month" type="button" onClick={() => shiftMonth(1)}><ChevronRight size={17} /></button>
                </div>
              </div>
              <div className="filter-bar">
                <label className="search-field"><Search size={16} /><input aria-label="Search transactions" placeholder="Search transactions..." value={query} onChange={(event) => setQuery(event.target.value)} />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><X size={14} /></button>}</label>
                <label className="filter-select-wrap"><SlidersHorizontal size={15} /><select aria-label="Filter by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option>All categories</option>{categories.map((category) => <option key={category.name}>{category.name}</option>)}</select><ChevronDown size={13} /></label>
                <select className="type-select" aria-label="Filter by transaction type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>All types</option><option>Income</option><option>Expense</option></select>
                <button className="export-button" type="button" onClick={() => downloadTransactions(filteredTransactions)}><Download size={15} /><span>Export</span></button>
              </div>
              <div className="transaction-table-wrap">
                <table className="transaction-table">
                  <thead><tr><th>DESCRIPTION</th><th>CATEGORY</th><th>DATE</th><th className="amount-heading">AMOUNT</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {filteredTransactions.slice(0, 7).map((transaction) => {
                      const category = categories.find((item) => item.name === transaction.category) ?? categories[categories.length - 1]
                      const Icon = category.icon
                      return <tr key={transaction.id}>
                        <td><span className={`transaction-icon ${category.color}`}><Icon size={16} /></span><span className="transaction-description"><strong>{transaction.title}</strong><small>{transaction.type === 'income' ? 'Money in' : 'Money out'}</small></span></td>
                        <td><span className="category-pill"><i className="legend-dot" style={{ backgroundColor: categoryColors[transaction.category] }} />{transaction.category}</span></td>
                        <td className="date-cell">{formatDate(transaction.date)}</td>
                        <td className={`amount-cell ${transaction.type}`}>{transaction.type === 'income' ? '+' : '−'}{money(Number(transaction.amount))}</td>
                        <td><button className="delete-button" type="button" title={`Delete ${transaction.title}`} aria-label={`Delete ${transaction.title}`} onClick={() => persistTransactions(transactions.filter((item) => item.id !== transaction.id))}><Trash2 size={15} /></button></td>
                      </tr>
                    })}
                  </tbody>
                </table>
                {filteredTransactions.length === 0 && <div className="empty-transactions"><Search size={21} /><strong>No transactions found</strong><span>Try adjusting your search or filters.</span></div>}
              </div>
              <div className="table-footer"><span>Showing <strong>{Math.min(filteredTransactions.length, 7)}</strong> of <strong>{filteredTransactions.length}</strong> transactions</span><button type="button" onClick={() => { setQuery(''); setCategoryFilter('All categories'); setTypeFilter('All types') }}>View all transactions <ArrowUpRight size={14} /></button></div>
            </article>

            <article className="panel budgets-panel" id="budgets">
              <div className="panel-heading">
                <div><h2>Monthly budgets</h2><p className="panel-subtitle">Stay on track with your goals</p></div>
                <button className="text-action" type="button" onClick={() => setEditingBudgets(!editingBudgets)}>{editingBudgets ? 'Done' : 'Edit'}</button>
              </div>
              <div className="budget-overview">
                <div><span className="budget-label">TOTAL SPENT</span><strong>{money(expenses)} <small>of {money(Object.values(budgets).reduce((sum, amount) => sum + Number(amount || 0), 0))}</small></strong></div>
                <span className="budget-overview-icon"><ChartNoAxesCombined size={17} /></span>
              </div>
              <div className="budget-list">
                {Object.entries(budgets).map(([name, limit]) => {
                  const spent = monthTransactions
                    .filter((transaction) => transaction.category === name && transaction.type === 'expense')
                    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
                  const percentage = Number(limit) > 0 ? (spent / Number(limit)) * 100 : spent > 0 ? 100 : 0
                  const overBudget = percentage > 100
                  const category = categories.find((item) => item.name === name) ?? categories[0]
                  const Icon = category.icon
                  return <div className="budget-row" key={name}>
                    <div className="budget-row-top">
                      <span className={`budget-icon ${category.color}`}><Icon size={15} /></span>
                      <span className="budget-category">{name}</span>
                      {editingBudgets ? <label className="budget-edit"><span className="sr-only">{name} budget</span><span>$</span><input aria-label={`${name} monthly budget`} inputMode="decimal" value={limit} onChange={(event) => persistBudgets({ ...budgets, [name]: event.target.value === '' ? '' : Number(event.target.value) })} /></label> : <strong className={overBudget ? 'over-budget' : ''}>{money(spent)} <span>/ {money(Number(limit) || 0)}</span></strong>}
                    </div>
                    <div className="progress-track"><span className={`progress-value ${overBudget ? 'progress-over' : ''}`} style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: overBudget ? '#e4776a' : categoryColors[name] }} /></div>
                    {overBudget && <p className="budget-warning">You’re {money(spent - Number(limit))} over budget</p>}
                  </div>
                })}
              </div>
              <button className="all-budgets-button" type="button" onClick={() => setEditingBudgets(!editingBudgets)}>{editingBudgets ? 'Finish editing budgets' : 'Manage budgets'} <ArrowUpRight size={14} /></button>
            </article>
          </section>
          <footer className="page-footer"><span>© 2026 Moneta. All rights reserved.</span><span>Made for a more mindful money life <span className="footer-heart">♥</span></span></footer>
        </div>
      </main>

      {showForm && <Suspense fallback={<div className="modal-backdrop"><p className="transaction-modal" role="status">Preparing transaction form…</p></div>}>
        <TransactionModal categories={categories} onClose={() => setShowForm(false)} onAdd={handleAddTransaction} />
      </Suspense>}
    </div>
  )
}

function donutGradient(items, total) {
  if (!total || !items.length) return '#e9eaf0 0% 100%'
  let end = 0
  return items.map((item) => {
    const start = end
    end += (item.amount / total) * 100
    return `${categoryColors[item.name]} ${start}% ${end}%`
  }).join(', ')
}

function CashflowChart({ data }) {
  const max = Math.max(...data.flatMap((item) => [item.income, item.expenses]), 100)
  const chartHeight = 150
  const points = (key) => data.map((item, index) => {
    const x = 16 + (index * 464) / Math.max(data.length - 1, 1)
    const y = chartHeight - 10 - (item[key] / max) * (chartHeight - 25)
    return [x, y]
  })
  const incomePoints = points('income')
  const expensePoints = points('expenses')
  const polyline = (coords) => coords.map((point) => point.join(',')).join(' ')
  const area = `${incomePoints[0][0]},${chartHeight} ${polyline(incomePoints)} ${incomePoints[incomePoints.length - 1][0]},${chartHeight}`

  return <div className="cashflow-chart">
    <div className="chart-axis">
      {[max, max * 0.75, max * 0.5, max * 0.25, 0].map((value, index) => <span key={index}>{money(value, true)}</span>)}
    </div>
    <svg className="chart-svg" viewBox="0 0 496 166" role="img" aria-label="Line chart comparing monthly income and expenses over the last six months">
      {[12, 48, 84, 120, 156].map((y) => <line key={y} x1="16" x2="480" y1={y} y2={y} className="chart-gridline" />)}
      <polygon points={area} className="chart-area" />
      <polyline points={polyline(incomePoints)} className="chart-line income-line" />
      <polyline points={polyline(expensePoints)} className="chart-line expense-line" />
      {incomePoints.map(([cx, cy], index) => <circle key={`income-${index}`} cx={cx} cy={cy} r="3" className="chart-point income-point" />)}
      {expensePoints.map(([cx, cy], index) => <circle key={`expense-${index}`} cx={cx} cy={cy} r="3" className="chart-point expense-point" />)}
    </svg>
    <div className="chart-months">{data.map((item, index) => <span className={index === data.length - 1 ? 'current-chart-month' : ''} key={`${item.label}-${index}`}>{item.label}</span>)}</div>
  </div>
}

function downloadTransactions(transactions) {
  const headers = ['Description', 'Category', 'Type', 'Amount', 'Date']
  const rows = transactions.map((transaction) =>
    [transaction.title, transaction.category, transaction.type, transaction.amount, transaction.date]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(','),
  )
  const file = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = 'moneta-transactions.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export default App
