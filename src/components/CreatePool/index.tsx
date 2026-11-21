import { useT } from '../../i18n/useT';
import {
    AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter,
    AlertDialogHeader, AlertDialogOverlay, Button, Text, useDisclosure,
} from '@chakra-ui/react';
import { PublicKey } from '@solana/web3.js';
import React, { useRef, useState } from 'react';
import { AmountInputs } from './AmountInputs';
import { MarketCreator } from './MarketCreator';
import { MarketDetails } from './MarketDetails';
import { PoolCreator } from './PoolCreator';
import { PoolDetails } from './PoolDetails';
import { PoolGuide } from './PoolGuide';
import type { MarketDetailsData, PoolDetailsData } from './types';

interface CreatePoolProps {
    tokenMint: string;
    isActive: boolean;
}

const CreatePool = ({ tokenMint, isActive }: CreatePoolProps) => {
    const t = useT();
    const [marketId, setMarketId] = useState<PublicKey | null>(null);
    const [marketDetails, setMarketDetails] = useState<MarketDetailsData | null>(null);
    const [poolDetails, setPoolDetails] = useState<PoolDetailsData | null>(null);
    const [baseAmount, setBaseAmount] = useState('100');
    const [quoteAmount, setQuoteAmount] = useState('0.1');
    const [marketBusy, setMarketBusy] = useState(false);
    const [marketAttempted, setMarketAttempted] = useState(false);
    const [poolBusy, setPoolBusy] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = useRef<HTMLButtonElement>(null);
    const busy = marketBusy || poolBusy;
    const hasChanges = Boolean(marketAttempted || marketId || poolDetails || baseAmount !== '100' || quoteAmount !== '0.1');

    const handleReset = () => {
        if (busy) return;
        setMarketAttempted(false);
        setMarketId(null);
        setMarketDetails(null);
        setPoolDetails(null);
        setBaseAmount('100');
        setQuoteAmount('0.1');
        setResetKey(key => key + 1);
        onClose();
    };

    return <>
        <PoolGuide tokenMint={tokenMint} stage={poolDetails ? 'done' : marketId ? 'deposit' : 'market'}>
            <MarketCreator key={resetKey} tokenMint={tokenMint} ready={Boolean(marketId)} onBusyChange={value => { setMarketBusy(value); if (value) setMarketAttempted(true); }} onMarketCreated={(id, details) => { setMarketId(id); setMarketDetails(details); }} />
            {marketDetails && <MarketDetails details={marketDetails} poolCreated={Boolean(poolDetails)} />}
            {marketId && <>
                {!poolDetails && <AmountInputs baseAmount={baseAmount} quoteAmount={quoteAmount} onBaseAmountChange={setBaseAmount} onQuoteAmountChange={setQuoteAmount} isDisabled={poolBusy} />}
                <PoolCreator marketId={marketId} tokenMint={tokenMint} baseAmount={baseAmount} quoteAmount={quoteAmount} done={Boolean(poolDetails)} onBusyChange={setPoolBusy} onPoolCreated={setPoolDetails} />
                {poolDetails && <PoolDetails details={poolDetails} tokenMint={tokenMint} />}
            </>}
            {hasChanges && <Button size="sm" variant="ghost" onClick={onOpen} isDisabled={busy}>{t("CreatePool.manageLocalRecords")}</Button>}
        </PoolGuide>
        <AlertDialog isOpen={isActive && isOpen} leastDestructiveRef={cancelRef} onClose={onClose} isCentered>
            <AlertDialogOverlay>
                <AlertDialogContent mx={3}>
                    <AlertDialogHeader fontSize="lg">{t("CreatePool.clearThisPoolCreationRecord")}</AlertDialogHeader>
                    <AlertDialogBody>
                        <Text mb={3}>{t("CreatePool.switchingLessonsKeepsThisStepClearingIsUnnecessaryRefreshing")}</Text>
                        <Text fontSize="sm" color="gray.600">{t("CreatePool.clearingAffectsOnlyTheLocalFormItDoesNot")}</Text>
                    </AlertDialogBody>
                    <AlertDialogFooter flexWrap="wrap" gap={2}>
                        <Button ref={cancelRef} onClick={onClose}>{t("CreatePool.keepRecords")}</Button>
                        <Button colorScheme="red" variant="outline" onClick={handleReset} isDisabled={busy}>{t("CreatePool.clearLocalRecords")}</Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    </>;
};

export default CreatePool;
