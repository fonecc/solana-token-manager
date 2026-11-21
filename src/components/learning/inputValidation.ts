import type { Translate } from '../../i18n/message';
import { PublicKey } from '@solana/web3.js';

export function addressError(value: string, t: Translate = key => key): string {
    if (!value) return '';
    try { new PublicKey(value); return ''; }
    catch { return t('learning.enterACompleteValidSolanaAddressYourInputIs'); }
}

// 尚未读取 Mint 精度时只判断语法，不臆测 decimals 或进行舍入。
export function positiveDecimalError(value: string, t: Translate = key => key): string {
    if (!value) return '';
    return /^(0|[1-9]\d*)(\.\d+)?$/.test(value) && /[1-9]/.test(value)
        ? '' : t('learning.enterADecimalAmountGreaterThan0WithoutA');
}
