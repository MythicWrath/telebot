import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import './index.css'

function App() {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    // Notify Telegram that the app is ready to be displayed
    WebApp.ready();

    // Enable the Main Button for submission
    WebApp.MainButton.setText('Split Expense');

    const handleMainButtonClick = () => {
      // Handle the submit logic here. Send data to your bot backend
      WebApp.showAlert(`Expense added: ${amount} for ${description}`);
      // WebApp.close(); 
    };

    WebApp.MainButton.onClick(handleMainButtonClick);

    return () => {
      WebApp.MainButton.offClick(handleMainButtonClick);
    };
  }, [amount, description]);

  // Show or hide main button based on input validity
  useEffect(() => {
    if (amount && description) {
      WebApp.MainButton.show();
    } else {
      WebApp.MainButton.hide();
    }
  }, [amount, description]);

  return (
    <div className="min-h-screen p-4 flex flex-col gap-6">
      <header className="flex items-center gap-3 mb-4">
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

      <div className="flex flex-col gap-4 bg-black/5 p-4 rounded-xl">
        <div>
          <label className="block text-sm font-medium mb-1 opacity-80">Amount ($)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-black/20 text-lg shadow-sm"
            placeholder="0.00"
          />
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
      </div>

      <div className="mt-4 opacity-70 text-sm text-center">
        This app uses Telegram's native theme colors.
      </div>
    </div>
  )
}

export default App
