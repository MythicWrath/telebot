import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import axios from 'axios'
import './index.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

// Automatically attach Telegram Web App initData as header for backend verification
if (WebApp.initData) {
  axios.defaults.headers.common['x-telegram-init-data'] = WebApp.initData;
}

interface ExpenseSplit {
  userId: number;
  amountOwed: number;
}

interface Expense {
  id: string;
  amount: number;
  currency: string;
  description: string;
  paidBy: number;
  date: string;
  splitWith: number[];
  splits?: ExpenseSplit[];
}

function App() {
  const [activeTab, setActiveTab] = useState<'add' | 'expenses' | 'balances' | 'edit'>('add')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [description, setDescription] = useState('')
  const [paidBy, setPaidBy] = useState<number | ''>('')
  const [splitWith, setSplitWith] = useState<number[]>([])
  const [splitType, setSplitType] = useState<'EQUAL' | 'EXACT' | 'PERCENTAGE'>('EQUAL')
  const [splitValues, setSplitValues] = useState<Record<number, string>>({})
  const [currenciesList, setCurrenciesList] = useState<string[]>(['SGD', 'USD', 'EUR', 'GBP'])

  const [isLoading, setIsLoading] = useState(false)

  const [members, setMembers] = useState<{ id: number, name: string }[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  const [balances, setBalances] = useState<{ id: number, from: string, fromId: number, to: string, toId: number, amount: number, currency: string }[]>([])
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)

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

  const resetForm = () => {
    setEditingExpenseId(null);
    setAmount('');
    setDescription('');
    setSplitType('EQUAL');
    setSplitValues({});
  };

  // Dynamic split calculations
  const checkedMembers = members.filter(m => splitWith.includes(m.id));
  const totalAmountNum = parseFloat(amount) || 0;

  // Exact split calculations
  const enteredExactSum = checkedMembers.reduce((sum, m) => {
    const val = parseFloat(splitValues[m.id]);
    return sum + (!isNaN(val) && val >= 0 ? val : 0);
  }, 0);
  const blankExactCount = checkedMembers.filter(
    m => splitValues[m.id] === undefined || splitValues[m.id].trim() === ''
  ).length;
  const remainingExact = Math.max(0, totalAmountNum - enteredExactSum);
  const placeholderExact =
    blankExactCount > 0 ? (remainingExact / blankExactCount).toFixed(2) : '0.00';

  // Percentage split calculations
  const enteredPctSum = checkedMembers.reduce((sum, m) => {
    const val = parseFloat(splitValues[m.id]);
    return sum + (!isNaN(val) && val >= 0 ? val : 0);
  }, 0);
  const blankPctCount = checkedMembers.filter(
    m => splitValues[m.id] === undefined || splitValues[m.id].trim() === ''
  ).length;
  const remainingPct = Math.max(0, 100 - enteredPctSum);
  const placeholderPct =
    blankPctCount > 0 ? (remainingPct / blankPctCount).toFixed(1) : '0';

  // Helper for computing final splits payload
  const computeFinalSplits = (): { userId: number; amountOwed: number }[] => {
    if (checkedMembers.length === 0) return [];

    if (splitType === 'EQUAL') {
      const equalShare = totalAmountNum / checkedMembers.length;
      return checkedMembers.map(m => ({ userId: m.id, amountOwed: equalShare }));
    }

    if (splitType === 'EXACT') {
      return checkedMembers.map(m => {
        const valStr = splitValues[m.id];
        if (valStr !== undefined && valStr.trim() !== '' && !isNaN(parseFloat(valStr))) {
          return { userId: m.id, amountOwed: parseFloat(valStr) };
        } else {
          return {
            userId: m.id,
            amountOwed: blankExactCount > 0 ? remainingExact / blankExactCount : 0
          };
        }
      });
    }

    if (splitType === 'PERCENTAGE') {
      return checkedMembers.map(m => {
        const valStr = splitValues[m.id];
        let pct = 0;
        if (valStr !== undefined && valStr.trim() !== '' && !isNaN(parseFloat(valStr))) {
          pct = parseFloat(valStr);
        } else {
          pct = blankPctCount > 0 ? remainingPct / blankPctCount : 0;
        }
        return { userId: m.id, amountOwed: (totalAmountNum * pct) / 100 };
      });
    }

    return [];
  };

  // Form validation function
  const isFormValid = (): boolean => {
    if (!amount || isNaN(totalAmountNum) || totalAmountNum <= 0 || !description.trim() || isLoading || !paidBy || splitWith.length === 0) {
      return false;
    }

    if (splitType === 'EXACT') {
      if (enteredExactSum > totalAmountNum + 0.01) return false;
      if (blankExactCount === 0 && Math.abs(enteredExactSum - totalAmountNum) > 0.01) return false;
      for (const m of checkedMembers) {
        const valStr = splitValues[m.id];
        if (valStr !== undefined && valStr.trim() !== '') {
          const val = parseFloat(valStr);
          if (isNaN(val) || val < 0) return false;
        }
      }
    } else if (splitType === 'PERCENTAGE') {
      if (enteredPctSum > 100.01) return false;
      if (blankPctCount === 0 && Math.abs(enteredPctSum - 100) > 0.01) return false;
      for (const m of checkedMembers) {
        const valStr = splitValues[m.id];
        if (valStr !== undefined && valStr.trim() !== '') {
          const val = parseFloat(valStr);
          if (isNaN(val) || val < 0) return false;
        }
      }
    }

    return true;
  };

  const handleMainButtonClick = async () => {
    if (!isFormValid()) return;
    const finalSplits = computeFinalSplits();

    if (activeTab === 'add') {
      setIsLoading(true);
      if (WebApp.platform !== 'unknown') {
        WebApp.MainButton.showProgress();
      }

      try {
        await axios.post(`${API_BASE_URL}/api/expenses`, {
          initData: WebApp.initData,
          amount: amount,
          currency: currency,
          description: description,
          groupId: WebApp.initDataUnsafe?.start_param || null,
          paidBy: paidBy,
          splitWith: splitWith,
          splits: finalSplits
        });

        showAlert(`Successfully added ${currency} ${amount} for ${description}!`);
        resetForm();
      } catch (error: any) {
        console.error("Failed to add expense", error);
        const errorDetail = error.response?.data?.error || error.message;
        showAlert(`Failed to add expense: ${errorDetail}`);
      } finally {
        setIsLoading(false);
        if (WebApp.platform !== 'unknown') {
          WebApp.MainButton.hideProgress();
        }
      }

    } else if (activeTab === 'edit') {
      if (!editingExpenseId) return;

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
          splitWith: splitWith,
          splits: finalSplits
        });

        showAlert(`Successfully updated expense!`);
        resetForm();
        setActiveTab('expenses');
      } catch (error: any) {
        console.error("Failed to update expense", error);
        const errorDetail = error.response?.data?.error || error.message;
        showAlert(`Failed to update expense: ${errorDetail}`);
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
      resetForm();
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
  }, [activeTab, amount, currency, description, paidBy, splitWith, splitType, splitValues, isLoading, editingExpenseId]);

  useEffect(() => {
    if (activeTab === 'add' || activeTab === 'edit') {
      if (isFormValid()) {
        WebApp.MainButton.setText(activeTab === 'add' ? 'Split Expense' : 'Save Changes');
        WebApp.MainButton.show();
      } else {
        WebApp.MainButton.hide();
      }
    } else if (activeTab === 'balances') {
      WebApp.MainButton.setText('Settle Selected Debt');
      WebApp.MainButton.show();
    } else {
      WebApp.MainButton.hide();
    }
  }, [activeTab, amount, description, paidBy, splitWith, splitType, splitValues]);

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
          onClick={() => { setActiveTab('add'); resetForm(); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'add'
              ? 'bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#000000)] shadow-sm'
              : 'text-[var(--tg-theme-text-color,#000000)] opacity-60'
          }`}
        >
          Add Expense
        </button>
        <button
          onClick={() => { setActiveTab('expenses'); resetForm(); }}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'expenses'
              ? 'bg-[var(--tg-theme-bg-color,#ffffff)] text-[var(--tg-theme-text-color,#000000)] shadow-sm'
              : 'text-[var(--tg-theme-text-color,#000000)] opacity-60'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => { setActiveTab('balances'); resetForm(); }}
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
                onClick={() => { setActiveTab('expenses'); resetForm(); }} 
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

          {/* Split Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-1 opacity-80">Split Type</label>
            <div className="flex bg-white dark:bg-black/20 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setSplitType('EQUAL')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors border-none cursor-pointer ${
                  splitType === 'EQUAL'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-transparent text-[var(--tg-theme-text-color,#000000)] opacity-70'
                }`}
              >
                Equal (=)
              </button>
              <button
                type="button"
                onClick={() => setSplitType('EXACT')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors border-none cursor-pointer ${
                  splitType === 'EXACT'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-transparent text-[var(--tg-theme-text-color,#000000)] opacity-70'
                }`}
              >
                Exact ({currency})
              </button>
              <button
                type="button"
                onClick={() => setSplitType('PERCENTAGE')}
                className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors border-none cursor-pointer ${
                  splitType === 'PERCENTAGE'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-transparent text-[var(--tg-theme-text-color,#000000)] opacity-70'
                }`}
              >
                Percentage (%)
              </button>
            </div>
            {splitType !== 'EQUAL' && (
              <p className="text-xs opacity-60 mt-1 italic">
                Leave fields blank to split the remaining amount equally.
              </p>
            )}
          </div>

          {/* Members Split With List */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium opacity-80">Split With</label>
              {splitType === 'EXACT' && totalAmountNum > 0 && (
                <span className={`text-xs font-medium ${enteredExactSum > totalAmountNum + 0.01 ? 'text-red-500' : 'opacity-70'}`}>
                  {enteredExactSum > totalAmountNum + 0.01
                    ? `Over allocated: ${currency} ${enteredExactSum.toFixed(2)} / ${totalAmountNum.toFixed(2)}`
                    : `Remaining: ${currency} ${remainingExact.toFixed(2)}`}
                </span>
              )}
              {splitType === 'PERCENTAGE' && (
                <span className={`text-xs font-medium ${enteredPctSum > 100.01 ? 'text-red-500' : 'opacity-70'}`}>
                  {enteredPctSum > 100.01
                    ? `Over 100%: ${enteredPctSum.toFixed(1)}%`
                    : `Remaining: ${remainingPct.toFixed(1)}%`}
                </span>
              )}
            </div>

            {isLoadingMembers ? (
              <div className="opacity-60 py-2">Loading members...</div>
            ) : (
              <div className="flex flex-col gap-2">
                {members.map(m => {
                  const isChecked = splitWith.includes(m.id);
                  return (
                    <div key={m.id} className="flex items-center justify-between bg-white dark:bg-black/10 p-3 rounded-lg gap-2">
                      <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSplitWith([...splitWith, m.id]);
                            } else {
                              setSplitWith(splitWith.filter(id => id !== m.id));
                              const newVals = { ...splitValues };
                              delete newVals[m.id];
                              setSplitValues(newVals);
                            }
                          }}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-100"
                        />
                        <span className="font-medium truncate text-sm">{m.name}</span>
                      </label>

                      {isChecked && splitType === 'EXACT' && (
                        <div className="flex items-center gap-1 w-32 shrink-0">
                          <span className="text-xs opacity-60 font-semibold">{currency}</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={splitValues[m.id] ?? ''}
                            onChange={(e) => setSplitValues({ ...splitValues, [m.id]: e.target.value })}
                            placeholder={placeholderExact}
                            className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-white/10 bg-transparent text-right text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      )}

                      {isChecked && splitType === 'PERCENTAGE' && (
                        <div className="flex items-center gap-1 w-28 shrink-0">
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={splitValues[m.id] ?? ''}
                            onChange={(e) => setSplitValues({ ...splitValues, [m.id]: e.target.value })}
                            placeholder={`${placeholderPct}%`}
                            className="w-full px-2 py-1.5 rounded border border-gray-200 dark:border-white/10 bg-transparent text-right text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <span className="text-xs opacity-60 font-semibold">%</span>
                        </div>
                      )}
                    </div>
                  );
                })}
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

                  if (exp.splits && exp.splits.length > 0) {
                    const amounts = exp.splits.map(s => s.amountOwed);
                    const maxAmount = Math.max(...amounts);
                    const minAmount = Math.min(...amounts);
                    if (maxAmount - minAmount <= 0.02) {
                      setSplitType('EQUAL');
                      setSplitValues({});
                    } else {
                      setSplitType('EXACT');
                      const valMap: Record<number, string> = {};
                      exp.splits.forEach(s => {
                        valMap[s.userId] = s.amountOwed.toString();
                      });
                      setSplitValues(valMap);
                    }
                  } else {
                    setSplitType('EQUAL');
                    setSplitValues({});
                  }

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
          disabled={!isFormValid() && (activeTab === 'add' || activeTab === 'edit')}
          className={`w-full py-3 rounded-xl font-bold text-white mb-2 transition-opacity border-none cursor-pointer ${(activeTab === 'add' || activeTab === 'edit') && !isFormValid()
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
