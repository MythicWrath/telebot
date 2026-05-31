import { Telegraf } from 'telegraf';
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as path from 'path';
import crypto from 'crypto';
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

// --- Telegram InitData Validation & Extraction ---
interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
}

interface ValidatedInitData {
    query_id?: string;
    user?: TelegramUser;
    receiver?: any;
    chat?: any;
    chat_type?: string;
    chat_instance?: string;
    start_param?: string;
    auth_date: number;
    hash: string;
}

function parseAndValidateInitData(initDataStr: string, token: string): { isValid: boolean; data?: ValidatedInitData } {
    try {
        const params = new URLSearchParams(initDataStr);
        const hash = params.get('hash');
        if (!hash) {
            return { isValid: false };
        }

        params.delete('hash');

        const keys = Array.from(params.keys()).sort();
        const dataCheckString = keys
            .map(key => `${key}=${params.get(key)}`)
            .join('\n');

        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(token)
            .digest();

        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        if (calculatedHash !== hash) {
            return { isValid: false };
        }

        const result: any = {};
        for (const [key, value] of params.entries()) {
            if (key === 'user' || key === 'chat' || key === 'receiver') {
                result[key] = JSON.parse(value);
            } else if (key === 'auth_date') {
                result[key] = parseInt(value, 10);
            } else {
                result[key] = value;
            }
        }

        // Prevent replay attacks (24 hours expiration check in production)
        const now = Math.floor(Date.now() / 1000);
        if (!isDev && (now - result.auth_date > 86400)) {
            console.warn('initData expired by', now - result.auth_date, 'seconds');
            return { isValid: false };
        }

        return { isValid: true, data: result as ValidatedInitData };
    } catch (error) {
        console.error('Error validating initData:', error);
        return { isValid: false };
    }
}

// Middleware to validate Telegram Web App initData
const validateTelegramInitData = async (req: any, res: any, next: () => void) => {
    const initDataStr = req.headers['x-telegram-init-data'] as string;

    if (!initDataStr) {
        if (isDev) {
            // Bypass in development if header is missing
            req.telegramUser = { id: 111111111, first_name: 'TestUser1' };
            return next();
        }
        return res.status(401).json({ error: 'Missing Telegram authorization header' });
    }

    const { isValid, data } = parseAndValidateInitData(initDataStr, botToken);

    if (!isValid || !data) {
        return res.status(401).json({ error: 'Invalid Telegram authorization' });
    }

    req.telegramUser = data.user;
    req.initDataPayload = data;
    next();
};

// Middleware to verify group membership
const requireGroupAccess = async (req: any, res: any, next: () => void) => {
    try {
        const groupId = parseInt(req.params.groupId || req.body.groupId, 10);
        const userId = req.telegramUser?.id;

        if (isDev && !req.headers['x-telegram-init-data']) {
            // Bypass group membership check in dev if not using real initData
            return next();
        }

        if (!groupId || !userId) {
            return res.status(400).json({ error: 'Missing Group ID or User ID' });
        }

        // Query Supabase to see if the user is a member of the group
        const { data: membership, error } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;

        if (!membership) {
            return res.status(403).json({ error: 'Access denied: You are not a member of this group' });
        }

        next();
    } catch (e: any) {
        console.error('Group access verification failed:', e);
        res.status(500).json({ error: 'Internal server error verifying group access' });
    }
};

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

// User command: /split - Get the link to open the Mini App in this group
bot.command('split', async (ctx) => {
    const chat = ctx.chat;
    if (!chat || (chat.type !== 'group' && chat.type !== 'supergroup')) {
        return ctx.reply('This command can only be used in a group chat.');
    }
    const botUsername = ctx.botInfo.username;
    // Note: 'app' is the default short name placeholder. Change this link if your short name is different.
    const link = `https://t.me/${botUsername}/app?startapp=${chat.id}`;
    
    ctx.reply(
        `💵 *Tele Split Money*\n\n` +
        `Ready to split expenses in this group chat? Click the button below to open the Mini App!\n\n` +
        `Group ID: \`${chat.id}\``,
        {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: '🚀 Open Mini App',
                            url: link
                        }
                    ]
                ]
            }
        }
    );
});
// --- Admin Whitelisting Middleware ---
// Checks that the sender is a group creator or administrator before proceeding.
// Usage: bot.command('mycommand', requireGroupAdmin, handler)
const requireGroupAdmin = async (ctx: any, next: () => Promise<void>) => {
    const chat = ctx.chat;
    const user = ctx.from;

    if (!chat || !user) {
        return ctx.reply('This command can only be used in a group chat.');
    }

    if (chat.type !== 'group' && chat.type !== 'supergroup') {
        return ctx.reply('This command can only be used in a group chat.');
    }

    try {
        const member = await ctx.telegram.getChatMember(chat.id, user.id);
        const isAdmin = member.status === 'creator' || member.status === 'administrator';

        if (!isAdmin) {
            return ctx.reply('⛔ This command is restricted to group admins only.');
        }
    } catch (e) {
        console.error('Failed to verify admin status:', e);
        return ctx.reply('Could not verify your admin status. Please try again.');
    }

    return next();
};

// Admin-only: Clear all expenses and settlements for this group
bot.command('clear', requireGroupAdmin, async (ctx) => {
    const groupId = ctx.chat?.id;
    if (!groupId) return;

    try {
        // Fetch all expense IDs for this group first (to cascade delete splits)
        const { data: expenses } = await supabase
            .from('expenses')
            .select('id')
            .eq('group_id', groupId);

        if (expenses && expenses.length > 0) {
            const expenseIds = expenses.map((e: any) => e.id);
            await supabase.from('expense_splits').delete().in('expense_id', expenseIds);
        }

        await supabase.from('expenses').delete().eq('group_id', groupId);
        await supabase.from('settlements').delete().eq('group_id', groupId);

        ctx.reply('🗑️ All expenses and settlements for this group have been cleared.');
    } catch (e: any) {
        console.error('Failed to clear group data:', e);
        ctx.reply('❌ Failed to clear data: ' + e.message);
    }
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
app.get('/api/groups/:groupId/members', validateTelegramInitData, requireGroupAccess, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId, 10);

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
app.post('/api/expenses', validateTelegramInitData, requireGroupAccess, async (req: any, res) => {
    try {
        const { amount, currency, description, groupId, paidBy, splitWith } = req.body;

        let targetGroupId = groupId || (req.initDataPayload?.start_param ? parseInt(req.initDataPayload.start_param, 10) : null);
        let actualPaidBy = paidBy || req.telegramUser?.id;

        if (isDev && !req.headers['x-telegram-init-data']) {
            targetGroupId = targetGroupId || -100123456789;
            if (!actualPaidBy) {
                const { data: testUser } = await supabase.from('users').select('telegram_id').limit(1).single();
                actualPaidBy = testUser?.telegram_id || 111111111;
            }
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
app.post('/api/settlements', validateTelegramInitData, requireGroupAccess, async (req, res) => {
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
app.get('/api/groups/:groupId/balances', validateTelegramInitData, requireGroupAccess, async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId, 10);

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

// Webhook endpoint — Telegram POSTs updates here in production
app.post('/api/webhook', (req, res) => {
    bot.handleUpdate(req.body, res);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

if (isDev) {
    // In dev: run a persistent server with long-polling
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Backend API running on http://localhost:${PORT}`);
        bot.launch().then(() => {
            console.log('Bot started successfully (long-polling)!');
        });
    });
}

// Export the Express app for Vercel serverless
module.exports = app;
