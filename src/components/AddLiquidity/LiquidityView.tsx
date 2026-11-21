import { useT } from '../../i18n/useT';
import React, { useState } from 'react';
import { Box, Button, Flex, FormControl, FormHelperText, FormLabel, Input, Text, VStack } from '@chakra-ui/react';
import type { TransactionUpdate } from '../../lib/solana/transactions';
import { AccountAddress } from '../common/AccountAddress';
import { TransactionFeedback } from '../common/TransactionFeedback';
import { LessonLayout, Notice, Panel } from '../learning/LessonLayout';

export interface LiquidityViewProps {
    poolId: string; mintA: string; mintB: string; amount: string;
    pool: { id: string; baseMint: string; quoteMint: string; baseDecimals: number; quoteDecimals: number } | null;
    quote: { output: string; max: string } | null;
    loading: boolean; submitting: boolean; error: string; confirmed: boolean; updates: TransactionUpdate[];
    onPoolIdChange: (value: string) => void; onMintAChange: (value: string) => void; onMintBChange: (value: string) => void; onAmountChange: (value: string) => void;
    onLoad: (byPair: boolean) => void; onSubmit: () => void; onClose?: () => void;
}
export function LiquidityView(props: LiquidityViewProps) {
    const t = useT();
    const [byPair, setByPair] = useState(false);
    const busy = props.loading || props.submitting;
    return <LessonLayout id="liquidity" feedback={<TransactionFeedback updates={props.updates} />} result={props.confirmed && <Notice tone="success">{t("AddLiquidity.liquidityTransactionConfirmedCheckTheTransactionRecordForThe")}</Notice>}>
        <VStack align="stretch" spacing={4}>
            {props.error && <Notice tone="error">{props.error}</Notice>}
            <Panel title={t("AddLiquidity.1FindThePool")} description={t("AddLiquidity.useThePoolIdNotTheMarketIdOr")}>
                <VStack as="fieldset" disabled={busy} spacing={4} align="stretch">
                    <Flex gap={2} role="group" aria-label={t("AddLiquidity.poolLookupMethod")}><Button size="sm" variant={!byPair ? 'solid' : 'outline'} aria-pressed={!byPair} onClick={() => setByPair(false)}>{t("AddLiquidity.byPoolId")}</Button><Button size="sm" variant={byPair ? 'solid' : 'outline'} aria-pressed={byPair} onClick={() => setByPair(true)}>{t("AddLiquidity.byTokenPair")}</Button></Flex>
                    {!byPair ? <FormControl><FormLabel htmlFor="liquidity-pool-id">{t("AddLiquidity.poolIdLiquidityPoolAddress")}</FormLabel><Input id="liquidity-pool-id" value={props.poolId} onChange={e => props.onPoolIdChange(e.target.value)} placeholder={t("AddLiquidity.pasteThePoolIdSavedAfterPoolCreation")} /></FormControl> : <>
                        <FormControl><FormLabel htmlFor="liquidity-mint-a">{t("AddLiquidity.tokenAMint")}</FormLabel><Input id="liquidity-mint-a" value={props.mintA} onChange={e => props.onMintAChange(e.target.value)} /></FormControl>
                        <FormControl><FormLabel htmlFor="liquidity-mint-b">{t("AddLiquidity.tokenBMint")}</FormLabel><Input id="liquidity-mint-b" value={props.mintB} onChange={e => props.onMintBChange(e.target.value)} placeholder={t("AddLiquidity.forSolUseTheWsolMintNotAWallet")} /><FormHelperText overflowWrap="anywhere">WSOL Mint：So11111111111111111111111111111111111111112</FormHelperText></FormControl>
                    </>}
                    <Button variant="outline" size="sm" alignSelf="start" isLoading={props.loading} isDisabled={busy || (byPair ? !props.mintA || !props.mintB : !props.poolId)} onClick={() => props.onLoad(byPair)}>{t("AddLiquidity.readAndValidatePool")}</Button>
                </VStack>
            </Panel>
            {props.pool ? <Panel title={t("AddLiquidity.2EnterADepositAtTheCurrentPoolRatio")} description={t("AddLiquidity.checkThePoolAndBothMintsFirstEnterThe")}>
                <VStack align="stretch" spacing={3} mb={5}><AccountAddress label={t("AddLiquidity.currentlyLoadedPoolId")} value={props.pool.id} compact /><AccountAddress label={t("AddLiquidity.baseTokenDecimals", { v0: props.pool.baseDecimals })} value={props.pool.baseMint} compact /><AccountAddress label={t("AddLiquidity.quoteTokenDecimals", { v0: props.pool.quoteDecimals })} value={props.pool.quoteMint} compact /></VStack>
                <VStack as="fieldset" disabled={props.submitting} align="stretch" spacing={4}>
                    <FormControl><FormLabel htmlFor="liquidity-base-amount">{t("AddLiquidity.baseTokenDeposit")}</FormLabel><Input id="liquidity-base-amount" value={props.amount} onChange={e => props.onAmountChange(e.target.value)} inputMode="decimal" placeholder={t("AddLiquidity.enterASmallTestAmount")} aria-describedby="liquidity-amount-help" /><FormHelperText id="liquidity-amount-help">{t("AddLiquidity.theSdkWrapsNativeSolAsNeededReserveAdditional")}</FormHelperText></FormControl>
                    <Box bg="gray.50" borderRadius="lg" p={4}><Flex justify="space-between" gap={3} wrap="wrap"><Text fontSize="sm" color="gray.500">{t("AddLiquidity.estimatedQuoteSideDeposit")}</Text><Text fontSize="sm" fontWeight="semibold" overflowWrap="anywhere">{props.quote?.output || '—'}</Text></Flex><Flex justify="space-between" gap={3} wrap="wrap" mt={2}><Text fontSize="sm" color="gray.500">{t("AddLiquidity.maximumQuoteSideDeposit1")}</Text><Text fontSize="sm" fontWeight="semibold" overflowWrap="anywhere">{props.quote?.max || '—'}</Text></Flex></Box>
                    <Text fontSize="xs" color="gray.500">{t("AddLiquidity.estimatesAreNotActualDebitsTheRatioIsChecked")}</Text>
                    <Button onClick={props.onSubmit} isLoading={props.submitting} loadingText={t("AddLiquidity.submittingCheckYourWallet")} isDisabled={!props.quote || busy}>{t("AddLiquidity.confirmDepositAndAddLiquidity")}</Button>
                </VStack>
            </Panel> : <Box px={4} py={5} borderWidth="1px" borderStyle="dashed" borderColor="gray.300" borderRadius="xl"><Text fontSize="sm" color="gray.500">{t("AddLiquidity.loadAPoolBeforeEnteringADepositAnUnqueried")}</Text></Box>}
            {props.onClose && <Button variant="ghost" onClick={props.onClose} isDisabled={props.submitting}>{t("AddLiquidity.closeThisWorkspace")}</Button>}
        </VStack>
    </LessonLayout>;
}
