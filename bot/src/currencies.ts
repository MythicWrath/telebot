import { supabase } from './db';
import axios from 'axios';

// Format date as YYYY-MM-DD
function getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

export async function getExchangeRates(): Promise<Record<string, number>> {
    const today = getTodayDateString();

    try {
        // 1. Check if we already have rates for today in the database
        const { data, error } = await supabase
            .from('exchange_rates')
            .select('rates')
            .eq('date', today)
            .single();

        if (data && data.rates) {
            console.log(`Using cached exchange rates for ${today}`);
            return data.rates as Record<string, number>;
        }

        // 2. We don't have them, or there was an error. Fetch from public API.
        console.log(`Fetching fresh exchange rates for ${today}...`);
        // We use exchange-rate-api.com which provides a free tier without keys for open endpoints
        const response = await axios.get('https://open.er-api.com/v6/latest/USD');

        if (response.data && response.data.rates) {
            const rates = response.data.rates;

            // 3. Cache the new rates in the database
            await supabase.from('exchange_rates').upsert({
                date: today,
                base_currency: 'USD',
                rates: rates
            });

            return rates;
        } else {
            throw new Error('Invalid response from Exchange Rate API');
        }

    } catch (err) {
        console.error('Failed to get exchange rates:', err);
        // Fallback to 1:1 if everything fails so the app doesn't crash
        return { 'USD': 1 };
    }
}

/**
 * Converts an amount from one currency to another using the exchange rates.
 * Because all our rates are relative to base USD, we do: amount * (targetRate / sourceRate)
 */
export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string, rates: Record<string, number>): number {
    if (fromCurrency === toCurrency) return amount;

    const sourceRate = rates[fromCurrency];
    const targetRate = rates[toCurrency];

    if (!sourceRate || !targetRate) {
        console.warn(`Missing exchange rate for ${fromCurrency} or ${toCurrency}. Defaulting to 1:1`);
        return amount;
    }

    // Convert to USD first, then to target currency
    const amountInUSD = amount / sourceRate;
    return amountInUSD * targetRate;
}
