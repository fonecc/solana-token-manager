export const manualTopics = ['start', 'assets', 'create', 'metadata', 'mint', 'transfer', 'freeze', 'burn', 'pool', 'liquidity', 'swap', 'recovery'] as const;
export type ManualTopic = typeof manualTopics[number];
export interface ManualChapter {
    id: ManualTopic;
    title: string;
    summary: string;
    prerequisites: string[];
    steps: { title: string; text: string }[];
    review: string[];
    verify: string[];
    troubleshooting: string[];
    terms: string[];
    sources: string[];
}
export const manualSources: Record<string, { title: string; url: string }> = {
    token: { title: 'SPL Token Program — classic token operations', url: 'https://www.solana-program.com/docs/token' },
    ata: { title: 'Associated Token Account Program', url: 'https://www.solana-program.com/docs/associated-token-account' },
    metadata: { title: 'Metaplex Token Metadata — Updating Assets', url: 'https://metaplex.com/docs/token-metadata/update' },
    sdk: { title: 'Raydium SDK V1 — archived AMM V4 integration', url: 'https://github.com/raydium-io/raydium-sdk-v1' },
    openbook: { title: 'OpenBook DEX program — source repository', url: 'https://github.com/openbook-dex/program' },
    explorer: { title: 'Solana Explorer — Devnet', url: 'https://explorer.solana.com/?cluster=devnet' },
};
