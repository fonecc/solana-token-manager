import { useT } from '../../i18n/useT';
import React from 'react';
import { Box, Button, Flex, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Text, VStack } from '@chakra-ui/react';
import { AccountAddress } from '../common/AccountAddress';
import { Notice } from '../learning/LessonLayout';
import type { TokenInfo } from './types';

interface SwapConfirmModalProps {
    isOpen: boolean; onClose: () => void; tokenA: TokenInfo | null; tokenB: TokenInfo | null;
    amountIn: string; amountOut: string; minAmountOut: string; exchangeRate: string | null;
    priceImpact: string | null; slippage: number; poolId?: string; onConfirm: () => void; isSwapping: boolean;
}
export const SwapConfirmModal = (props: SwapConfirmModalProps) => {
    const t = useT(); return (<Modal isOpen={props.isOpen} onClose={() => { if (!props.isSwapping) props.onClose(); }} isCentered closeOnOverlayClick={false} closeOnEsc={!props.isSwapping} scrollBehavior="inside">
    <ModalOverlay /><ModalContent><ModalHeader>{t("TokenSwap.reviewThisSwap")}</ModalHeader><ModalCloseButton isDisabled={props.isSwapping} aria-label={t("TokenSwap.closeSwapPreview")} />
        <ModalBody>
            <VStack align="stretch" spacing={4}>
                <Text fontSize="sm" color="gray.500">{t("TokenSwap.aPreviewIsNotAnExecutedTradeCheckThe")}</Text>
                {[{ title: t("TokenSwap.youPay"), amount: props.amountIn, token: props.tokenA }, { title: t("TokenSwap.estimatedReceived"), amount: props.amountOut, token: props.tokenB }].map(item => <Box key={item.title} p={4} bg="gray.50" borderRadius="lg" minW={0}><Text fontSize="xs" color="gray.500">{item.title}</Text><Text fontSize="xl" fontWeight="semibold" overflowWrap="anywhere" my={2}>{item.amount || '—'} {item.token?.symbol}</Text>{item.token && <AccountAddress label={`${item.title} · Mint`} value={item.token.mint} compact />}</Box>)}
                <Box p={4} borderWidth="1px" borderColor="purple.200" borderRadius="lg"><Text fontSize="xs" color="gray.500">{t("TokenSwap.minimumReceivedInstructionProtection")}</Text><Text fontSize="lg" fontWeight="semibold" overflowWrap="anywhere" mt={1}>{props.minAmountOut || '—'} {props.tokenB?.symbol}</Text><Text fontSize="xs" color="gray.500" mt={2}>{t("TokenSwap.aTradeCannotExecuteUnderThisConditionIfOutput")}</Text></Box>
                <Flex justify="space-between" gap={3} wrap="wrap"><Text fontSize="sm" color="gray.500">{t("TokenSwap.slippageTolerance")}</Text><Text fontSize="sm">{props.slippage}%</Text></Flex>
                <Flex justify="space-between" gap={3} wrap="wrap"><Text fontSize="sm" color="gray.500">{t("TokenSwap.priceImpact")}</Text><Text fontSize="sm">{props.priceImpact === null ? t("TokenSwap.notProvided") : `${props.priceImpact}%`}</Text></Flex>
                {props.exchangeRate && <Text fontSize="sm">{t("TokenSwap.exchangeRate")}{props.exchangeRate}</Text>}
                {props.poolId && <AccountAddress label={t("TokenSwap.poolIdForThisQuote")} value={props.poolId} compact />}
                <Notice>{t("TokenSwap.theSamePoolIsCheckedAgainBeforeSubmissionAn")}</Notice>
            </VStack>
        </ModalBody>
        <ModalFooter><Button variant="ghost" onClick={props.onClose} isDisabled={props.isSwapping}>{t("TokenSwap.backToEdit")}</Button><Button onClick={props.onConfirm} isLoading={props.isSwapping} loadingText={t("TokenMetadata.processingCheckYourWallet")} isDisabled={!props.tokenA || !props.tokenB || !props.minAmountOut || props.isSwapping}>{t("TokenSwap.confirmSwapAndRequestSignature")}</Button></ModalFooter>
    </ModalContent>
</Modal>); };
