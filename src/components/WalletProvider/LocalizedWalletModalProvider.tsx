import React from 'react';
import { Button, HStack, Image, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Text, VStack } from '@chakra-ui/react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletModalContext } from '@solana/wallet-adapter-react-ui';
import { useMemo, useState, type ReactNode } from 'react';
import { useT } from '../../i18n/useT';

// The adapter UI version has no translation API. Reuse its public modal
// context and wallet discovery; Chakra owns the dialog and focus lifecycle.
export function LocalizedWalletModalProvider({ children }: { children: ReactNode }) {
    const t = useT();
    const { wallets, select } = useWallet();
    const [visible, setVisible] = useState(false);
    const context = useMemo(() => ({ visible, setVisible }), [visible]);
    const available = wallets.filter(wallet => wallet.readyState !== WalletReadyState.Unsupported)
        .sort((a, b) => Number(b.readyState === WalletReadyState.Installed) - Number(a.readyState === WalletReadyState.Installed));
    return <WalletModalContext.Provider value={context}>
        {children}
        <Modal isOpen={visible} onClose={() => setVisible(false)} isCentered scrollBehavior="inside">
            <ModalOverlay /><ModalContent><ModalHeader>{t('wallet.selectTitle')}</ModalHeader>
                <ModalCloseButton aria-label={t('wallet.close')} />
                <ModalBody pb={6}>
                    <Text fontSize="sm" color="gray.500" mb={4}>{t('wallet.explanation')}</Text>
                    <VStack align="stretch" spacing={2}>
                        {available.map(({ adapter, readyState }) => <Button key={adapter.name} variant="outline" h="auto" py={3}
                            onClick={() => { select(adapter.name); setVisible(false); }}>
                            <HStack w="full" justify="space-between" gap={3}>
                                <HStack><Image src={adapter.icon} alt="" boxSize="24px" /><Text>{adapter.name}</Text></HStack>
                                <Text fontSize="xs" color="gray.500">{t(readyState === WalletReadyState.Installed ? 'wallet.detected' : 'wallet.notDetected')}</Text>
                            </HStack>
                        </Button>)}
                        {!available.length && <Text>{t('wallet.noWallet')}</Text>}
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    </WalletModalContext.Provider>;
}
