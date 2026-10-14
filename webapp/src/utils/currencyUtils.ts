/**
 * Comprehensive IANA timezone -> currency code mapping.
 * Covers all major world timezones.
 */
const TIMEZONE_TO_CURRENCY: Record<string, string> = {
  // Singapore / Malaysia
  'Asia/Singapore': 'SGD',
  'Asia/Kuala_Lumpur': 'MYR',
  'Asia/Kuching': 'MYR',

  // China / Hong Kong / Macau / Taiwan
  'Asia/Shanghai': 'CNY',
  'Asia/Chongqing': 'CNY',
  'Asia/Harbin': 'CNY',
  'Asia/Urumqi': 'CNY',
  'Asia/Hong_Kong': 'HKD',
  'Asia/Macau': 'MOP',
  'Asia/Taipei': 'TWD',

  // Japan / Korea
  'Asia/Tokyo': 'JPY',
  'Asia/Seoul': 'KRW',
  'Asia/Pyongyang': 'KPW',

  // India / Sri Lanka / Nepal / Pakistan / Bangladesh
  'Asia/Kolkata': 'INR',
  'Asia/Calcutta': 'INR',
  'Asia/Colombo': 'LKR',
  'Asia/Kathmandu': 'NPR',
  'Asia/Katmandu': 'NPR',
  'Asia/Karachi': 'PKR',
  'Asia/Dhaka': 'BDT',
  'Asia/Dacca': 'BDT',

  // Indonesia / Philippines / Thailand / Vietnam / Cambodia / Myanmar
  'Asia/Jakarta': 'IDR',
  'Asia/Pontianak': 'IDR',
  'Asia/Makassar': 'IDR',
  'Asia/Ujung_Pandang': 'IDR',
  'Asia/Jayapura': 'IDR',
  'Asia/Manila': 'PHP',
  'Asia/Bangkok': 'THB',
  'Asia/Phnom_Penh': 'KHR',
  'Asia/Saigon': 'VND',
  'Asia/Ho_Chi_Minh': 'VND',
  'Asia/Hanoi': 'VND',
  'Asia/Rangoon': 'MMK',
  'Asia/Yangon': 'MMK',
  'Asia/Vientiane': 'LAK',
  'Asia/Brunei': 'BND',

  // Middle East
  'Asia/Dubai': 'AED',
  'Asia/Muscat': 'OMR',
  'Asia/Riyadh': 'SAR',
  'Asia/Kuwait': 'KWD',
  'Asia/Bahrain': 'BHD',
  'Asia/Qatar': 'QAR',
  'Asia/Amman': 'JOD',
  'Asia/Beirut': 'LBP',
  'Asia/Damascus': 'SYP',
  'Asia/Baghdad': 'IQD',
  'Asia/Jerusalem': 'ILS',
  'Asia/Tel_Aviv': 'ILS',
  'Asia/Gaza': 'ILS',
  'Asia/Hebron': 'ILS',
  'Asia/Tehran': 'IRR',
  'Asia/Kabul': 'AFN',
  'Asia/Baku': 'AZN',
  'Asia/Tbilisi': 'GEL',
  'Asia/Yerevan': 'AMD',

  // Central Asia
  'Asia/Tashkent': 'UZS',
  'Asia/Samarkand': 'UZS',
  'Asia/Ashgabat': 'TMT',
  'Asia/Ashkhabad': 'TMT',
  'Asia/Dushanbe': 'TJS',
  'Asia/Bishkek': 'KGS',
  'Asia/Almaty': 'KZT',
  'Asia/Qyzylorda': 'KZT',
  'Asia/Aqtau': 'KZT',
  'Asia/Aqtobe': 'KZT',
  'Asia/Oral': 'KZT',
  'Asia/Yekaterinburg': 'RUB',

  // Russia
  'Asia/Novosibirsk': 'RUB',
  'Asia/Krasnoyarsk': 'RUB',
  'Asia/Irkutsk': 'RUB',
  'Asia/Yakutsk': 'RUB',
  'Asia/Vladivostok': 'RUB',
  'Asia/Magadan': 'RUB',
  'Asia/Sakhalin': 'RUB',
  'Asia/Kamchatka': 'RUB',
  'Asia/Anadyr': 'RUB',
  'Europe/Moscow': 'RUB',
  'Europe/Samara': 'RUB',
  'Europe/Kaliningrad': 'RUB',
  'Europe/Volgograd': 'RUB',
  'Europe/Ulyanovsk': 'RUB',

  // Europe - EUR
  'Europe/Paris': 'EUR',
  'Europe/Berlin': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Madrid': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'Europe/Brussels': 'EUR',
  'Europe/Vienna': 'EUR',
  'Europe/Athens': 'EUR',
  'Europe/Lisbon': 'EUR',
  'Europe/Helsinki': 'EUR',
  'Europe/Stockholm': 'SEK',
  'Europe/Oslo': 'NOK',
  'Europe/Copenhagen': 'DKK',
  'Europe/Warsaw': 'PLN',
  'Europe/Prague': 'CZK',
  'Europe/Budapest': 'HUF',
  'Europe/Bucharest': 'RON',
  'Europe/Sofia': 'BGN',
  'Europe/Zagreb': 'EUR',
  'Europe/Belgrade': 'RSD',
  'Europe/Sarajevo': 'BAM',
  'Europe/Skopje': 'MKD',
  'Europe/Tirane': 'ALL',
  'Europe/Podgorica': 'EUR',
  'Europe/Zurich': 'CHF',
  'Europe/London': 'GBP',
  'Europe/Dublin': 'EUR',
  'Europe/Nicosia': 'EUR',
  'Europe/Riga': 'EUR',
  'Europe/Tallinn': 'EUR',
  'Europe/Vilnius': 'EUR',
  'Europe/Kiev': 'UAH',
  'Europe/Kyiv': 'UAH',
  'Europe/Minsk': 'BYN',
  'Europe/Istanbul': 'TRY',
  'Europe/Chisinau': 'MDL',
  'Europe/Tiraspol': 'MDL',
  'Europe/Luxembourg': 'EUR',
  'Europe/Vaduz': 'CHF',
  'Europe/Malta': 'EUR',
  'Atlantic/Reykjavik': 'ISK',

  // UK & CI
  'Europe/Guernsey': 'GBP',
  'Europe/Jersey': 'GBP',
  'Europe/Isle_of_Man': 'GBP',

  // Americas - USD
  'America/New_York': 'USD',
  'America/Chicago': 'USD',
  'America/Denver': 'USD',
  'America/Los_Angeles': 'USD',
  'America/Phoenix': 'USD',
  'America/Anchorage': 'USD',
  'America/Adak': 'USD',
  'Pacific/Honolulu': 'USD',
  'America/Indiana/Indianapolis': 'USD',
  'America/Indiana/Vincennes': 'USD',
  'America/Indiana/Winamac': 'USD',
  'America/Indiana/Marengo': 'USD',
  'America/Indiana/Tell_City': 'USD',
  'America/Indiana/Petersburg': 'USD',
  'America/Indiana/Knox': 'USD',
  'America/Indiana/Vevay': 'USD',
  'America/Kentucky/Louisville': 'USD',
  'America/Kentucky/Monticello': 'USD',
  'America/North_Dakota/Center': 'USD',
  'America/North_Dakota/New_Salem': 'USD',
  'America/North_Dakota/Beulah': 'USD',
  'America/Detroit': 'USD',
  'America/Menominee': 'USD',
  'America/Boise': 'USD',
  'America/Juneau': 'USD',
  'America/Sitka': 'USD',
  'America/Yakutat': 'USD',
  'America/Nome': 'USD',
  'America/Metlakatla': 'USD',

  // Canada
  'America/Toronto': 'CAD',
  'America/Vancouver': 'CAD',
  'America/Edmonton': 'CAD',
  'America/Winnipeg': 'CAD',
  'America/Halifax': 'CAD',
  'America/St_Johns': 'CAD',
  'America/Moncton': 'CAD',
  'America/Glace_Bay': 'CAD',
  'America/Goose_Bay': 'CAD',
  'America/Blanc-Sablon': 'CAD',
  'America/Thunder_Bay': 'CAD',
  'America/Nipigon': 'CAD',
  'America/Rainy_River': 'CAD',
  'America/Rankin_Inlet': 'CAD',
  'America/Regina': 'CAD',
  'America/Swift_Current': 'CAD',
  'America/Yellowknife': 'CAD',
  'America/Inuvik': 'CAD',
  'America/Dawson': 'CAD',
  'America/Whitehorse': 'CAD',
  'America/Creston': 'CAD',
  'America/Dawson_Creek': 'CAD',
  'America/Fort_Nelson': 'CAD',

  // Mexico
  'America/Mexico_City': 'MXN',
  'America/Cancun': 'MXN',
  'America/Monterrey': 'MXN',
  'America/Merida': 'MXN',
  'America/Chihuahua': 'MXN',
  'America/Hermosillo': 'MXN',
  'America/Mazatlan': 'MXN',
  'America/Tijuana': 'MXN',
  'America/Ojinaga': 'MXN',
  'America/Bahia_Banderas': 'MXN',

  // Brazil
  'America/Sao_Paulo': 'BRL',
  'America/Rio_Branco': 'BRL',
  'America/Manaus': 'BRL',
  'America/Belem': 'BRL',
  'America/Fortaleza': 'BRL',
  'America/Recife': 'BRL',
  'America/Maceio': 'BRL',
  'America/Bahia': 'BRL',
  'America/Cuiaba': 'BRL',
  'America/Campo_Grande': 'BRL',
  'America/Porto_Velho': 'BRL',
  'America/Boa_Vista': 'BRL',
  'America/Noronha': 'BRL',
  'America/Eirunepe': 'BRL',
  'America/Porto_Acre': 'BRL',

  // South America - other
  'America/Argentina/Buenos_Aires': 'ARS',
  'America/Argentina/Cordoba': 'ARS',
  'America/Santiago': 'CLP',
  'America/Bogota': 'COP',
  'America/Lima': 'PEN',
  'America/Caracas': 'VES',
  'America/La_Paz': 'BOB',
  'America/Asuncion': 'PYG',
  'America/Montevideo': 'UYU',
  'America/Guayaquil': 'USD',
  'America/Cayenne': 'EUR',
  'America/Paramaribo': 'SRD',
  'America/Georgetown': 'GYD',

  // Caribbean
  'America/Havana': 'CUP',
  'America/Jamaica': 'JMD',
  'America/Port-au-Prince': 'HTG',
  'America/Santo_Domingo': 'DOP',
  'America/Nassau': 'BSD',
  'America/Barbados': 'BBD',
  'America/Trinidad': 'TTD',
  'America/Curacao': 'ANG',
  'America/Aruba': 'AWG',
  'America/Puerto_Rico': 'USD',

  // Central America
  'America/Guatemala': 'GTQ',
  'America/Belize': 'BZD',
  'America/Managua': 'NIO',
  'America/San_Jose': 'CRC',
  'America/Panama': 'PAB',
  'America/El_Salvador': 'USD',
  'America/Tegucigalpa': 'HNL',

  // Australia
  'Australia/Sydney': 'AUD',
  'Australia/Melbourne': 'AUD',
  'Australia/Brisbane': 'AUD',
  'Australia/Perth': 'AUD',
  'Australia/Adelaide': 'AUD',
  'Australia/Darwin': 'AUD',
  'Australia/Hobart': 'AUD',
  'Australia/Lord_Howe': 'AUD',
  'Australia/Lindeman': 'AUD',
  'Australia/Broken_Hill': 'AUD',
  'Australia/Currie': 'AUD',
  'Australia/Eucla': 'AUD',

  // New Zealand & Pacific
  'Pacific/Auckland': 'NZD',
  'Pacific/Chatham': 'NZD',
  'Pacific/Fiji': 'FJD',
  'Pacific/Guam': 'USD',
  'Pacific/Saipan': 'USD',
  'Pacific/Port_Moresby': 'PGK',
  'Pacific/Bougainville': 'PGK',
  'Pacific/Guadalcanal': 'SBD',
  'Pacific/Efate': 'VUV',
  'Pacific/Noumea': 'XPF',
  'Pacific/Pago_Pago': 'USD',
  'Pacific/Apia': 'WST',
  'Pacific/Tongatapu': 'TOP',
  'Pacific/Fakaofo': 'NZD',
  'Pacific/Niue': 'NZD',
  'Pacific/Rarotonga': 'NZD',
  'Pacific/Palau': 'USD',
  'Pacific/Chuuk': 'USD',
  'Pacific/Pohnpei': 'USD',
  'Pacific/Kosrae': 'USD',
  'Pacific/Majuro': 'USD',
  'Pacific/Tarawa': 'AUD',
  'Pacific/Nauru': 'AUD',
  'Pacific/Funafuti': 'AUD',
  'Pacific/Wake': 'USD',
  'Pacific/Johnston': 'USD',
  'Pacific/Midway': 'USD',
  'Pacific/Pitcairn': 'NZD',

  // Africa
  'Africa/Johannesburg': 'ZAR',
  'Africa/Lagos': 'NGN',
  'Africa/Nairobi': 'KES',
  'Africa/Cairo': 'EGP',
  'Africa/Casablanca': 'MAD',
  'Africa/Algiers': 'DZD',
  'Africa/Tunis': 'TND',
  'Africa/Tripoli': 'LYD',
  'Africa/Khartoum': 'SDG',
  'Africa/Addis_Ababa': 'ETB',
  'Africa/Dar_es_Salaam': 'TZS',
  'Africa/Kampala': 'UGX',
  'Africa/Accra': 'GHS',
  'Africa/Abidjan': 'XOF',
  'Africa/Dakar': 'XOF',
  'Africa/Bamako': 'XOF',
  'Africa/Conakry': 'GNF',
  'Africa/Freetown': 'SLL',
  'Africa/Monrovia': 'LRD',
  'Africa/Nouakchott': 'MRU',
  'Africa/Ouagadougou': 'XOF',
  'Africa/Niamey': 'XOF',
  'Africa/Lome': 'XOF',
  'Africa/Cotonou': 'XOF',
  'Africa/Porto-Novo': 'XOF',
  'Africa/Libreville': 'XAF',
  'Africa/Malabo': 'XAF',
  'Africa/Douala': 'XAF',
  'Africa/Bangui': 'XAF',
  'Africa/Brazzaville': 'XAF',
  'Africa/Kinshasa': 'CDF',
  'Africa/Lubumbashi': 'CDF',
  'Africa/Luanda': 'AOA',
  'Africa/Windhoek': 'NAD',
  'Africa/Gaborone': 'BWP',
  'Africa/Harare': 'ZWL',
  'Africa/Blantyre': 'MWK',
  'Africa/Lusaka': 'ZMW',
  'Africa/Maputo': 'MZN',
  'Africa/Mbabane': 'SZL',
  'Africa/Maseru': 'LSL',
  'Africa/Antananarivo': 'MGA',
  'Africa/Moroni': 'KMF',
  'Indian/Mauritius': 'MUR',
  'Indian/Reunion': 'EUR',
  'Indian/Mayotte': 'EUR',
  'Africa/Djibouti': 'DJF',
  'Africa/Asmara': 'ERN',
  'Africa/Mogadishu': 'SOS',
  'Africa/Bujumbura': 'BIF',
  'Africa/Kigali': 'RWF',
  'Africa/Juba': 'SSP',
  'Africa/Ndjamena': 'XAF',

  // Indian Ocean
  'Indian/Maldives': 'MVR',
  'Indian/Chagos': 'USD',
  'Indian/Christmas': 'AUD',
  'Indian/Cocos': 'AUD',
};

