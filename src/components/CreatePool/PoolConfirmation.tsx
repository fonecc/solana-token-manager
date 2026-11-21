import { useT } from '../../i18n/useT';
import React from 'react';
import { Alert, AlertIcon, Box, Button, Heading, Text, VStack } from '@chakra-ui/react';
import type { TransactionUpdate } from '../../lib/solana/transactions';
import { TransactionFeedback } from '../common/TransactionFeedback';
import { isPositiveAmount } from './AmountInputs';

export interface PoolConfirmationProps {
    baseAmount: string;
    quoteAmount: string;
    busy: boolean;
    walletReady: boolean;
    done: boolean;
    error: string;
    updates: TransactionUpdate[];
    onCreate: () => void;
}

export function PoolConfirmation({ baseAmount, quoteAmount, busy, walletReady, done, error, updates, onCreate }: PoolConfirmationProps) {
    const t = useT();
    return <VStack align="stretch" spacing={4} minW={0}>
        {updates.length > 0 && <Text fontSize="xs" fontWeight="semibold" color="gray.600">{t("CreatePool.poolStepTransactionRecords")}</Text>}
        <TransactionFeedback updates={updates} />
        {error && !done && <Alert status="error" borderRadius="lg" alignItems="start"><AlertIcon /><Box minW={0}><Text fontSize="sm" fontWeight="semibold">{t("CreatePool.poolCreationNotCompleted")}</Text><Text fontSize="xs" overflowWrap="anywhere" mt={1}>{error}</Text><Text fontSize="xs" mt={2} lineHeight="tall">{t("CreatePool.checkTheOriginalSignaturesAndCreatedAccountsFirstThe")}</Text></Box></Alert>}
        {!done && <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={{ base: 4, md: 5 }} minW={0}>
            <Heading as="h3" size="sm" mb={3}>{t("CreatePool.reviewOnceMoreBeforeSigning")}</Heading>
            <Text fontWeight="semibold" overflowWrap="anywhere">{t('CreatePool.depositSummary', { base: baseAmount || '—', quote: quoteAmount || '—' })}</Text>
            <Text fontSize="xs" color="gray.600" lineHeight="tall" mt={2} mb={4}>{t("CreatePool.theseAssetsGoIntoThePoolYourWalletAlso")}</Text>
            <Button colorScheme="purple" w={{ base: 'full', md: 'auto' }} onClick={onCreate} isLoading={busy} loadingText={t("CreatePool.creatingPoolCheckYourWallet")} isDisabled={!walletReady || busy || !isPositiveAmount(baseAmount) || !isPositiveAmount(quoteAmount)}>{t("CreatePool.confirmDepositsAndCreatePool")}</Button>
            <Text fontSize="xs" color="gray.500" lineHeight="tall" mt={3}>{t("CreatePool.doNotResubmitWhileWaitingIfConfirmationTimesOut")}</Text>
        </Box>}
    </VStack>;
}
