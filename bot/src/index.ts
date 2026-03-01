import { Telegraf } from 'telegraf';
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

    // Track group if the message is in a supergroup or group
    if (chat && (chat.type === 'group' || chat.type === 'supergroup')) {

        // Upsert the group
        await supabase.from('groups').upsert({
            chat_id: chat.id,
            title: chat.title || 'Unknown Group'
        });

        // Link user to group if we know who the user is
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

    // Continue to next middleware/command handler
    return next();
});


// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('Bot is starting...');
bot.launch().then(() => {
    console.log('Bot started successfully!');
});
