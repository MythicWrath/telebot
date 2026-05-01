import { supabase } from './db';
import axios from 'axios';

async function runE2ETest() {
    console.log("--- Starting E2E Test ---");
    const groupId = -100123456789;

    // We will use axios to hit the local server. Ensure the server is running.
    // If not, we could just call the supabase client directly to mock the API behavior.
    
    console.log("1. Add expenses");
    // Expense 1: User 111111111 pays 30 for both
    const res1 = await axios.post('http://localhost:3000/api/expenses', {
        groupId,
        amount: 30,
        currency: 'SGD',
        description: 'Lunch',
        paidBy: 111111111,
        splitWith: [111111111, 999999999]
    });
    console.log("Expense 1 added:", res1.data.success);

    // Expense 2: User 999999999 pays 10 for User 111111111
    const res2 = await axios.post('http://localhost:3000/api/expenses', {
        groupId,
        amount: 10,
        currency: 'SGD',
        description: 'Coffee',
        paidBy: 999999999,
        splitWith: [111111111]
    });
    console.log("Expense 2 added:", res2.data.success);

    console.log("\n2 & 3. Calculate split and simplify debt");
    const resBalances = await axios.get(`http://localhost:3000/api/groups/${groupId}/balances`);
    console.log("Current Balances:", resBalances.data.balances);

    console.log("\n4. Settle up (Paying the debt)");
    // To settle up without a specific endpoint, we can add an expense where the debtor pays the creditor directly.
    // E.g., User 999999999 owes User 111111111 $5.
    const resSettle = await axios.post('http://localhost:3000/api/settlements', {
        groupId,
        amount: 5,
        currency: 'SGD',
        paidBy: 999999999,
        paidTo: 111111111
    });
    console.log("Settlement added:", resSettle.data.success);

    const resBalancesAfter = await axios.get(`http://localhost:3000/api/groups/${groupId}/balances`);
    console.log("Balances after settlement:", resBalancesAfter.data.balances);

    console.log("\n--- E2E Test Finished ---");
}

runE2ETest().catch(console.error);
