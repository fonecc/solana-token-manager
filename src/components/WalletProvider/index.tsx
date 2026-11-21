import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { useMemo, type ReactNode } from 'react';
import { COMMITMENT, RPC_ENDPOINT } from '../../lib/solana/config';
import { LocalizedWalletModalProvider } from './LocalizedWalletModalProvider';

export const WalletContextProvider = ({ children }: { children: ReactNode }) => {
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
    return <ConnectionProvider endpoint={RPC_ENDPOINT} config={{ commitment: COMMITMENT }}>
        <WalletProvider wallets={wallets} autoConnect>
            <LocalizedWalletModalProvider>{children}</LocalizedWalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>;
};
