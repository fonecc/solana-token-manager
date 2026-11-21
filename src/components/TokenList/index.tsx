import { AppError, message as msg, describeError } from '../../i18n/message';
import { useT, useMessageState, useErrorMessage } from '../../i18n/useT';
import { useLearning, useWorkspaceOperation } from '../learning/LearningContext';
import { RepeatIcon } from '@chakra-ui/icons';
import {
Accordion,
AccordionItem,
AccordionButton,
AccordionPanel,
AccordionIcon,
Flex,
Alert,
AlertDescription,
AlertDialog,
AlertDialogBody,
AlertDialogContent,
AlertDialogFooter,
AlertDialogHeader,
AlertDialogOverlay,
AlertIcon,
AlertTitle,
Box,
Button,
Center,
FormControl,
FormLabel,
IconButton,
Input,
ListItem,
Modal,
ModalBody,
ModalCloseButton,
ModalContent,
ModalFooter,
ModalHeader,
ModalOverlay,
NumberInput,
NumberInputField,
Spinner,
Tab,
TabList,
TabPanel,
TabPanels,
Tabs,
Text,
UnorderedList,
VStack,
useToast
} from '@chakra-ui/react';
import {
AuthorityType,
createSetAuthorityInstruction
} from '@solana/spl-token';
import { useConnection,useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL,PublicKey,SystemProgram,Transaction } from '@solana/web3.js';
import React,{ useMemo,useState } from 'react';
import { useWalletTokens } from '../../hooks/useWalletTokens';
import { type WalletToken } from '../../lib/solana/accounts';
import { positiveTokenAmount } from '../../lib/solana/amounts';

import { buildTransferTransaction } from '../../lib/solana/tokens';
import { executeTransaction } from '../../lib/solana/transactions';
import { TransactionFeedback,useTransactionFeedback } from '../common/TransactionFeedback';

import { LessonLayout, Notice } from '../learning/LessonLayout';
import { validAmount } from '../learning/amountValidation';
import { AccountAddress } from '../common/AccountAddress';
import { TokenCard, type TokenAction } from './TokenCard';
import dynamic from 'next/dynamic';
const AddLiquidity = dynamic(() => import('../AddLiquidity').then(module => module.AddLiquidity));

type TokenAccount = WalletToken;

interface TokenListProps {
    setMintAddress: (value: string) => void;
    setName: (value: string) => void;
    setSymbol: (value: string) => void;
    setUri: (value: string) => void;
    setMetadataTabIndex: (value: number) => void;
    setMintTokenAddress: (value: string) => void;
    onNavigate: (index: number) => void;
}

