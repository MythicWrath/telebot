export interface Debt {
    from: string;
    to: string;
    amount: number;
}

export interface BalanceMap {
    [userId: string]: number;
}

/**
 * Simplifies a list of debts into the minimum number of transactions.
 * Uses a greedy approach to settle the largest debtors with the largest creditors.
 */
export function simplifyDebts(debts: Debt[]): Debt[] {
    // 1. Calculate net balances for each person
    const balances: BalanceMap = {};

    for (const debt of debts) {
        if (!balances[debt.from]) balances[debt.from] = 0;
        if (!balances[debt.to]) balances[debt.to] = 0;

        balances[debt.from] -= debt.amount; // Person who owes money has negative balance
        balances[debt.to] += debt.amount;   // Person who is owed money has positive balance
    }

    // 2. Separate into debtors (negative balance) and creditors (positive balance)
    const debtors: { userId: string, amount: number }[] = [];
    const creditors: { userId: string, amount: number }[] = [];

    for (const [userId, amount] of Object.entries(balances)) {
        // Round to 2 decimal places to avoid floating point issues
        const roundedAmount = Math.round(amount * 100) / 100;

        if (roundedAmount < 0) {
            debtors.push({ userId, amount: Math.abs(roundedAmount) });
        } else if (roundedAmount > 0) {
            creditors.push({ userId, amount: roundedAmount });
        }
    }

    // 3. Sort both lists descending by amount so we settle biggest debts first (greedy)
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    // 4. Resolve debts
    const optimizedDebts: Debt[] = [];
    let d = 0; // debtor index
    let c = 0; // creditor index

    while (d < debtors.length && c < creditors.length) {
        const debtor = debtors[d];
        const creditor = creditors[c];

        // Find the maximum amount we can settle between these two
        const settleAmount = Math.min(debtor.amount, creditor.amount);

        // Record the transaction
        optimizedDebts.push({
            from: debtor.userId,
            to: creditor.userId,
            amount: Math.round(settleAmount * 100) / 100
        });

        // Deduct the settled amount
        debtor.amount = Math.round((debtor.amount - settleAmount) * 100) / 100;
        creditor.amount = Math.round((creditor.amount - settleAmount) * 100) / 100;

        // Move to next person if their balance is fully settled
        if (debtor.amount === 0) d++;
        if (creditor.amount === 0) c++;
    }

    return optimizedDebts;
}
