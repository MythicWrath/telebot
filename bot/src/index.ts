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

// API endpoint for the React Mini App
app.post('/api/expenses', async (req, res) => {
    try {
        const { initData, amount, description, groupId } = req.body;

        const isDev = process.env.NODE_ENV !== 'production';
        console.log("isDevsdf", isDev)

        // TODO(Production): We MUST validate `initData` hash using our TELEGRAM_BOT_TOKEN
        // For now, we assume frontend validation or extract mock data.

        let targetGroupId;
        let testUserId;

        if (isDev) {
            // Using a mock group ID for local testing if the user doesn't pass one from the app
            targetGroupId = groupId || -100123456789;

            // For testing, just take the first user in the DB.
            const { data: testUser } = await supabase.from('users').select('telegram_id').limit(1).single();

            if (!testUser) {
                return res.status(400).json({ error: 'No user found' });
            }
            testUserId = testUser.telegram_id;

            // For local dev, make sure the group exists so we don't violate the foreign key constraint
            await supabase.from('groups').upsert({
                chat_id: targetGroupId,
                title: 'Mock Dev Group'
            });

            // Make sure the primary test user is in this group
            await supabase.from('group_members').upsert({
                group_id: targetGroupId,
                user_id: testUserId
            });

            // Upsert a second mock user and link them so we can actually test splitting debt!
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

        } else {
            // TODO(Production): Extract accurate group ID and user ID from `initData` payload instead of mocked IDs
            return res.status(501).json({ error: 'Production initData validation is not yet implemented' });
        }

        // Insert Expense
        const { data: expense, error: expenseError } = await supabase
            .from('expenses')
            .insert({
                group_id: targetGroupId,
                paid_by: testUserId,
                amount: parseFloat(amount),
                currency: 'USD',
                description: description
            })
            .select()
            .single();

        if (expenseError) throw expenseError;

        // Optional: Notify the Telegram group that an expense was added
        try {
            await bot.telegram.sendMessage(
                targetGroupId,
                `New Expense Added: $${amount} for "${description}"`
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

        // 2. Fetch all expense_splits for this group's expenses
        // (Note: Currently we haven't implemented writing to expense_splits when adding an expense. 
        // For MVP, if there are no splits, we assume the expense is split equally among all group members!)
        // So we need to get group members too.
        const { data: groupMembers, error: membersError } = await supabase
            .from('group_members')
            .select(`
                user_id,
                users ( first_name )
            `)
            .eq('group_id', groupId);

        if (membersError) throw membersError;

        // Map user IDs to names for UI
        const userNames: Record<string, string> = {};
        groupMembers.forEach(m => {
            // Supabase returns referenced table joins as an array if not a unique foreign key, 
            // but for a one-to-one or standard join it can be an object or array. 
            // We use `any` to safely bypass strict type checking here without complex generic definitions.
            const userRef = m.users as any;
            if (userRef) {
                userNames[m.user_id] = Array.isArray(userRef)
                    ? userRef[0]?.first_name
                    : userRef.first_name || 'Unknown';
            }
        });

        const memberIds = groupMembers.map(m => m.user_id);
        const memberCount = memberIds.length;

        if (memberCount === 0) {
            return res.json({ balances: [] });
        }

        // 3. Fetch current exchange rates
        const { getExchangeRates, convertCurrency } = require('./currencies');
        const rates = await getExchangeRates();

        // 4. Reconstruct the raw debts
        const rawDebts: { from: string, to: string, amount: number }[] = [];

        for (const expense of expenses) {
            if (!expense.amount) continue;

            const expenseCurrency = expense.currency || 'USD';

            // Unify all expenses into a base currency (USD) for simplification
            const amountInBaseCurrency = convertCurrency(
                expense.amount,
                expenseCurrency,
                'USD',
                rates
            );

            // Default split: evenly among all members
            const splitAmount = amountInBaseCurrency / memberCount;

            for (const memberId of memberIds) {
                // If the member is not the one who paid, they owe the payer
                if (memberId !== expense.paid_by) {
                    rawDebts.push({
                        from: memberId,
                        to: expense.paid_by,
                        amount: splitAmount
                    });
                }
            }
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
            currency: 'USD' // The output is currently normalized to USD
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