// 将 TransferModal 抽离为独立组件
const TransferModal = React.memo(({ 
    isOpen,
    onClose,
    selectedToken,
    sendAddress,
    sendAmount,
    setSendAddress,
    setSendAmount,
    isTransferring,
    handleTransferToken,
    error
}: {
    isOpen: boolean;
    onClose: () => void;
    selectedToken: TokenAccount | null;
    sendAddress: string;
    sendAmount: string;
    setSendAddress: (value: string) => void;
    setSendAmount: (value: string) => void;
    isTransferring: boolean;
    error: string;
    handleTransferToken: (token: TokenAccount, recipientAddress: string, amount: string) => Promise<void>;
}) => {
    const t = useT(); return ((
    <Modal 
        isOpen={isOpen} 
        onClose={() => { if (!isTransferring) onClose(); }}
        closeOnEsc={!isTransferring}
        closeOnOverlayClick={false}
        isCentered
    >
        <ModalOverlay />
        <ModalContent>
            <ModalHeader>
                {t("TokenList.transferTitle", { symbol: selectedToken?.symbol || '—' })}
            </ModalHeader>
            <ModalCloseButton isDisabled={isTransferring} aria-label={t("TokenList.closeTokenTransfer")} />
            <ModalBody>
                {error && <Box mb={4}><Notice tone="error">{error}</Notice></Box>}
                <VStack as="fieldset" disabled={isTransferring} spacing={4} align="stretch">
                    {selectedToken && <AccountAddress label={t("TokenList.mintBeingTransferred")} value={selectedToken.mint} compact />}
                    <Notice>{t("TokenList.transferExistingTokensFromYourAtaWithoutChangingTotal")}</Notice>
                    <FormControl isRequired>
                        <FormLabel htmlFor="token-transfer-recipient">{t("MintToken.recipientWalletAddress")}</FormLabel>
                        <Input id="token-transfer-recipient"
                            value={sendAddress}
                            onChange={(e) => setSendAddress(e.target.value)}
                            placeholder={t("TokenList.enterRecipientWalletAddress")}
                        />
                    </FormControl>
                    <FormControl isRequired>
                        <FormLabel htmlFor="token-transfer-amount">{t("TokenList.amountToSend")}</FormLabel>
                        <Input id="token-transfer-amount"
                            inputMode="decimal"
                            value={sendAmount}
                            onChange={(e) => setSendAmount(e.target.value)}
                            placeholder={t("TokenList.enterAmount", { v0: selectedToken?.symbol || '—' })}
                        />
                        <Text fontSize="sm" color="gray.500" mt={1}>
                            {t("TokenList.transferBalance", { amount: selectedToken?.amount || '—', symbol: selectedToken?.symbol || '—' })}</Text>
                    </FormControl>
                </VStack>
            </ModalBody>
            <ModalFooter flexWrap="wrap" gap={2}>
                <Button 
                    colorScheme="purple"
                    mr={3} 
                    onClick={() => {
                        if (selectedToken) {
                            handleTransferToken(selectedToken, sendAddress, sendAmount);
                        }
                    }}
                    isLoading={isTransferring}
                    loadingText={t("TokenList.transferring")}
                    isDisabled={
                        !sendAddress || !selectedToken || isTransferring ||
                        !validAmount(sendAmount, selectedToken.decimals, selectedToken.rawAmount)
                    }
                >
                    {t("TokenList.confirmTransferAndRequestSignature")}</Button>
                <Button variant="ghost" onClick={onClose} isDisabled={isTransferring}>
                    {t("TokenList.cancel")}</Button>
            </ModalFooter>
        </ModalContent>
    </Modal>
)); });

// 添加显示名称以解决 lint 警告
TransferModal.displayName = 'TransferModal';

// SOL 转账表单
const SolTransferForm = React.memo(({ 
    solSendAddress,
    solSendAmount,
    setSolSendAddress,
    setSolSendAmount,
    solBalance,
    isSendingSol,
    operationActive,
    handleSendSol
}: {
    solSendAddress: string;
    solSendAmount: string;
    setSolSendAddress: (value: string) => void;
    setSolSendAmount: (value: string) => void;
    solBalance: number | null;
    isSendingSol: boolean;
    operationActive?: boolean;
    handleSendSol: () => Promise<void>;
}) => {
    const t = useT(); return ((
    <Box as="fieldset" disabled={isSendingSol || operationActive}>
        <Box mb={4}><Notice>{t("TokenList.sendingNativeSolDoesNotChangeTokenSupplyLeave")}</Notice></Box>
        <FormControl isRequired mb={2}>
            <FormLabel htmlFor="sol-transfer-recipient">{t("MintToken.recipientWalletAddress")}</FormLabel>
            <Input id="sol-transfer-recipient"
                placeholder={t("TokenList.enterRecipientWalletAddress")}
                value={solSendAddress}
                onChange={(e) => setSolSendAddress(e.target.value)}
            />
        </FormControl>
        <FormControl isRequired mb={2}>
            <FormLabel htmlFor="sol-transfer-amount">{t("TokenList.solAmountToSend")}</FormLabel>
            <Input id="sol-transfer-amount" inputMode="decimal" value={solSendAmount} onChange={e => setSolSendAmount(e.target.value)} placeholder={t("TokenList.leaveSolForFees")} />
            <Text fontSize="sm" color="gray.500" mt={1}>
                {t("TokenList.availableBalance")}{solBalance === null ? t("TokenList.notRead") : solBalance.toFixed(4)} SOL
            </Text>
        </FormControl>
        <Button 
            colorScheme="purple"
            width="full"
            onClick={handleSendSol}
            isLoading={isSendingSol}
            loadingText={t("TokenList.sending")}
            isDisabled={!solSendAddress || !validAmount(solSendAmount, 9) || isSendingSol}
        >
            {t("TokenList.sendSol")}</Button>
    </Box>
)); });

