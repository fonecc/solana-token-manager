import { useT } from '../../i18n/useT';
import React from 'react';
import { ChevronDownIcon, CopyIcon } from '@chakra-ui/icons';
import {
    Avatar, Badge, Box, Button, Flex, HStack, IconButton, Menu,
    MenuButton, MenuDivider, MenuGroup, MenuItem, MenuList, Portal, Text, Wrap,
} from '@chakra-ui/react';
import type { WalletToken } from '../../lib/solana/accounts';

export type TokenAction = 'transfer' | 'mint' | 'metadata' | 'freeze' | 'createPool' | 'addLiquidity' | 'burn' | 'revokeMint' | 'revokeFreeze';

interface TokenCardProps {
    token: WalletToken;
    walletAddress: string;
    isBusy?: boolean;
    onAction: (action: TokenAction, token: WalletToken) => void;
    onCopy: (address: string) => void;
}

export function TokenCard({ token, walletAddress, isBusy = false, onAction, onCopy }: TokenCardProps) {
    const t = useT();
    const displayName = token.name || t('TokenList.unknownName');
    const displaySymbol = token.symbol || t('TokenList.unknownToken');
    const canMint = Boolean(walletAddress && token.mintAuthority === walletAddress);
    const canFreeze = Boolean(walletAddress && token.freezeAuthority === walletAddress);
    const canEditMetadata = canMint || Boolean(walletAddress && token.metadataUpdateAuthority === walletAddress);
    const hasBalance = BigInt(token.rawAmount) > 0n;
    const action = (value: TokenAction) => () => onAction(value, token);

    return (
        <Box as="article" borderWidth="1px" borderColor="gray.200" bg="white" borderRadius="xl" p={{ base: 4, md: 5 }} minW={0}>
            <Flex direction={{ base: 'column', lg: 'row' }} align={{ base: 'stretch', lg: 'center' }} gap={5}>
                <Flex flex="1" minW={0} align="flex-start" gap={3}>
                    <Avatar name={displaySymbol || '?'} src={token.image} size="sm" mt={1} flexShrink={0} bg="purple.50" color="purple.700" />
                    <Box minW={0} flex="1">
                        <Flex align="baseline" gap={2} wrap="wrap">
                            <Text fontWeight="semibold" overflowWrap="anywhere">{displayName}</Text>
                            <Text fontSize="sm" color="gray.500" overflowWrap="anywhere">{displaySymbol}</Text>
                        </Flex>
                        <Text mt={1} fontSize="sm" color="gray.600" overflowWrap="anywhere">
                            {t("TokenList.balance")}<Box as="span" fontWeight="medium" color="gray.800" sx={{ fontVariantNumeric: 'tabular-nums' }}>{token.amount}</Box>
                        </Text>
                        <HStack spacing={1} mt={1} minW={0}>
                            <Text fontSize="xs" color="gray.400" flexShrink={0}>Mint</Text>
                            <Text fontFamily="mono" fontSize="xs" color="gray.500" isTruncated maxW={{ base: '180px', md: '280px' }} title={token.mint}>
                                {token.mint}
                            </Text>
                            <IconButton aria-label={t("TokenList.copyMintAddress", { v0: displaySymbol })} icon={<CopyIcon />} variant="ghost" size="xs" flexShrink={0} onClick={() => onCopy(token.mint)} />
                        </HStack>
                        {(canMint || canFreeze || canEditMetadata) && (
                            <Wrap spacing={2} mt={2}>
                                {canMint && <Badge variant="subtle" colorScheme="green">{t("TokenList.mintAuthority")}</Badge>}
                                {canFreeze && <Badge variant="subtle" colorScheme="blue">{t("TokenList.freezeAuthority")}</Badge>}
                                {token.metadataUpdateAuthority === walletAddress && <Badge variant="subtle" colorScheme="purple">{t("TokenList.metadataAuthority")}</Badge>}
                            </Wrap>
                        )}
                    </Box>
                </Flex>
                <Flex gap={2} wrap="wrap" align="center" flexShrink={0} borderTopWidth={{ base: '1px', lg: 0 }} borderColor="gray.100" pt={{ base: 3, lg: 0 }}>
                    <Button size="sm" colorScheme="purple" isDisabled={!hasBalance || isBusy} onClick={action('transfer')}>
                        {t("TokenList.transfer")}</Button>
                    {canMint && <Button size="sm" variant="outline" colorScheme="purple" isDisabled={isBusy} onClick={action('mint')}>{t("TokenList.mint")}</Button>}
                    <Menu placement="bottom-end" strategy="fixed" isLazy>
                        <MenuButton as={Button} size="sm" variant="outline" rightIcon={<ChevronDownIcon />} isDisabled={isBusy} aria-label={t("TokenList.moreActionsFor", { v0: displaySymbol })}>
                            {t("TokenList.moreActions")}</MenuButton>
                        <Portal>
                            <MenuList minW="min(16rem, calc(100vw - 2rem))" maxW="calc(100vw - 2rem)" zIndex="popover" fontSize="sm" boxShadow="lg">
                                {(canEditMetadata || canFreeze) && <>
                                    <MenuGroup title={t("TokenList.tokenManagement")}>
                                        {canEditMetadata && <MenuItem onClick={action('metadata')}>{t("TokenList.setMetadata")}</MenuItem>}
                                        {canFreeze && <MenuItem onClick={action('freeze')}>{t("TokenList.freezeThawAccount")}</MenuItem>}
                                    </MenuGroup>
                                    <MenuDivider />
                                </>}
                                <MenuGroup title={t("TokenList.defiAdvanced")}>
                                    <MenuItem onClick={action('createPool')}>{t("TokenList.createLiquidityPool")}</MenuItem>
                                    <MenuItem onClick={action('addLiquidity')}>{t("TokenList.addLiquidity")}</MenuItem>
                                </MenuGroup>
                                <MenuDivider />
                                <MenuGroup title={t("TokenList.dangerZoneUseCaution")}>
                                    <MenuItem color="red.600" onClick={action('burn')}>{t("TokenList.burnTokens")}</MenuItem>
                                    {canMint && <MenuItem color="red.600" onClick={action('revokeMint')}>{t("TokenList.permanentlyRevokeMintAuthority")}</MenuItem>}
                                    {canFreeze && <MenuItem color="red.600" onClick={action('revokeFreeze')}>{t("TokenList.permanentlyRevokeFreezeAuthority")}</MenuItem>}
                                </MenuGroup>
                            </MenuList>
                        </Portal>
                    </Menu>
                    {!hasBalance && <Text fontSize="xs" color="gray.500">{t("TokenList.noBalanceToTransfer")}</Text>}
                </Flex>
            </Flex>
        </Box>
    );
}
