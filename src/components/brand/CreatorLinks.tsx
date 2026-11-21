import React from 'react';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { useT } from '../../i18n/useT';

export const creator = {
    name: '0xF1',
    website: 'https://fone.cc',
    repository: 'https://github.com/fonecc/solana-token-manager',
} as const;

export function CreatorLinks({ compact = false }: { compact?: boolean }) {
    const t = useT();
    return <Box minW={0}>
        <Text fontSize="xs" color="gray.600" fontWeight="medium">{t('site.createdBy', { author: creator.name })}</Text>
        {!compact && <Text fontSize="xs" color="gray.500" mt={2} lineHeight="tall">{t('site.creatorInvitation')}</Text>}
        <Flex columnGap={compact ? 5 : 2} rowGap={2} wrap="wrap" mt={2}>
            <Button as="a" href={creator.website} target="_blank" rel="noopener noreferrer" size="sm" variant={compact ? 'link' : 'outline'} colorScheme="purple" aria-label={t('site.authorWebsiteLabel', { author: creator.name })}>{t('site.authorWebsite')} ↗</Button>
            <Button as="a" href={creator.repository} target="_blank" rel="noopener noreferrer" size="sm" variant={compact ? 'link' : 'ghost'} colorScheme="purple" aria-label={t('site.sourceCodeLabel')}>{t('site.sourceCode')} ↗</Button>
        </Flex>
    </Box>;
}