SolTransferForm.displayName = 'SolTransferForm';

export const TokenList = ({
    setMintAddress,
    setName,
    setSymbol,
    setUri,
    setMetadataTabIndex,
    setMintTokenAddress,
    onNavigate
}: TokenListProps) => {
    const t = useT();
    const errorMessage = useErrorMessage();
    const { connection } = useConnection();
    const { publicKey, sendTransaction, signTransaction } = useWallet();
    const { tokens, solBalance, setSolBalance, isLoading, error, errorCode, refresh: fetchTokens } = useWalletTokens(connection, publicKey);
    const [operationError, setOperationError] = useMessageState();
    const [refreshWarning, setRefreshWarning] = useMessageState();
    const [solSendAddress, setSolSendAddress] = useState('');
    const [solSendAmount, setSolSendAmount] = useState('');
    const toast = useToast();
    const { operationActive } = useLearning();
    const workspaceOperation = useWorkspaceOperation('assets');
    const { updates, onUpdate } = useTransactionFeedback();
    const managedTokens = tokens.filter(token => [token.mintAuthority, token.freezeAuthority, token.metadataUpdateAuthority].includes(publicKey?.toBase58()));
    const isTimedOut = errorCode === 'hooks.accountReadTimedOutRefreshAndTryAgain';
    const FETCH_TIMEOUT = 30000; // 30 秒超时
    const [isSendingSol, setIsSendingSol] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [selectedToken, setSelectedToken] = useState<TokenAccount | null>(null);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [tokenSendAddress, setTokenSendAddress] = useState('');
    const [tokenSendAmount, setTokenSendAmount] = useState('');
    const [isDisablingMint, setIsDisablingMint] = useState(false);
    const [isDisablingFreeze, setIsDisablingFreeze] = useState(false);
    const [isDisableMintAlertOpen, setIsDisableMintAlertOpen] = useState(false);
    const [selectedTokenForDisable, setSelectedTokenForDisable] = useState<TokenAccount | null>(null);
    const [isDisableFreezeMintAlertOpen, setIsDisableFreezeAlertOpen] = useState(false);
    const [selectedTokenForDisableFreeze, setSelectedTokenForDisableFreeze] = useState<TokenAccount | null>(null);
    const cancelRef = React.useRef<HTMLButtonElement>(null);
    const [isCreatingPool, setIsCreatingPool] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
    const [selectedLiquidityToken, setSelectedLiquidityToken] = useState<TokenAccount | null>(null);

    const copyAddress = (address: string) => {
        navigator.clipboard.writeText(address).then(() => toast({
            title: t("TokenList.success"),
            description: t("TokenList.addressCopiedToClipboard"),
            status: "success",
            duration: 2000,
        })).catch(() => toast({ title: t("TokenList.copyFailedCopyTheMintAddressManually"), status: "error" }));
    };


    const handleTransferToken = async (
        token: TokenAccount,
        recipientAddress: string,
        amount: string
    ) => {
        if (!publicKey || !sendTransaction) {
            toast({
                title: t("TokenList.error"),
                description: t("TokenList.connectYourWalletFirst"),
                status: "error",
                duration: 3000,
            });
            return;
        }

        if (!workspaceOperation.begin()) return;
        try {
            setIsTransferring(true);
            setOperationError(''); setRefreshWarning('');

            const mintPubkey = new PublicKey(token.mint);
            const recipientPubkey = new PublicKey(recipientAddress);

            const transaction = await buildTransferTransaction(connection, mintPubkey, publicKey, recipientPubkey, amount);
            const signature = await executeTransaction(connection, { publicKey, signTransaction }, transaction, [], onUpdate);

            toast({
                title: t("TokenList.success"),
                description: t("TokenList.sentTo", { v0: amount, v1: token.symbol, v2: recipientAddress }),
                status: "success",
                duration: 5000,
                isClosable: true,
            });

            // 刷新代币列表
            fetchTokens();
            
            // 关闭转账模态框
            setIsTransferModalOpen(false);
            setSelectedToken(null);
            setTokenSendAddress('');
            setTokenSendAmount('');

        } catch (error) {
            setOperationError(error);
            if (errorMessage(error) === 'User rejected the request.') {
                toast({
                    title: t("TokenList.error"),
                    description: t("TokenList.transferCanceledWalletRequestRejected"),
                    status: "error",
                    duration: 5000,
                    isClosable: true
                });
            } else {
                console.error(t("TokenList.tokenTransferError"), error);
                toast({
                    title: t("TokenList.error"),
                    description: t('TokenList.transferFailedDetail', { reason: errorMessage(error) }),
                    status: "error",
                    duration: 3000,
                });
            }
        } finally {
            setIsTransferring(false);
            workspaceOperation.end();
        }
    };

    // 永久撤销铸币权限
    const handleDisableMint = async (token: TokenAccount) => {
        if (!publicKey || !sendTransaction) {
            toast({
                title: t("TokenList.error"),
                description: t("TokenList.connectYourWalletFirst"),
                status: "error",
                duration: 3000,
            });
            return;
        }

        if (!workspaceOperation.begin()) return;
        try {
            setIsDisablingMint(true);
            setOperationError(''); setRefreshWarning('');
            const mintPubkey = new PublicKey(token.mint);

            // 创建永久撤销铸币权限的指令
            const disableMintingInstruction = createSetAuthorityInstruction(
                mintPubkey,
                publicKey,
                AuthorityType.MintTokens,
                null  // 设置为 null 表示禁用该权限
            );

            // 创建并发送交易
            const transaction = new Transaction().add(disableMintingInstruction);

            const signature = await executeTransaction(connection, { publicKey, signTransaction }, transaction, [], onUpdate);

            toast({
                title: t("TokenList.success"),
                description: t("TokenList.mintAuthorityPermanentlyRevoked"),
                status: "success",
                duration: 5000,
            });

            // 刷新代币列表
            fetchTokens();

        } catch (error) {
            setOperationError(error);
            if (errorMessage(error) === 'User rejected the request.') {
                toast({
                    title: t("TokenList.error"),
                    description: t("TokenList.mintAuthorityRevocationCanceledWalletRequestRejected"),
                    status: "error",
                    duration: 5000,
                    isClosable: true
                });
            } else {
                console.error(t("TokenList.mintAuthorityRevocationError"), error);
                toast({
                    title: t("TokenList.error"),
                    description: t('TokenList.revokeMintFailedDetail', { reason: errorMessage(error) }),
                    status: "error",
                    duration: 3000,
                });
            }
        } finally {
            setIsDisablingMint(false);
            workspaceOperation.end();
        }
    };

    // 永久撤销冻结权限
    const handleDisableFreeze = async (token: TokenAccount) => {
        if (!publicKey || !sendTransaction) {
            toast({
                title: t("TokenList.error"),
                description: t("TokenList.connectYourWalletFirst"),
                status: "error",
                duration: 3000,
            });
            return;
        }

        if (!workspaceOperation.begin()) return;
        try {
            setIsDisablingFreeze(true);
            setOperationError(''); setRefreshWarning('');
            const mintPubkey = new PublicKey(token.mint);

            // 创建永久撤销冻结权限的指令
            const disableFreezeInstruction = createSetAuthorityInstruction(
                mintPubkey,
                publicKey,
                AuthorityType.FreezeAccount,
                null  // 设置为 null 表示禁用该权限
            );

            // 创建并发送交易
            const transaction = new Transaction().add(disableFreezeInstruction);

            const signature = await executeTransaction(connection, { publicKey, signTransaction }, transaction, [], onUpdate);

            toast({
                title: t("TokenList.success"),
                description: t("TokenList.freezeAuthorityPermanentlyRevoked"),
                status: "success",
                duration: 5000,
            });

            // 刷新代币列表
            fetchTokens();

        } catch (error) {
            setOperationError(error);
            if (errorMessage(error) === 'User rejected the request.') {
                toast({
                    title: t("TokenList.error"),
                    description: t("TokenList.freezeAuthorityRevocationCanceledWalletRequestRejected"),
                    status: "error",
                    duration: 5000,
                    isClosable: true
                });
            } else {
                console.error(t("TokenList.freezeAuthorityRevocationError"), error);
                toast({
                    title: t("TokenList.error"),
                    description: t('TokenList.revokeFreezeFailedDetail', { reason: errorMessage(error) }),
                    status: "error",
                    duration: 3000,
                });
            }
        } finally {
            setIsDisablingFreeze(false);
            workspaceOperation.end();
        }
    };

    const handleDisableMintClick = (token: TokenAccount) => {
        setSelectedTokenForDisable(token);
        setIsDisableMintAlertOpen(true);
    };

    const handleDisableMintConfirm = async () => {
        if (!selectedTokenForDisable) return;
        
        setIsDisableMintAlertOpen(false);
        await handleDisableMint(selectedTokenForDisable);
        setSelectedTokenForDisable(null);
    };

    const handleDisableFreezeClick = (token: TokenAccount) => {
        setSelectedTokenForDisableFreeze(token);
        setIsDisableFreezeAlertOpen(true);
    };

    const handleDisableFreezeConfirm = async () => {
        if (!selectedTokenForDisableFreeze) return;
        
        setIsDisableFreezeAlertOpen(false);
        await handleDisableFreeze(selectedTokenForDisableFreeze);
        setSelectedTokenForDisableFreeze(null);
    };

    // 修改 handleCreatePool 函数
    const handleCreatePool = async (token: TokenAccount) => {
        if (!publicKey || !sendTransaction) {
            toast({
                title: t("TokenList.error"),
                description: t("TokenList.connectYourWalletFirst"),
                status: "error",
                duration: 3000,
            });
            return;
        }
        // 自动填充代币地址
        setMintAddress(token.mint);
        
        // 根据条件设置标签页
        setMetadataTabIndex(token.hasMetadata ? 1 : 0);
        
        // 跳转到设置元数据标签页
        const tabIndex = 4; // 创建流动性池
        onNavigate(tabIndex);
    };

    const handleCardAction = (action: TokenAction, token: TokenAccount) => {
        if (operationActive) return;
        switch (action) {
            case 'transfer':
                setOperationError('');
                setSelectedToken(token);
                setIsTransferModalOpen(true);
                break;
            case 'mint':
                setMintAddress(token.mint);
                setMintTokenAddress(token.mint);
                onNavigate(3);
                break;
            case 'metadata':
                setMintAddress(token.mint);
                setName(token.name.replace(/\0/g, ''));
                setSymbol(token.symbol.replace(/\0/g, ''));
                setUri(token.uri?.replace(/\0/g, '') || '');
                setMetadataTabIndex(token.hasMetadata ? 1 : 0);
                onNavigate(2);
                break;
            case 'freeze': setMintAddress(token.mint); onNavigate(6); break;
            case 'createPool': void handleCreatePool(token); break;
            case 'addLiquidity': setMintAddress(token.mint); onNavigate(7); break;
            case 'burn': setMintAddress(token.mint); onNavigate(5); break;
            case 'revokeMint': handleDisableMintClick(token); break;
            case 'revokeFreeze': handleDisableFreezeClick(token); break;
        }
    };
    const isCardBusy = operationActive || isTransferring || isDisablingMint || isDisablingFreeze || isSendingSol || isCreatingPool;

    const LoadingOrErrorView = () => {
    const t = useT();
    const errorMessage = useErrorMessage();
        if (isLoading) {
            return (
                <Center p={8}>
                    <VStack spacing={4}>
                        <Spinner 
                            thickness="4px"
                            speed="0.65s"
                            emptyColor="gray.200"
                            color="purple.500"
                            size="xl"
                        />
                        <Text color="gray.500">{t("TokenList.loadingTokens")}</Text>
                    </VStack>
                </Center>
            );
        }

        if (error) {
            return (
                <Alert
                    status="error"
                    variant="subtle"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    height="200px"
                    borderRadius="md"
                >
                    <AlertIcon boxSize="40px" mr={0} />
                    <AlertTitle mt={4} mb={1} fontSize="lg">
                        {isTimedOut ? t("TokenList.loadingTimedOut") : t("TokenList.loadingFailed")}
                    </AlertTitle>
                    <AlertDescription maxWidth="sm">
                        {error}
                    </AlertDescription>
                    <Button
                        onClick={fetchTokens}
                        mt={4}
                        colorScheme="purple"
                        leftIcon={<RepeatIcon />}
                    >
                        {t("TokenList.retry")}</Button>
                </Alert>
            );
        }

        return null;
    };

    const handleSendSol = async () => {
        if (!publicKey || !solSendAddress || !solSendAmount || !sendTransaction) {
            toast({
                title: t("TokenList.error"),
                description: t("TokenList.completeTheTransferDetails"),
                status: "error",
                duration: 3000,
            });
            return;
        }

        if (!workspaceOperation.begin()) return;
        try {
            setIsSendingSol(true);
            setOperationError(''); setRefreshWarning('');

            // 验证接收地址
            const recipientPubkey = new PublicKey(solSendAddress);

            // 创建转账交易
            const transaction = new Transaction().add(
                SystemProgram.transfer({
                    fromPubkey: publicKey,
                    toPubkey: recipientPubkey,
                    lamports: positiveTokenAmount(solSendAmount, 9)
                })
            );

            // 获取最新的 blockhash

            const latest = await connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = latest.blockhash;
            transaction.feePayer = publicKey;
            const fee = await connection.getFeeForMessage(transaction.compileMessage(), 'confirmed');
            if (fee.value === null) throw new AppError(msg("TokenList.feeEstimationFailed"));
            const available = BigInt(await connection.getBalance(publicKey));
            if (positiveTokenAmount(solSendAmount, 9) + BigInt(fee.value) > available) throw new AppError(msg("TokenList.leaveEnoughSolToPayTransactionFees"));
            await executeTransaction(connection, { publicKey, signTransaction }, transaction, [], onUpdate);

            // 余额刷新失败不改变已经确认的交易结果。
            try {
                const newBalance = await connection.getBalance(publicKey);
                setSolBalance(newBalance / LAMPORTS_PER_SOL);
            } catch {
                setRefreshWarning(msg("TokenList.transferConfirmedButRefreshingTheBalanceFailedRefreshLater"));
                toast({ title: t("TokenList.transferConfirmedBalanceRefreshFailed"), description: t("TokenList.refreshLaterDoNotSubmitTheTransferAgain"), status: 'warning', duration: 8000 });
            }

            // 清空输入
            setSolSendAddress('');
            setSolSendAmount('');

            toast({
                title: t("TokenList.success"),
                description: t("TokenList.sentSolTo", { v0: solSendAmount, v1: solSendAddress }),
                status: "success",
                duration: 5000,
                isClosable: true,
            });

        } catch (error) {
            setOperationError(error);
            if (errorMessage(error) === 'User rejected the request.') {
                toast({
                    title: t("TokenList.error"),
                    description: t("TokenList.solTransferCanceledWalletRequestRejected"),
                    status: "error",
                    duration: 5000,
                    isClosable: true
                });
            } else {
                console.error(t("TokenList.solSendError"), error);
                toast({
                    title: t("TokenList.error"),
                    description: t('TokenList.solFailedDetail', { reason: errorMessage(error) }),
                    status: "error",
                    duration: 3000,
                });
            }
        } finally {
            setIsSendingSol(false);
            workspaceOperation.end();
        }
    };

    // 处理打开增加流动性对话框
    const handleOpenAddLiquidity = (token: TokenAccount) => {
        setSelectedLiquidityToken(token);
        setIsAddingLiquidity(true);
    };

    // 关闭增加流动性对话框
    const handleCloseAddLiquidity = () => {
        setIsAddingLiquidity(false);
        setSelectedLiquidityToken(null);
    };

    // 确保代币列表没有重复项
    const uniqueTokens = useMemo(() => {
        const seen = new Set();
        return tokens.filter(token => {
            // 使用mint地址作为唯一标识
            const key = token.mint;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }, [tokens]);

    return (
        <LessonLayout id="assets" feedback={<VStack align="stretch" spacing={3}><TransactionFeedback updates={updates} />{operationError && <Notice tone="error">{operationError}</Notice>}{refreshWarning && <Notice tone="warning">{refreshWarning}</Notice>}</VStack>}>
            <VStack spacing={4} align="stretch">
                <Flex justify="space-between" align="center" gap={3} wrap="wrap" bg="gray.50" p={4} borderRadius="xl">
                    <Box><Text fontSize="xs" color="gray.500" mb={1}>{t("TokenList.walletSolBalance")}</Text>
                    <Text fontSize="xl" fontWeight="semibold" sx={{ fontVariantNumeric: 'tabular-nums' }}>{isLoading || error ? '—' : solBalance.toFixed(4)} <Box as="span" fontSize="sm" color="gray.500">SOL</Box></Text></Box>
                    <Button
                        leftIcon={<RepeatIcon />}
                        onClick={fetchTokens}
                        isLoading={isLoading}
                        size="sm"
                    >
                        {t("TokenList.refreshBalances")}</Button>
                </Flex>

                <Accordion allowToggle borderColor="gray.200">
                    <AccordionItem borderWidth="1px" borderRadius="lg" overflow="hidden">
                        <AccordionButton py={3}><Box flex="1" textAlign="left" fontSize="sm" fontWeight="medium">{t("TokenList.sendSol")}</Box><AccordionIcon /></AccordionButton>
                        <AccordionPanel pt={2} pb={4}>
                <SolTransferForm 
                    solSendAddress={solSendAddress}
                    solSendAmount={solSendAmount}
                    setSolSendAddress={setSolSendAddress}
                    setSolSendAmount={setSolSendAmount}
                    solBalance={isLoading || error ? null : solBalance}
                    isSendingSol={isSendingSol}
                    operationActive={operationActive}
                    handleSendSol={handleSendSol}
                />
                        </AccordionPanel>
                    </AccordionItem>
                </Accordion>

                <Notice>{t("TokenList.allTokensShowsHoldingsTokensIManageFiltersTokens")}</Notice>
                <Tabs minW={0}>
                    <TabList>
                        <Tab>{t("TokenList.allTokens")}</Tab>
                        <Tab>{t("TokenList.tokensIManage")}</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel px={0} py={4}>
                            <VStack spacing={4} align="stretch">
                                {isLoading || error ? (
                                    <LoadingOrErrorView />
                                ) : uniqueTokens.length > 0 ? (
                                    uniqueTokens.map((token) => (
                                        <TokenCard key={token.mint} token={token}
                                            walletAddress={publicKey?.toBase58() || ''}
                                            onAction={handleCardAction} onCopy={copyAddress} isBusy={isCardBusy} />
                                    ))
                                ) : (
                                    <Alert status="info" borderRadius="md">
                                        <AlertIcon />
                                        <AlertTitle>{t("TokenList.noTokensYet")}</AlertTitle>
                                        <AlertDescription>
                                            {t("TokenList.noTokensDiscoveredInThisWalletYet")}<Button variant="link" ml={2} size="sm" onClick={() => onNavigate(1)}>{t("TokenList.createYourFirstToken")}</Button>
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </VStack>
                        </TabPanel>
                        <TabPanel px={0} py={4}>
                            <VStack spacing={4} align="stretch">
                                {isLoading || error ? (
                                    <LoadingOrErrorView />
                                ) : managedTokens.length > 0 ? (
                                    managedTokens.map((token) => (
                                        <TokenCard key={token.mint} token={token}
                                            walletAddress={publicKey?.toBase58() || ''}
                                            onAction={handleCardAction} onCopy={copyAddress} isBusy={isCardBusy} />
                                    ))
                                ) : (
                                    <Alert status="info" borderRadius="md">
                                        <AlertIcon />
                                        <AlertTitle>{t("TokenList.noManagementAuthorityFound")}</AlertTitle>
                                        <AlertDescription>
                                            {t("TokenList.noTokensThatYouHaveAuthorityToManageWere")}</AlertDescription>
                                    </Alert>
                                )}
                            </VStack>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </VStack>
            <TransferModal 
                isOpen={isTransferModalOpen}
                onClose={() => {
                    setIsTransferModalOpen(false);
                    setSelectedToken(null);
                    setTokenSendAddress('');
                    setTokenSendAmount('');
                }}
                selectedToken={selectedToken}
                sendAddress={tokenSendAddress}
                sendAmount={tokenSendAmount}
                setSendAddress={setTokenSendAddress}
                setSendAmount={setTokenSendAmount}
                isTransferring={isTransferring}
                error={operationError}
                handleTransferToken={handleTransferToken}
            />
            <AlertDialog
                isOpen={isDisableMintAlertOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => {
                    setIsDisableMintAlertOpen(false);
                    setSelectedTokenForDisable(null);
                }}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            {t("TokenList.permanentlyRevokeMintAuthority2")}</AlertDialogHeader>

                        <AlertDialogBody>
                            {selectedTokenForDisable && <AccountAddress label={t("TokenList.mintWhoseMintAuthorityWillBeRevoked")} value={selectedTokenForDisable.mint} compact />}
                            <Text mt={3}>
                                {t("TokenList.revokeMintQuestion", { symbol: selectedTokenForDisable?.symbol || '—' })}</Text>
                            <Text color="red.500" mt={2} fontWeight="bold">
                                {t("TokenList.warningThisActionIsIrreversible")}</Text>
                            <Text mt={2} mb={2}>
                                {t("TokenList.afterRevocation")}</Text>
                            <UnorderedList>
                                <ListItem>{t("TokenList.noNewMintingIsPossibleButBurningCanStill")}</ListItem>
                                <ListItem>{t("TokenList.noAdditionalTokensCanBeMinted")}</ListItem>
                                <ListItem>{t("TokenList.thisActionCannotBeUndone")}</ListItem>
                            </UnorderedList>
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => {
                                setIsDisableMintAlertOpen(false);
                                setSelectedTokenForDisable(null);
                            }}>
                                {t("TokenList.cancel")}</Button>
                            <Button 
                                colorScheme="red" 
                                onClick={handleDisableMintConfirm} 
                                ml={3}
                                isLoading={isDisablingMint}
                                loadingText={t("TokenList.revoking")}
                            >
                                {t("TokenList.confirmPermanentRevocation")}</Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
            <AlertDialog
                isOpen={isDisableFreezeMintAlertOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => {
                    setIsDisableFreezeAlertOpen(false);
                    setSelectedTokenForDisableFreeze(null);
                }}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            {t("TokenList.permanentlyRevokeFreezeAuthority2")}</AlertDialogHeader>

                        <AlertDialogBody>
                            {selectedTokenForDisableFreeze && <AccountAddress label={t("TokenList.mintWhoseFreezeAuthorityWillBeRevoked")} value={selectedTokenForDisableFreeze.mint} compact />}
                            <Text mt={3}>
                                {t("TokenList.revokeFreezeQuestion", { symbol: selectedTokenForDisableFreeze?.symbol || '—' })}</Text>
                            <Text color="red.500" mt={2} fontWeight="bold">
                                {t("TokenList.warningThisActionIsIrreversible")}</Text>
                            <Text mt={2} mb={2}>
                                {t("TokenList.afterRevocation")}</Text>
                            <UnorderedList>
                                <ListItem>{t("TokenList.noTokenAccountsCanBeFrozenWithThisAuthority")}</ListItem>
                                <ListItem>{t("TokenList.alreadyFrozenAccountsCannotBeThawed")}</ListItem>
                                <ListItem>{t("TokenList.thisActionCannotBeUndone")}</ListItem>
                            </UnorderedList>
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => {
                                setIsDisableFreezeAlertOpen(false);
                                setSelectedTokenForDisableFreeze(null);
                            }}>
                                {t("TokenList.cancel")}</Button>
                            <Button 
                                colorScheme="red" 
                                onClick={handleDisableFreezeConfirm} 
                                ml={3}
                                isLoading={isDisablingFreeze}
                                loadingText={t("TokenList.revoking")}
                            >
                                {t("TokenList.confirmPermanentRevocation")}</Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
            {isAddingLiquidity && selectedLiquidityToken && (
                <AddLiquidity mintAddress={selectedLiquidityToken.mint} onClose={handleCloseAddLiquidity} />
            )}
        </LessonLayout>
    );
}; 