import { AppError, message } from '../../i18n/message';
import BN from 'bn.js';

export const MAX_U64 = (1n << 64n) - 1n;

function checkDecimals(decimals: number) {
    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255) throw new AppError(message("amounts.invalidDecimals"));
}

export function parseTokenAmount(input: string, decimals: number): bigint {
    checkDecimals(decimals);
    if (!/^\d+(?:\.\d+)?$/.test(input)) throw new AppError(message("amounts.enterAValidNonNegativeDecimalAmount"));
    const [whole, fraction = ''] = input.split('.');
    if (fraction.length > decimals) throw new AppError(message("amounts.amountSupportsAtMostDecimalPlaces", { v0: decimals }));
    const raw = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
    if (raw > MAX_U64) throw new AppError(message("amounts.amountExceedsTheU64Range"));
    return raw;
}

export function positiveTokenAmount(input: string, decimals: number): bigint {
    const raw = parseTokenAmount(input, decimals);
    if (raw === 0n) throw new AppError(message("amounts.amountMustBeGreaterThanZero"));
    return raw;
}

export function formatTokenAmount(raw: bigint | string, decimals: number): string {
    checkDecimals(decimals);
    const value = BigInt(raw);
    if (value < 0n) throw new AppError(message("amounts.amountCannotBeNegative"));
    if (decimals === 0) return value.toString();
    const padded = value.toString().padStart(decimals + 1, '0');
    const fraction = padded.slice(-decimals).replace(/0+$/, '');
    return padded.slice(0, -decimals) + (fraction ? `.${fraction}` : '');
}

export function amountToBN(input: string, decimals: number): BN {
    return new BN(positiveTokenAmount(input, decimals).toString());
}
