import { Context, Markup } from 'telegraf';

export interface TutorialPage {
    text: string;
    reply_markup: any;
}

export function getTutorialPage(topic: string, botUsername: string): TutorialPage {
    const mainMenuKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('👥 1. Add Bot to Group', 'tutorial:add_group')],
        [Markup.button.callback('🔄 2. Sync Members', 'tutorial:sync')],
        [Markup.button.callback('📱 3. Open Mini App', 'tutorial:mini_app')],
        [Markup.button.callback('📜 4. Commands List', 'tutorial:commands')],
        [Markup.button.callback('❌ Close Tutorial', 'tutorial:close')]
    ]);

    const backButtonKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('⬅️ Back to Menu', 'tutorial:menu')]
    ]);

    switch (topic) {
        case 'add_group':
            return {
                text: `👥 *Step 1: Add Bot to Group*\n\n` +
                      `To start splitting expenses with your friends, you need to add this bot to your Telegram group chat.\n\n` +
                      `1. Click the button below to add me to a group chat.\n` +
                      `2. Once added, type */start* in the group chat. This registers the group in our database.\n\n` +
                      `💡 *Tip:* Make sure the bot has permissions to send messages so it can post updates when expenses are added or updated!`,
                reply_markup: Markup.inlineKeyboard([
                    [Markup.button.url('➕ Add to Group Chat', `https://t.me/${botUsername}?startgroup=select`)],
                    [Markup.button.callback('⬅️ Back to Menu', 'tutorial:menu')]
                ]).reply_markup
            };

        case 'sync':
            return {
                text: `🔄 *Step 2: Sync Members*\n\n` +
                      `After adding the bot to a group, you must register group members so they appear in the expense splits list.\n\n` +
                      `1. Run */sync* in the group chat. This registers all group administrators automatically.\n` +
                      `2. *Self-Registration:* Non-admin members are registered automatically as soon as they send any text message in the group.\n` +
                      `3. *Manual Registration:* Admins can use the \`/addmember\` command followed by a Telegram ID or username (if they've used the bot before) to register members manually.\n\n` +
                      `💡 *Tip:* Encourage your friends to send a message in the group right after adding the bot to make sure they are sync'd!`,
                reply_markup: backButtonKeyboard.reply_markup
            };

        case 'mini_app':
            return {
                text: `📱 *Step 3: Open Mini App*\n\n` +
                      `The easiest way to split expenses and track balances is using our interactive Telegram Mini App.\n\n` +
                      `1. Run */split* in the group chat. The bot will send a button to launch the app.\n` +
                      `2. Click *🚀 Open Mini App* to open the dashboard.\n` +
                      `3. In the Mini App, you can:\n` +
                      `   • Add expenses and specify who paid and how to split them.\n` +
                      `   • View optimized balances showing who owes whom.\n` +
                      `   • Settle debts directly in the app.`,
                reply_markup: backButtonKeyboard.reply_markup
            };

        case 'commands':
            return {
                text: `📜 *Commands List*\n\n` +
                      `Here is a quick reference of all commands you can use with me:\n\n` +
                      `*General Commands*\n` +
                      `/start - Start the bot or register a group\n` +
                      `/help - Get basic usage instructions\n` +
                      `/tutorial - Open this interactive guide\n\n` +
                      `*Group Commands*\n` +
                      `/split - Get the link to open the Split Money Mini App\n` +
                      `/sync - Sync group admins and show self-registration help\n\n` +
                      `*Group Admin Commands*\n` +
                      `/addmember <username_or_id> [name] - Add a member manually\n` +
                      `/clear - Clear all expenses and settlements for the group`,
                reply_markup: backButtonKeyboard.reply_markup
            };

        case 'menu':
        default:
            return {
                text: `📖 *Welcome to the Tele Split Money Tutorial!*\n\n` +
                      `I can help you track expenses, split bills, and simplify debts between friends in a group chat.\n\n` +
                      `Select a topic below to learn how to get started:`,
                reply_markup: mainMenuKeyboard.reply_markup
            };
    }
}

/**
 * Sends the tutorial main menu to a user.
 */
export async function sendTutorial(ctx: Context) {
    const botUsername = ctx.botInfo?.username || 'split_money_bot';
    const page = getTutorialPage('menu', botUsername);
    await ctx.reply(page.text, {
        parse_mode: 'Markdown',
        reply_markup: page.reply_markup
    });
}
