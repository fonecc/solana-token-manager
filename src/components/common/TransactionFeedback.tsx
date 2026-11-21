import { formatMessage } from '../../i18n/message';
import { useT } from '../../i18n/useT';
import React, { useCallback, useState } from 'react';
import { Alert, AlertIcon, Box, Text, VStack } from '@chakra-ui/react';
import { type TransactionUpdate } from '../../lib/solana/transactions';
import { AccountAddress } from './AccountAddress';

const labels = {
    'awaiting-signature': "common.awaitingWalletSignature", submitted: "common.transactionSubmitted", confirming: "common.awaitingOnChainConfirmation",
    success: "common.confirmedOnChain", failed: "common.transactionFailed", pending: "common.outcomePendingDoNotResubmit"
} as const;
export function useTransactionFeedback() {
    const [updates, setUpdates] = useState<TransactionUpdate[]>([]);
    const onUpdate = useCallback((update: TransactionUpdate) => {
        setUpdates(previous => [
            ...previous.filter(item => item.signature && item.signature !== update.signature),
            update,
        ]);
    }, []);
    return { updates, onUpdate };
}
export function TransactionFeedback({ updates }: { updates: TransactionUpdate[] }) {
    const t = useT();
    if (!updates.length) return null;
    const last = updates[updates.length - 1];
    const signatures = Array.from(new Set(updates.flatMap(update => update.signature ? [update.signature] : [])));
    return (
        <Box aria-live="polite" minW={0} overflowWrap="anywhere">
            <Alert status={last.stage === 'failed' ? 'error' : last.stage === 'success' ? 'success' : 'info'}
                borderRadius="lg" alignItems="flex-start" py={3} fontSize="sm">
                <AlertIcon boxSize={4} mt={0.5} />
                <Box minW={0}>
                    <Text fontWeight="medium">{t(labels[last.stage])}</Text>
                    {last.message && <Text fontSize="xs" mt={1} lineHeight="tall">{formatMessage(t, last.message)}</Text>}
                    {last.stage === 'pending' && <Text fontSize="xs" mt={1}>{t("common.checkTheOriginalTransactionRecordFirstDoNotSign")}</Text>}
                </Box>
            </Alert>
            {signatures.length > 0 && <VStack align="stretch" spacing={2} mt={2}>
                {signatures.map((signature, index) => {
                    const latest = [...updates].reverse().find(update => update.signature === signature)!;
                    return <Box key={signature}>
                        <AccountAddress label={signatures.length > 1 ? t("common.transactionDevnet", { v0: index + 1 }) : t("common.transactionRecordDevnet")} value={signature} type="tx" compact />
                        <Text fontSize="xs" color="gray.600" mt={1}>{t(labels[latest.stage])}</Text>
                    </Box>;
                })}
            </VStack>}
        </Box>
    );
}
