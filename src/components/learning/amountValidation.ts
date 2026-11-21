import { positiveTokenAmount } from '../../lib/solana/amounts';

export function validAmount(value: string, decimals: number, rawLimit?: string): boolean {
    try {
        const amount = positiveTokenAmount(value, decimals);
        return rawLimit === undefined || amount <= BigInt(rawLimit);
    } catch { return false; }
}
