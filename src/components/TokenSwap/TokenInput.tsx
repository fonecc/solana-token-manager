import { useT } from '../../i18n/useT';
import React from 'react';
import { Box, Button, Flex, FormControl, FormLabel, Input, Text, VStack } from '@chakra-ui/react';

interface TokenInputProps {
    value: string;
    onChange?: (value: string) => void;
    token: { mint: string; symbol: string; icon?: string; balance?: string } | null;
    onTokenSelect: () => void;
    balance?: string;
    isOutput?: boolean;
    isDisabled?: boolean;
}
export const TokenInput = ({ value, onChange, token, onTokenSelect, balance, isOutput = false, isDisabled = false }: TokenInputProps) => {
    const t = useT();
    const id = isOutput ? 'swap-output-amount' : 'swap-input-amount';
    return <Box borderWidth="1px" borderColor="gray.200" borderRadius="xl" p={4} minW={0} bg={isOutput ? 'gray.50' : 'white'}>
        <VStack align="stretch" spacing={3}>
            <Flex justify="space-between" align="start" gap={2} wrap="wrap"><FormLabel htmlFor={id} mb={0} color="gray.500" fontSize="xs">{isOutput ? t("TokenSwap.estimatedReceived") : t("TokenSwap.amountToPay")}</FormLabel>{(balance ?? token?.balance) !== undefined && <Text fontSize="xs" color="gray.400" overflowWrap="anywhere">{t("TokenList.balance")}{balance ?? token?.balance}</Text>}</Flex>
            <Flex gap={3} align="center" wrap="wrap">
                <FormControl flex="1" minW="100px"><Input id={id} value={value} onChange={e => onChange?.(e.target.value)} isReadOnly={isOutput} isDisabled={isDisabled} inputMode="decimal" placeholder={isOutput ? t("TokenSwap.waitingForQuote") : '0.0'} fontSize="xl" fontWeight="semibold" variant="unstyled" aria-label={isOutput ? t("TokenSwap.estimatedOutputAmount") : t("TokenSwap.amountToPay")} /></FormControl>
                <Button size="sm" variant="outline" maxW="full" h="auto" py={2} onClick={onTokenSelect} isDisabled={isDisabled} aria-label={isOutput ? t("TokenSwap.selectOutputToken") : t("TokenSwap.selectInputToken")}><Text overflowWrap="anywhere">{token?.symbol || t("TokenSwap.selectToken")} ↓</Text></Button>
            </Flex>
            {token && <Text fontSize="xs" color="gray.400" fontFamily="mono" overflowWrap="anywhere" title={token.mint}>Mint · {token.mint.slice(0, 8)}…{token.mint.slice(-8)}</Text>}
        </VStack>
    </Box>;
};
