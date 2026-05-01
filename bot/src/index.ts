import { Telegraf } from 'telegraf';
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { supabase } from './db';

// Load .env from the root of the project
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
}

const bot = new Telegraf(botToken);
const app = express();

app.use(cors());
app.use(express.json());

const isDev = process.env.NODE_ENV !== 'production';

async function seedMockData() {
    if (!isDev) return;
    try {
        const targetGroupId = -100123456789;

        await supabase.from('groups').upsert({
            chat_id: targetGroupId,
            title: 'Mock Dev Group'
        });

        const { data: testUser } = await supabase.from('users').select('telegram_id').limit(1).single();
        let testUserId = testUser?.telegram_id;

        if (!testUserId) {
            testUserId = 111111111;
            await supabase.from('users').upsert({
                telegram_id: testUserId,
                first_name: 'TestUser1',
                username: 'test_user_1',
                language_code: 'en'
            });
        }

        await supabase.from('group_members').upsert({
            group_id: targetGroupId,
            user_id: testUserId
        });

        const mockUser2Id = 999999999;
        await supabase.from('users').upsert({
            telegram_id: mockUser2Id,
            first_name: 'TestFriend',
            username: 'test_friend_bot_mock',
            language_code: 'en'
        });
        await supabase.from('group_members').upsert({
            group_id: targetGroupId,
            user_id: mockUser2Id
        });
        console.log("Mock data seeded for dev environment.");
    } catch (e) {
        console.error("Error seeding mock data:", e);
    }
}

if (isDev) {
    seedMockData();
}

bot.start(async (ctx) => {
    const user = ctx.from;
    if (!user) return;

    // Track the user in DB
    await supabase.from('users').upsert({
        telegram_id: user.id,
        first_name: user.first_name,
        username: user.username,
        language_code: user.language_code
    });

    ctx.reply(`Welcome ${user.first_name}! I am a bot to help you split expenses. Add me to a group chat!`);
});

bot.help((ctx) => {
    ctx.reply('To use me, add me to a group chat and use the /split command or open the Mini App.');
});

// Middleware for tracking groups
bot.on('message', async (ctx, next) => {
    const chat = ctx.chat;
    const user = ctx.from;

    if (chat && (chat.type === 'group' || chat.type === 'supergroup')) {
        await supabase.from('groups').upsert({
            chat_id: chat.id,
            title: chat.title || 'Unknown Group'
        });

        if (user) {
            await supabase.from('users').upsert({
                telegram_id: user.id,
                first_name: user.first_name,
                username: user.username,
                language_code: user.language_code
            });

            await supabase.from('group_members').upsert({
                group_id: chat.id,
                user_id: user.id
            });
        }
    }

    return next();
});

