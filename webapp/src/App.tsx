import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import axios from 'axios'
import './index.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

// Automatically attach Telegram Web App initData as header for backend verification
if (WebApp.initData) {
  axios.defaults.headers.common['x-telegram-init-data'] = WebApp.initData;
}

function App() {
  const [activeTab, setActiveTab] = useState<'add' | 'expenses' | 'balances' | 'edit'>('add')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [description, setDescription] = useState('')
  const [paidBy, setPaidBy] = useState<number | ''>('')
  const [splitWith, setSplitWith] = useState<number[]>([])
  const [currenciesList, setCurrenciesList] = useState<string[]>(['SGD', 'USD', 'EUR', 'GBP'])

  const [isLoading, setIsLoading] = useState(false)

  const [members, setMembers] = useState<{ id: number, name: string }[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  const [balances, setBalances] = useState<{ id: number, from: string, fromId: number, to: string, toId: number, amount: number, currency: string }[]>([])
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)

  interface Expense {
    id: string;
    amount: number;
    currency: string;
    description: string;
    paidBy: number;
    date: string;
    splitWith: number[];
  }
  const [expensesList, setExpensesList] = useState<Expense[]>([])
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null)

  // Fetch group members on load
  useEffect(() => {
    const fetchMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const groupId = WebApp.initDataUnsafe?.start_param || -100123456789;
        const response = await axios.get(`${API_BASE_URL}/api/groups/${groupId}/members`);
        if (response.data && response.data.members) {
          const fetchedMembers = response.data.members;
          setMembers(fetchedMembers);

          // default paidBy to current user if found, or first member
          const currentUserId = WebApp.initDataUnsafe?.user?.id;
          const me = fetchedMembers.find((m: any) => m.id === currentUserId);
          if (me) {
            setPaidBy(me.id);
          } else if (fetchedMembers.length > 0) {
            setPaidBy(fetchedMembers[0].id);
          }

          // default splitWith to everyone
          setSplitWith(fetchedMembers.map((m: any) => m.id));
        }
      } catch (e: any) {
        console.error("Failed to fetch members", e);
        const errorDetail = e.response?.data?.error || e.message;
        showAlert(`Failed to load group members: ${errorDetail}`);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    fetchMembers();
  }, []);

  // Fetch currencies list on load
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/currencies`);
        if (response.data && response.data.currencies) {
          setCurrenciesList(response.data.currencies);
        }
      } catch (e) {
        console.error("Failed to fetch currencies", e);
      }
    };
    fetchCurrencies();
  }, []);

  // Fetch balances when switching to the balances tab
  useEffect(() => {
    const fetchBalances = async () => {
      if (activeTab === 'balances') {
        setIsLoadingBalances(true);
        try {
          const groupId = WebApp.initDataUnsafe?.start_param || -100123456789;

          const response = await axios.get(`${API_BASE_URL}/api/groups/${groupId}/balances`);
          if (response.data && response.data.balances) {
            setBalances(response.data.balances);
          }
        } catch (error: any) {
          console.error("Failed to fetch balances", error);
          const errorDetail = error.response?.data?.error || error.message;
          showAlert(`Failed to fetch balances: ${errorDetail}`);
        } finally {
          setIsLoadingBalances(false);
        }
      }
    };

    fetchBalances();
  }, [activeTab]);

  // Fetch expenses when switching to the expenses tab
  useEffect(() => {
    const fetchExpenses = async () => {
      if (activeTab === 'expenses') {
        setIsLoadingExpenses(true);
        try {
          const groupId = WebApp.initDataUnsafe?.start_param || -100123456789;
          const response = await axios.get(`${API_BASE_URL}/api/groups/${groupId}/expenses`);
          if (response.data && response.data.expenses) {
            setExpensesList(response.data.expenses);
          }
        } catch (error: any) {
          console.error("Failed to fetch expenses", error);
          const errorDetail = error.response?.data?.error || error.message;
          showAlert(`Failed to fetch expenses: ${errorDetail}`);
        } finally {
          setIsLoadingExpenses(false);
        }
      }
    };

    fetchExpenses();
  }, [activeTab]);

  const showAlert = (message: string) => {
    if (WebApp.platform === 'unknown') {
      window.alert(message);
    } else {
      WebApp.showAlert(message);
    }
  };

  const handleMainButtonClick = async () => {
    if (activeTab === 'add') {
      if (!amount || !description || isLoading || !paidBy || splitWith.length === 0) return;

      setIsLoading(true);
      if (WebApp.platform !== 'unknown') {
        WebApp.MainButton.showProgress();
      }

      try {
        // Send to our Node.js Backend API
        await axios.post(`${API_BASE_URL}/api/expenses`, {
          initData: WebApp.initData,
          amount: amount,
          currency: currency,
          description: description,
          groupId: WebApp.initDataUnsafe?.start_param || null,
          paidBy: paidBy,
          splitWith: splitWith
        });

        showAlert(`Successfully added ${currency} ${amount} for ${description}!`);
        setAmount('');
        setDescription('');
      } catch (error) {
        console.error("Failed to add expense", error);
        showAlert('Failed to add expense. Please try again.');
      } finally {
        setIsLoading(false);
        if (WebApp.platform !== 'unknown') {
          WebApp.MainButton.hideProgress();
        }
      }

    } else if (activeTab === 'edit') {
      if (!amount || !description || isLoading || !paidBy || splitWith.length === 0 || !editingExpenseId) return;

      setIsLoading(true);
      if (WebApp.platform !== 'unknown') {
        WebApp.MainButton.showProgress();
      }

      try {
        await axios.put(`${API_BASE_URL}/api/expenses/${editingExpenseId}`, {
          amount: amount,
          currency: currency,
          description: description,
          paidBy: paidBy,
          splitWith: splitWith
        });

        showAlert(`Successfully updated expense!`);
        setAmount('');
        setDescription('');
        setEditingExpenseId(null);
        setActiveTab('expenses');
      } catch (error) {
        console.error("Failed to update expense", error);
        showAlert('Failed to update expense. Please try again.');
      } finally {
        setIsLoading(false);
        if (WebApp.platform !== 'unknown') {
          WebApp.MainButton.hideProgress();
        }
      }
    } else {
      showAlert('Settle up functionality coming soon!');
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }
    setIsLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/expenses/${expenseId}`);
      showAlert(`Successfully deleted expense!`);
      setAmount('');
      setDescription('');
      setEditingExpenseId(null);
      setActiveTab('expenses');
    } catch (error) {
      console.error("Failed to delete expense", error);
      showAlert('Failed to delete expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    WebApp.ready();
    WebApp.MainButton.onClick(handleMainButtonClick);
    return () => {
      WebApp.MainButton.offClick(handleMainButtonClick);
    };
  }, [activeTab, amount, currency, description, paidBy, splitWith, isLoading, editingExpenseId]);

  useEffect(() => {
    if (activeTab === 'add') {
      if (amount && description && paidBy && splitWith.length > 0) {
        WebApp.MainButton.setText('Split Expense');
        WebApp.MainButton.show();
      } else {
        WebApp.MainButton.hide();
      }
    } else if (activeTab === 'edit') {
      if (amount && description && paidBy && splitWith.length > 0) {
        WebApp.MainButton.setText('Save Changes');
        WebApp.MainButton.show();
      } else {
        WebApp.MainButton.hide();
      }
    } else if (activeTab === 'balances') {
      WebApp.MainButton.setText('Settle Selected Debt');
      WebApp.MainButton.show(); // Always show to demo action
    } else {
      WebApp.MainButton.hide();
    }
  }, [activeTab, amount, description, paidBy, splitWith]);

  const currentUserId = WebApp.initDataUnsafe?.user?.id;
  let totalIOwe = 0;
  let totalOwedToMe = 0;
  balances.forEach(b => {
    if (b.fromId === currentUserId) {
      totalIOwe += b.amount;
    }
    if (b.toId === currentUserId) {
      totalOwedToMe += b.amount;
    }
  });
  const netBalance = totalOwedToMe - totalIOwe;

  return (
    <div className="min-h-screen p-4 flex flex-col gap-6">
      <header className="flex items-center gap-3">
        {WebApp.initDataUnsafe?.user?.photo_url && (
          <img
            src={WebApp.initDataUnsafe.user.photo_url}
            alt="Profile"
            className="w-10 h-10 rounded-full"
          />
        )}
        <div>
          <h1 className="text-xl font-bold">Split Money</h1>
          <p className="text-sm opacity-70">
            Hello, {WebApp.initDataUnsafe?.user?.first_name || 'Guest'}!
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] p-1 rounded-xl">
        <button
          onClick={() => { setActiveTab('add'); setEditingExpenseId(null); setAmount(''); setDescription(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'add'
              ? 'bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#000000)] shadow-sm'
              : 'text-[var(--tg-theme-text-color,#000000)] opacity-60'
          }`}
        >
          Add Expense
        </button>
        <button
          onClick={() => { setActiveTab('expenses'); setEditingExpenseId(null); setAmount(''); setDescription(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'expenses'
              ? 'bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#000000)] shadow-sm'
              : 'text-[var(--tg-theme-text-color,#000000)] opacity-60'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => { setActiveTab('balances'); setEditingExpenseId(null); setAmount(''); setDescription(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'balances'
              ? 'bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#000000)] shadow-sm'
              : 'text-[var(--tg-theme-text-color,#000000)] opacity-60'
          }`}
        >
          Balances
        </button>
      </div>

      {/* View: Add / Edit Expense */}
      {(activeTab === 'add' || activeTab === 'edit') && (
        <div className="flex flex-col gap-4 bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] p-4 rounded-xl">
          {activeTab === 'edit' && (
            <div className="flex items-center justify-between mb-2 border-b border-gray-200 dark:border-white/10 pb-2">
              <button 
                onClick={() => { setActiveTab('expenses'); setEditingExpenseId(null); setAmount(''); setDescription(''); }} 
                className="text-sm font-medium text-blue-500 flex items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                ← Back
              </button>
              <span className="text-sm font-bold opacity-80">Edit Expense</span>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1 opacity-80">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-black/20 text-lg shadow-sm"
                placeholder="0.00"
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium mb-1 opacity-80">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-2 py-3 rounded-lg border-none bg-white dark:bg-black/20 h-[52px]"
              >
                {currenciesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-black/20 text-lg shadow-sm"
              placeholder="e.g. Dinner at Mario's"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Paid By</label>
            {isLoadingMembers ? (
              <div className="opacity-60 py-2">Loading members...</div>
            ) : (
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-lg border-none bg-white dark:bg-black/20 h-[52px]"
              >
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Split With</label>
            {isLoadingMembers ? (
              <div className="opacity-60 py-2">Loading members...</div>
            ) : (
              <div className="flex flex-col gap-2">
                {members.map(m => (
                  <label key={m.id} className="flex items-center gap-3 bg-white dark:bg-black/10 p-3 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={splitWith.includes(m.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSplitWith([...splitWith, m.id]);
                        } else {
                          setSplitWith(splitWith.filter(id => id !== m.id));
                        }
                      }}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-100"
                    />
                    <span className="font-medium">{m.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {activeTab === 'edit' && editingExpenseId && (
            <button
              onClick={() => handleDeleteExpense(editingExpenseId)}
              disabled={isLoading}
              className="w-full mt-4 py-3 rounded-lg font-semibold text-white bg-red-500 hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-50 border-none cursor-pointer"
            >
              {isLoading ? 'Processing...' : 'Delete Expense'}
            </button>
          )}
        </div>
      )}

      {/* View: Recent Expenses */}
      {activeTab === 'expenses' && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold opacity-80 uppercase tracking-wide mb-1">Recent Expenses</h2>

          {isLoadingExpenses && (
            <div className="text-center py-8 opacity-60 text-sm">Loading expenses...</div>
          )}

          {!isLoadingExpenses && expensesList.length === 0 && (
            <div className="text-center py-8 opacity-60 text-sm">No expenses added yet.</div>
          )}

          {!isLoadingExpenses && expensesList.map(exp => {
            const payerName = members.find(m => m.id === exp.paidBy)?.name || 'Unknown';
            const dateStr = new Date(exp.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div 
                key={exp.id} 
                onClick={() => {
                  setEditingExpenseId(exp.id);
                  setAmount(exp.amount.toString());
                  setCurrency(exp.currency);
                  setDescription(exp.description);
                  setPaidBy(exp.paidBy);
                  setSplitWith(exp.splitWith);
                  setActiveTab('edit');
                }}
                className="flex items-center justify-between bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] p-4 rounded-xl cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all"
              >
                <div className="flex flex-col gap-1">
                  <div className="font-semibold text-base text-[var(--tg-theme-text-color,#000000)] text-left">
                    {exp.description}
                  </div>
                  <div className="text-xs opacity-60 text-left">
                    Paid by {payerName} • {dateStr}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="font-bold text-lg text-[var(--tg-theme-text-color,#000000)]">
                    {exp.currency} {Number(exp.amount).toFixed(2)}
                  </div>
                  <div className="text-xs opacity-60">
                    {exp.splitWith.length} split
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View: Balances */}
      {activeTab === 'balances' && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold opacity-80 uppercase tracking-wide mb-1">Debts to Settle</h2>

          {isLoadingBalances && (
            <div className="text-center py-8 opacity-60 text-sm">Loading balances calculated by algorithm...</div>
          )}

          {!isLoadingBalances && balances.length === 0 && (
            <div className="text-center py-8 opacity-60 text-sm">Everyone is settled up! Zero pending debts.</div>
          )}

          {!isLoadingBalances && balances.map(balance => (
            <div key={balance.id} className="flex items-center justify-between bg-[var(--tg-theme-secondary-bg-color,#f4f4f5)] p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div>
                  <div className="font-medium text-sm">
                    {balance.from} <span className="opacity-60 font-normal">owes</span> {balance.to}
                  </div>
                </div>
              </div>
              <div className="font-bold text-lg">
                ${balance.amount.toFixed(2)}
              </div>
            </div>
          ))}

          {!isLoadingBalances && balances.length > 0 && (
            <div className="mt-2 p-4 bg-green-500/10 rounded-xl flex items-center gap-3 text-green-700 dark:text-green-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              <div className="text-sm text-left font-medium">
                {netBalance > 0 && `You are owed a total of SGD ${netBalance.toFixed(2)}`}
                {netBalance < 0 && `You owe a total of SGD ${Math.abs(netBalance).toFixed(2)}`}
                {netBalance === 0 && `You are settled up, but there are other group debts.`}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback Button for Local Testing Outside of Telegram */}
      {WebApp.platform === 'unknown' && (
        <button
          onClick={handleMainButtonClick}
          className={`w-full py-3 rounded-xl font-bold text-white mb-2 transition-opacity border-none cursor-pointer ${(activeTab === 'add' || activeTab === 'edit') && (!amount || !description || isLoading || !paidBy || splitWith.length === 0)
            ? 'bg-blue-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
            }`}
        >
          {isLoading
            ? 'Processing...'
            : activeTab === 'add'
              ? 'Split Expense'
              : activeTab === 'edit'
                ? 'Save Changes'
                : 'Settle Selected Debt'
          }
        </button>
      )}

      <div className="mt-auto opacity-70 text-xs text-center pb-4">
        This app uses Telegram's native theme colors.
      </div>
    </div>
  )
}

export default App
