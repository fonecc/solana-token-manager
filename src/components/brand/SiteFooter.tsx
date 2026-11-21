import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { useT } from '../../i18n/useT';
import { CreatorLinks } from './CreatorLinks';

export function SiteFooter() {
    const t = useT();
    return <Box as="footer" borderTopWidth="1px" borderColor="gray.200" mt={{ base: 8, md: 12 }} pt={6} pb={4}>
        <Flex justify="space-between" align="flex-start" gap={5} wrap="wrap">
            <Text fontSize="xs" color="gray.500" maxW="full">{t('site.footer')}</Text>
            <CreatorLinks compact />
        </Flex>
    </Box>;
}
