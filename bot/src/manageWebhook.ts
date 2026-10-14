import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    console.error('Error: TELEGRAM_BOT_TOKEN is missing in .env');
    process.exit(1);
}

const args = process.argv.slice(2);
const command = args[0] || 'info';

async function main() {
    const baseUrl = `https://api.telegram.org/bot${token}`;

    if (command === 'info' || command === 'status') {
        const res = await fetch(`${baseUrl}/getWebhookInfo`);
        const data = await res.json();
        console.log('\n--- Telegram Webhook Status ---');
        console.log(JSON.stringify(data, null, 2));
        if (data.result?.url) {
            console.log(`\nActive webhook URL: ${data.result.url}`);
            if (data.result.last_error_message) {
                console.log(`⚠️ Last error: ${data.result.last_error_message} (${new Date(data.result.last_error_date * 1000).toLocaleString()})`);
            }
        } else {
            console.log('\n⚠️ No webhook URL is currently set! Telegram is not forwarding messages to any server.');
        }
    } else if (command === 'set') {
        let targetUrl = args[1];
        if (!targetUrl) {
            console.error('Usage: npm run webhook:set <url_or_domain>');
            console.error('Example: npm run webhook:set https://telebot-xxx.vercel.app');
            process.exit(1);
        }

        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://${targetUrl}`;
        }

        if (!targetUrl.endsWith('/api/webhook')) {
            targetUrl = targetUrl.replace(/\/+$/, '') + '/api/webhook';
        }

        console.log(`Setting webhook to: ${targetUrl}...`);
        const res = await fetch(`${baseUrl}/setWebhook?url=${encodeURIComponent(targetUrl)}`);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
        if (data.ok) {
            console.log(`✅ Webhook set successfully to ${targetUrl}!`);
        } else {
            console.error(`❌ Failed to set webhook: ${data.description}`);
        }
    } else if (command === 'delete') {
        console.log('Deleting webhook...');
        const res = await fetch(`${baseUrl}/deleteWebhook`);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
        if (data.ok) {
            console.log('✅ Webhook deleted. You can now use long polling in local dev.');
        }
    } else {
        console.log(`Unknown command: ${command}. Use 'info', 'set <url>', or 'delete'.`);
    }
}

main().catch(err => {
    console.error('Error running manageWebhook:', err);
    process.exit(1);
});
