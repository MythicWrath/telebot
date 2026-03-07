import { simplifyDebts } from './debtAlgorithm';

// Test Case 1: Simple Chain
// A owes B $10, B owes C $10
// Result should be: A owes C $10
console.log("--- Test Case 1: Simple Chain ---");
const debts1 = [
    { from: 'A', to: 'B', amount: 10 },
    { from: 'B', to: 'C', amount: 10 }
];
console.log("Original:", debts1);
console.log("Simplified:", simplifyDebts(debts1));

// Test Case 2: Circle
// A owes B 10, B owes C 10, C owes A 10
// Result should be: No debts!
console.log("\n--- Test Case 2: Circle ---");
const debts2 = [
    { from: 'A', to: 'B', amount: 10 },
    { from: 'B', to: 'C', amount: 10 },
    { from: 'C', to: 'A', amount: 10 }
];
console.log("Original:", debts2);
console.log("Simplified:", simplifyDebts(debts2));

// Test Case 3: One person paid for everyone (Common Scenario)
// A paid $30 for A, B, C. 
// B owes A $10, C owes A $10
console.log("\n--- Test Case 3: One paid for all ---");
const debts3 = [
    { from: 'B', to: 'A', amount: 10 },
    { from: 'C', to: 'A', amount: 10 }
];
console.log("Original:", debts3);
console.log("Simplified:", simplifyDebts(debts3));

// Test Case 4: Complex multi-way unbalanced
// A owes B 50
// B owes C 30
// C owes A 20
// D owes B 10
// Net:
// A: -50 + 20 = -30
// B: +50 - 30 + 10 = +30
// C: +30 - 20 = +10
// D: -10 = -10
// Simplified should be A owes B 30, D owes C 10 (or similar optimal)
console.log("\n--- Test Case 4: Complex ---");
const debts4 = [
    { from: 'A', to: 'B', amount: 50 },
    { from: 'B', to: 'C', amount: 30 },
    { from: 'C', to: 'A', amount: 20 },
    { from: 'D', to: 'B', amount: 10 }
];
console.log("Original:", debts4);
console.log("Simplified:", simplifyDebts(debts4));
