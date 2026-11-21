import { useT } from '../../i18n/useT';
import React from 'react';
import { CheckIcon, CopyIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { Box, Flex, IconButton, Link, Text, useClipboard } from '@chakra-ui/react';
import { explorerUrl } from '../../lib/solana/config';

interface AccountAddressProps {
    label: string;
    value: string;
    description?: string;
    type?: 'address' | 'tx';
    compact?: boolean;
}

export function AccountAddress({ label, value, description, type = 'address', compact = false }: AccountAddressProps) {
    const t = useT();
    const { hasCopied, onCopy } = useClipboard(value);
    const display = compact && value.length > 32 ? `${value.slice(0, 12)}…${value.slice(-12)}` : value;
    return (
        <Box bg="gray.50" borderRadius="lg" p={3} minW={0}>
            <Flex align="center" justify="space-between" gap={2} mb={1}>
                <Text fontSize="xs" color="gray.600" fontWeight="semibold">{label}</Text>
                <IconButton size="xs" variant="ghost" colorScheme={hasCopied ? 'green' : 'gray'}
                    aria-label={t(hasCopied ? 'common.copiedAddress' : 'common.copyAddress', { label })}
                    icon={hasCopied ? <CheckIcon /> : <CopyIcon />} onClick={onCopy} flexShrink={0} />
            </Flex>
            <Link href={explorerUrl(value, type)} isExternal color="purple.700" fontFamily="mono" fontSize="xs"
                overflowWrap="anywhere" title={`${label}：${value}（Devnet Explorer）`}>
                {display} <ExternalLinkIcon mx={0.5} />
            </Link>
            {description && <Text fontSize="xs" color="gray.500" mt={2} lineHeight="tall">{description}</Text>}
        </Box>
    );
}
