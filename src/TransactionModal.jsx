import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Plus, X } from 'lucide-react'

export default function TransactionModal({ categories, onAdd, onClose }) {
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState(() => ({
    title: '',
    category: 'Food & drink',
    type: 'expense',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  }))

  function handleSubmit(event) {
    event.preventDefault()
    const amount = Number(form.amount)
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0 || !form.date) {
      setFormError('Enter a description, a valid amount, and a date.')
      return
    }

    onAdd({
      ...form,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title: form.title.trim(),
      amount,
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading">
          <div><p className="eyebrow">KEEP YOUR FINANCES UP TO DATE</p><h2 id="modal-title">Add a transaction</h2></div>
          <button className="icon-button" aria-label="Close dialog" type="button" onClick={onClose}><X size={19} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="transaction-type-toggle">
            <button className={form.type === 'expense' ? 'chosen-expense' : ''} type="button" onClick={() => setForm({ ...form, type: 'expense', category: 'Food & drink' })}><ArrowUpRight size={15} /> Expense</button>
            <button className={form.type === 'income' ? 'chosen-income' : ''} type="button" onClick={() => setForm({ ...form, type: 'income', category: 'Income' })}><ArrowDownLeft size={15} /> Income</button>
          </div>
          <label className="form-label">Description<input autoFocus placeholder="e.g. Groceries, monthly salary" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <div className="form-row">
            <label className="form-label">Amount<div className="amount-input"><span>$</span><input type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></div></label>
            <label className="form-label">Date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          </div>
          <label className="form-label">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.filter((category) => category.name === 'Income' ? form.type === 'income' : category.name !== 'Income').map((category) => <option key={category.name}>{category.name}</option>)}</select></label>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          <div className="modal-actions">
            <button className="cancel-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button" type="submit"><Plus size={16} /> Add transaction</button>
          </div>
        </form>
      </section>
    </div>
  )
}
