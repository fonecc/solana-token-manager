import React from 'react';
import { Button } from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useT, useErrorMessage } from '../../i18n/useT';
import { useToast } from '@chakra-ui/react';

export const WalletButton = ({ size = 'md', label }: { size?: 'md' | 'lg'; label?: string }) => {
    const t = useT();
    const formatError = useErrorMessage();
    const toast = useToast();
    const { connected, connecting, disconnect, connect, wallet } = useWallet();
    const { setVisible } = useWalletModal();
    return <Button colorScheme={connected ? 'gray' : 'purple'} variant={connected ? 'outline' : 'solid'} size={size}
        isLoading={connecting} loadingText={t('wallet.connecting')} onClick={async () => {
            try {
                if (connected) await disconnect();
                else if (wallet) await connect();
                else setVisible(true);
            } catch (error) {
                toast({ title: t('wallet.connectionFailed'), description: formatError(error), status: 'error' });
            }
        }}>
        {connected ? t('WalletButton.disconnect') : label || t('WalletButton.connectWallet')}
    </Button>;
};
