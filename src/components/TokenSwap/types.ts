
export interface TokenInfo {
    mint: string;
    symbol: string;
    name?: string;
    icon?: string;
    balance?: string;
    decimals: number;
    isNative?: boolean;
}

export interface SwapError extends Error {
    code?: string;
    message: string;
}
