import React from 'react';
import { Box, Heading, HStack, Text } from '@chakra-ui/react';
import { useT } from '../../i18n/useT';

export function Brand({ heading = 'span', subtitle = true }: { heading?: 'h1' | 'span'; subtitle?: boolean }) {
    const t = useT();
    return <HStack spacing={3} minW={0} maxW="full" align="center">
        <Box as="img" src="/brand/token-lab.svg" alt="" aria-hidden="true" width="48px" height="48px" flexShrink={0} />
        <Box minW={0}>
            <Heading as={heading} fontSize={{ base: 'lg', md: 'xl' }} lineHeight={1.3}>Solana Token Lab</Heading>
            {subtitle && <Text fontSize="xs" fontWeight="normal" color="gray.400" mt={1}>{t('learning.understandAccountsPracticeTransactionsVerifyResults')}</Text>}
        </Box>
    </HStack>;
}
