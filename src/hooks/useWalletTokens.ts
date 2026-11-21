import { useMessageState } from '../i18n/useT';
import { AppError, message } from '../i18n/message';
import { LAMPORTS_PER_SOL,type Connection,type PublicKey } from '@solana/web3.js';
import { useCallback,useEffect,useRef,useState } from 'react';
import { loadWalletTokens,type WalletToken } from '../lib/solana/accounts';

export function useWalletTokens(connection: Connection, owner: PublicKey | null) {
    const [tokens, setTokens] = useState<WalletToken[]>([]);
    const [solBalance, setSolBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError, errorValue] = useMessageState();
    const generation = useRef(0);
    const invalidate = useCallback(() => { generation.current++; }, []);
    const refresh = useCallback(async () => {
        const id = ++generation.current;
        if (!owner) { setTokens([]); setSolBalance(0); setIsLoading(false); return; }
        setIsLoading(true);
        setError(null);
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            const data = Promise.all([loadWalletTokens(connection, owner), connection.getBalance(owner)]);
            const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new AppError(message("hooks.accountReadTimedOutRefreshAndTryAgain"))), 30000); });
            const [loaded, lamports] = await Promise.race([data, timeout]);
            if (id !== generation.current) return;
            setTokens(loaded);
            setSolBalance(lamports / LAMPORTS_PER_SOL);
        } catch (reason) {
            if (id === generation.current) setError(reason);
        } finally {
            clearTimeout(timer);
            if (id === generation.current) setIsLoading(false);
        }
    }, [connection, owner, setError]);
    useEffect(() => {
        setTokens([]);
        setSolBalance(0);
        void refresh();
        return invalidate;
    }, [refresh, invalidate]);
    return { tokens, solBalance, setSolBalance, isLoading, error, errorCode: errorValue && typeof errorValue === 'object' ? errorValue.key : undefined, refresh };
}
