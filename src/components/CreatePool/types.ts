export interface MarketDetailsData {
    marketId: string;
    baseMint: string;
    quoteMint: string;
    baseVault: string;
    quoteVault: string;
}

export interface PoolDetailsData {
    marketId: string;
    poolId: string;
    lpMint: string;
    baseVault: string;
    quoteVault: string;
    baseAmount: string;
    quoteAmount: string;
}