/**
 * Language code (BCP 47 region subtag) -> currency fallback mapping.
 * Used when timezone mapping fails.
 */
const LANGUAGE_TO_CURRENCY: Record<string, string> = {
  'US': 'USD',
  'GB': 'GBP',
  'AU': 'AUD',
  'CA': 'CAD',
  'SG': 'SGD',
  'MY': 'MYR',
  'JP': 'JPY',
  'KR': 'KRW',
  'CN': 'CNY',
  'HK': 'HKD',
  'TW': 'TWD',
  'IN': 'INR',
  'ID': 'IDR',
  'PH': 'PHP',
  'TH': 'THB',
  'VN': 'VND',
  'DE': 'EUR',
  'FR': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR',
  'NL': 'EUR',
  'BE': 'EUR',
  'PT': 'EUR',
  'AT': 'EUR',
  'FI': 'EUR',
  'IE': 'EUR',
  'GR': 'EUR',
  'SE': 'SEK',
  'NO': 'NOK',
  'DK': 'DKK',
  'CH': 'CHF',
  'PL': 'PLN',
  'CZ': 'CZK',
  'HU': 'HUF',
  'RO': 'RON',
  'RU': 'RUB',
  'TR': 'TRY',
  'UA': 'UAH',
  'BR': 'BRL',
  'MX': 'MXN',
  'AR': 'ARS',
  'CL': 'CLP',
  'CO': 'COP',
  'ZA': 'ZAR',
  'NG': 'NGN',
  'KE': 'KES',
  'EG': 'EGP',
  'MA': 'MAD',
  'SA': 'SAR',
  'AE': 'AED',
  'IL': 'ILS',
  'NZ': 'NZD',
};

