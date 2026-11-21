import { useT } from '../../i18n/useT';
import React from 'react';
import { Box, Button, Flex, FormControl, FormHelperText, FormLabel, Input, Text, VStack } from '@chakra-ui/react';
import type { TransactionUpdate } from '../../lib/solana/transactions';
import { TransactionFeedback } from '../common/TransactionFeedback';
import { AccountAddress } from '../common/AccountAddress';
import { LessonLayout, Notice, Panel } from '../learning/LessonLayout';
import { TokenInput } from './TokenInput';
import type { TokenInfo } from './types';

export interface SwapViewProps {
    tokenA: TokenInfo | null; tokenB: TokenInfo | null; amount: string; slippage: string; loading: boolean; swapping: boolean; error: string; walletReady: boolean;
    quote: { output: string; minimum: string; priceImpact: string; poolId: string } | null;
    updates: TransactionUpdate[];
    onAmountChange: (value: string) => void; onSlippageChange: (value: string) => void; onSelect: (side: 'a' | 'b') => void; onReverse: () => void; onPreview: () => void;
}
export function SwapView(props: SwapViewProps) {
    const t = useT();
    return <LessonLayout id="swap" feedback={<TransactionFeedback updates={props.updates} />}>
        <Panel title={t("TokenSwap.chooseADirectionThenGetAQuote")} description={t("TokenSwap.quotesAreReadOnlyPreviewingDoesNotSendA")}>
            <VStack align="stretch" spacing={4}>
                <Box as="fieldset" disabled={props.swapping} minW={0}>
                    <TokenInput value={props.amount} onChange={props.onAmountChange} token={props.tokenA} onTokenSelect={() => props.onSelect('a')} isDisabled={props.swapping} />
                    <Flex justify="center" my={2}><Button size="sm" variant="ghost" aria-label={t("TokenSwap.reverseInputAndOutputTokens")} onClick={props.onReverse} isDisabled={props.swapping}>↓↑</Button></Flex>
                    <TokenInput value={props.quote?.output || ''} token={props.tokenB} onTokenSelect={() => props.onSelect('b')} isOutput isDisabled={props.swapping} />
                    <FormControl mt={5}><FormLabel htmlFor="swap-slippage">{t("TokenSwap.slippageTolerance")}<Text as="span" color="gray.400" fontWeight="normal">（%）</Text></FormLabel><Input id="swap-slippage" value={props.slippage} onChange={e => props.onSlippageChange(e.target.value)} inputMode="decimal" aria-describedby="swap-slippage-help" isDisabled={props.swapping} /><FormHelperText id="swap-slippage-help">{t("TokenSwap.range05AtMostTwoDecimalsThisCalculates")}</FormHelperText></FormControl>
                </Box>
                {props.loading && <Notice>{t("TokenSwap.findingAMatchingPoolAndCalculatingAQuote")}</Notice>}
                {props.error && <Notice tone="error">{props.error}</Notice>}
                {props.quote ? <Box bg="gray.50" borderRadius="lg" p={4}>
                    <Flex justify="space-between" gap={3} wrap="wrap"><Text fontSize="sm" color="gray.500">{t("TokenSwap.minimumReceived")}</Text><Text fontSize="sm" fontWeight="semibold" overflowWrap="anywhere">{props.quote.minimum} {props.tokenB?.symbol}</Text></Flex>
                    <Flex justify="space-between" gap={3} wrap="wrap" mt={2}><Text fontSize="sm" color="gray.500">{t("TokenSwap.priceImpact")}</Text><Text fontSize="sm" fontWeight="medium">{props.quote.priceImpact}%</Text></Flex>
                    <Box mt={3}><AccountAddress label={t("TokenSwap.poolIdUsedForThisQuote")} value={props.quote.poolId} compact /></Box>
                </Box> : !props.loading && !props.error && <Text fontSize="xs" color="gray.500">{t("TokenSwap.selectTwoDifferentTokensAndEnterAnInputAmount")}</Text>}
                <Button onClick={props.onPreview} isLoading={props.swapping} loadingText={t("TokenSwap.swappingCheckYourWallet")} isDisabled={!props.quote || !props.walletReady || props.loading || props.swapping}>{t("TokenSwap.previewSwapAndMinimumReceived")}</Button>
                <Text fontSize="xs" color="gray.400">{t("TokenSwap.calculatedFromCurrentPoolStateWithNoReturnGuarantee")}</Text>
            </VStack>
        </Panel>
    </LessonLayout>;
}
