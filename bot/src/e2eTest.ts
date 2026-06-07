import axios from 'axios';

async function runE2ETest() {
    console.log("--- Starting E2E Test ---");
    const groupId = -100123456789;

    // Fetch members dynamically
    const resMembers = await axios.get(`http://localhost:3000/api/groups/${groupId}/members`);
    const members = resMembers.data.members;
    console.log(`Fetched ${members.length} group members.`);
    if (members.length < 2) {
        throw new Error("Not enough members in the group for E2E test. Expected at least 2.");
    }

    const user1Id = members[0].id;
    const user2Id = members[1].id;
    console.log(`Using User 1: ${members[0].name} (${user1Id})`);
    console.log(`Using User 2: ${members[1].name} (${user2Id})`);

    console.log("\n1. Add expenses");
    // Expense 1: User 1 pays 30 for both
    const res1 = await axios.post('http://localhost:3000/api/expenses', {
        groupId,
        amount: 30,
        currency: 'SGD',
        description: 'Lunch',
        paidBy: user1Id,
        splitWith: [user1Id, user2Id]
    });
    console.log("Expense 1 added:", res1.data.success);
    const expenseId = res1.data.expense.id;

    // Expense 2: User 2 pays 10 for User 1
    const res2 = await axios.post('http://localhost:3000/api/expenses', {
        groupId,
        amount: 10,
        currency: 'SGD',
        description: 'Coffee',
        paidBy: user2Id,
        splitWith: [user1Id]
    });
    console.log("Expense 2 added:", res2.data.success);

    console.log("\n2 & 3. Calculate split and simplify debt");
    let resBalances = await axios.get(`http://localhost:3000/api/groups/${groupId}/balances`);
    console.log("Current Balances:", resBalances.data.balances);

    console.log("\n4. Get Recent Expenses List");
    const resExpenses = await axios.get(`http://localhost:3000/api/groups/${groupId}/expenses`);
    console.log("Expenses List:", resExpenses.data.expenses);

    console.log("\n5. Update Expense 1 (Change amount from 30 to 40, change description)");
    const resUpdate = await axios.put(`http://localhost:3000/api/expenses/${expenseId}`, {
        amount: 40,
        currency: 'SGD',
        description: 'Fancy Lunch',
        paidBy: user1Id,
        splitWith: [user1Id, user2Id]
    });
    console.log("Expense 1 updated:", resUpdate.data.success);

    resBalances = await axios.get(`http://localhost:3000/api/groups/${groupId}/balances`);
    console.log("Balances after update (should reflect 40 SGD instead of 30):", resBalances.data.balances);

    console.log("\n6. Delete Expense 1");
    const resDelete = await axios.delete(`http://localhost:3000/api/expenses/${expenseId}`);
    console.log("Expense 1 deleted:", resDelete.data.success);

    resBalances = await axios.get(`http://localhost:3000/api/groups/${groupId}/balances`);
    console.log("Balances after delete (should only reflect Expense 2):", resBalances.data.balances);

    console.log("\n--- E2E Test Finished ---");
}

runE2ETest().catch(console.error);