/**
 * Guesses the user's preferred currency based on:
 * 1. IANA timezone (via Intl.DateTimeFormat)
 * 2. Telegram's user language_code (region subtag)
 * 3. Browser's navigator.language (region subtag)
 * 4. Final fallback: 'USD'
 */
export function guessUserCurrency(telegramLanguageCode?: string): string {
  // 1. Try timezone-based lookup
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone && TIMEZONE_TO_CURRENCY[timezone]) {
      return TIMEZONE_TO_CURRENCY[timezone];
    }
  } catch {
    // Intl API not available
  }

  // 2. Try Telegram language_code (e.g. "en", "zh-hans", "en-US")
  if (telegramLanguageCode) {
    const regionCode = extractRegionCode(telegramLanguageCode);
    if (regionCode && LANGUAGE_TO_CURRENCY[regionCode]) {
      return LANGUAGE_TO_CURRENCY[regionCode];
    }
  }

  // 3. Try browser navigator.language (e.g. "en-US", "zh-SG")
  try {
    const navLang = navigator.language;
    if (navLang) {
      const regionCode = extractRegionCode(navLang);
      if (regionCode && LANGUAGE_TO_CURRENCY[regionCode]) {
        return LANGUAGE_TO_CURRENCY[regionCode];
      }
    }
  } catch {
    // navigator not available
  }

  // 4. Final fallback
  return 'USD';
}

/** Extracts the uppercase region subtag from a BCP 47 language tag, e.g. "en-US" -> "US". */
function extractRegionCode(langTag: string): string | null {
  const parts = langTag.split('-');
  if (parts.length >= 2) {
    const region = parts[parts.length - 1].toUpperCase();
    if (/^[A-Z]{2}$/.test(region)) {
      return region;
    }
  }
  return null;
}