// API endpoint for fetching group members
app.get('/api/groups/:groupId/members', async (req, res) => {
    try {
        const groupId = req.params.groupId;

        const { data: groupMembers, error: membersError } = await supabase
            .from('group_members')
            .select(`
                user_id,
                users ( first_name )
            `)
            .eq('group_id', groupId);

        if (membersError) throw membersError;

        const members = groupMembers.map(m => {
            const userRef = m.users as any;
            return {
                id: m.user_id,
                name: Array.isArray(userRef) ? userRef[0]?.first_name : userRef?.first_name || 'Unknown'
            };
        });

        res.json({ members });
    } catch (error: any) {
        console.error('Failed to fetch members:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint for the React Mini App
app.post('/api/expenses', async (req, res) => {
    try {
        const { initData, amount, currency, description, groupId, paidBy, splitWith } = req.body;

        // TODO(Production): We MUST validate `initData` hash using our TELEGRAM_BOT_TOKEN
        // For now, we assume frontend validation or extract mock data.

        let targetGroupId = groupId;
        let actualPaidBy = paidBy;

        if (process.env.NODE_ENV !== 'production') {
            targetGroupId = groupId || -100123456789;
            if (!actualPaidBy) {
                const { data: testUser } = await supabase.from('users').select('telegram_id').limit(1).single();
                actualPaidBy = testUser?.telegram_id || 111111111;
            }
        } else {
            // TODO(Production): Extract accurate group ID and user ID from `initData` payload instead of mocked IDs
            // return res.status(501).json({ error: 'Production initData validation is not yet implemented' });
        }

        if (!targetGroupId || !actualPaidBy) {
            return res.status(400).json({ error: 'Missing group ID or User ID' });
        }

        // Insert Expense
        const { data: expense, error: expenseError } = await supabase
            .from('expenses')
            .insert({
                group_id: targetGroupId,
                paid_by: actualPaidBy,
                amount: parseFloat(amount),
                currency: currency || 'SGD',
                description: description
            })
            .select()
            .single();

        if (expenseError) throw expenseError;

        // Insert expense splits
        const splitsToInsert = [];
        if (splitWith && Array.isArray(splitWith) && splitWith.length > 0) {
            const splitAmount = parseFloat(amount) / splitWith.length;
            for (const userId of splitWith) {
                splitsToInsert.push({
                    expense_id: expense.id,
                    user_id: userId,
                    amount_owed: splitAmount
                });
            }
        } else {
            // Default evenly across group
            const { data: groupMembers } = await supabase
                .from('group_members')
                .select('user_id')
                .eq('group_id', targetGroupId);

            if (groupMembers && groupMembers.length > 0) {
                const splitAmount = parseFloat(amount) / groupMembers.length;
                for (const member of groupMembers) {
                    splitsToInsert.push({
                        expense_id: expense.id,
                        user_id: member.user_id,
                        amount_owed: splitAmount
                    });
                }
            }
        }

        if (splitsToInsert.length > 0) {
            const { error: splitsError } = await supabase.from('expense_splits').insert(splitsToInsert);
            if (splitsError) throw splitsError;
        }

        // Optional: Notify the Telegram group that an expense was added
        try {
            await bot.telegram.sendMessage(
                targetGroupId,
                `New Expense Added: ${currency || 'SGD'} ${amount} for "${description}"`
            );
        } catch (e) {
            console.log('Could not send telegram message (is bot in the group?):', e);
        }

        res.json({ success: true, expense });

    } catch (error: any) {
        console.error('Failed to insert expense:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint for settling debts
app.post('/api/settlements', async (req, res) => {
    try {
        const { groupId, paidBy, paidTo, amount, currency } = req.body;

        if (!groupId || !paidBy || !paidTo || !amount) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data: settlement, error: settlementError } = await supabase
            .from('settlements')
            .insert({
                group_id: groupId,
                paid_by: paidBy,
                paid_to: paidTo,
                amount: parseFloat(amount),
                currency: currency || 'SGD'
            })
            .select()
            .single();

        if (settlementError) throw settlementError;

        try {
            await bot.telegram.sendMessage(
                groupId,
                `Debt Settled: ${currency || 'SGD'} ${amount} paid.`
            );
        } catch (e) {
            console.log('Could not send telegram message:', e);
        }

        res.json({ success: true, settlement });
    } catch (error: any) {
        console.error('Failed to insert settlement:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint for getting group balances
app.get('/api/groups/:groupId/balances', async (req, res) => {
    try {
        const groupId = req.params.groupId;

        // 1. Fetch all expenses for this group
        const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select(`
                id,
                amount,
                currency,
                paid_by
            `)
            .eq('group_id', groupId);

        if (expensesError) throw expensesError;

        const expenseIds = expenses.map((e: any) => e.id);

        // 2. Fetch all expense_splits for this group's expenses
        let expenseSplits: any[] = [];
        if (expenseIds.length > 0) {
            const { data: splits, error: splitsError } = await supabase
                .from('expense_splits')
                .select('expense_id, user_id, amount_owed')
                .in('expense_id', expenseIds);

            if (splitsError) throw splitsError;
            expenseSplits = splits || [];
        }

        // Fetch all settlements for this group
        const { data: settlements, error: settlementsError } = await supabase
            .from('settlements')
            .select(`
                id,
                amount,
                currency,
                paid_by,
                paid_to
            `)
            .eq('group_id', groupId);

        if (settlementsError) throw settlementsError;

        // Fetch group members to map user IDs to names for UI
        const { data: groupMembers, error: membersError } = await supabase
            .from('group_members')
            .select(`
                user_id,
                users ( first_name )
            `)
            .eq('group_id', groupId);

        if (membersError) throw membersError;

        const userNames: Record<string, string> = {};
        groupMembers.forEach(m => {
            const userRef = m.users as any;
            if (userRef) {
                userNames[m.user_id] = Array.isArray(userRef)
                    ? userRef[0]?.first_name
                    : userRef.first_name || 'Unknown';
            }
        });

        if (groupMembers.length === 0) {
            return res.json({ balances: [] });
        }

        // 3. Fetch current exchange rates
        const { getExchangeRates, convertCurrency } = require('./currencies');
        const rates = await getExchangeRates();

        // 4. Reconstruct the raw debts
        const rawDebts: { from: string, to: string, amount: number }[] = [];

        for (const expense of expenses) {
            if (!expense.amount) continue;

            const expenseCurrency = expense.currency || 'SGD';
            const splits = expenseSplits.filter(s => s.expense_id === expense.id);

            for (const split of splits) {
                // If the member is not the one who paid, they owe the payer
                if (split.user_id !== expense.paid_by) {
                    const amountInBaseCurrency = convertCurrency(
                        split.amount_owed,
                        expenseCurrency,
                        'SGD',
                        rates
                    );
                    rawDebts.push({
                        from: split.user_id,
                        to: expense.paid_by,
                        amount: amountInBaseCurrency
                    });
                }
            }
        }

        // Include settlements as reverse debts
        for (const settlement of settlements || []) {
            if (!settlement.amount) continue;

            const settlementCurrency = settlement.currency || 'SGD';
            const amountInBaseCurrency = convertCurrency(
                settlement.amount,
                settlementCurrency,
                'SGD',
                rates
            );

            // A settlement from A to B means B now effectively "owes" A in the algorithm to cancel out the original debt.
            rawDebts.push({
                from: settlement.paid_to,
                to: settlement.paid_by,
                amount: amountInBaseCurrency
            });
        }

        // 5. Simplify the unified debts
        const { simplifyDebts } = require('./debtAlgorithm');
        const optimizedDebts = simplifyDebts(rawDebts);

        // 6. Map back to human readable names
        const humanReadableDebts = optimizedDebts.map((d: any, index: number) => ({
            id: index,
            from: userNames[d.from] || d.from,
            to: userNames[d.to] || d.to,
            amount: d.amount,
            currency: 'SGD' // The output is currently normalized to SGD
        }));

        res.json({ balances: humanReadableDebts });

    } catch (error: any) {
        console.error('Failed to fetch balances:', error);
        res.status(500).json({ error: error.message });
    }
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend API running on http://localhost:${PORT}`);
    bot.launch().then(() => {
        console.log('Bot started successfully!');
    });
});
