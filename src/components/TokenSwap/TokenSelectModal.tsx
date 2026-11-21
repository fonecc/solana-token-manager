import { useT, useMessageState } from '../../i18n/useT';
import { Box,Button,HStack,Image,Input,Modal,ModalBody,ModalCloseButton,ModalContent,ModalHeader,ModalOverlay,Spinner,Text,VStack } from '@chakra-ui/react';
import { NATIVE_MINT,getMint } from '@solana/spl-token';
import { useConnection,useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect,useMemo,useState } from 'react';
import { useWalletTokens } from '../../hooks/useWalletTokens';
import { type TokenInfo } from './types';

interface TokenSelectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (token: TokenInfo) => void;
    excludeToken?: string;
}

// 打开时才挂载查询组件，避免隐藏选择框重复请求 RPC。
export const TokenSelectModal = (props: TokenSelectModalProps) => {
    const t = useT(); return (<Modal isOpen={props.isOpen} onClose={props.onClose} isCentered>
    <ModalOverlay /><ModalContent><ModalHeader>{t("TokenSwap.selectInputOutputAsset")}</ModalHeader><ModalCloseButton aria-label={t("TokenSwap.closeAssetSelection")} />
        <ModalBody pb={5}>{props.isOpen && <TokenOptions {...props} />}</ModalBody>
    </ModalContent>
</Modal>); };

function TokenOptions({ onSelect, excludeToken }: TokenSelectModalProps) {
    const t = useT();
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const { tokens, solBalance, isLoading, error, refresh } = useWalletTokens(connection, publicKey);
    const [search, setSearch] = useState('');
    const [custom, setCustom] = useState<TokenInfo | null>(null);
    const [lookupError, setLookupError] = useMessageState();
    const [lookingUp, setLookingUp] = useState(false);
    useEffect(() => { setCustom(null); setLookupError(''); }, [search, setLookupError]);
    const options = useMemo(() => {
        const all: TokenInfo[] = [
            { mint: NATIVE_MINT.toBase58(), symbol: 'SOL', name: t("TokenSwap.nativeSolWrappedByTheSdkAsNeeded"), decimals: 9, isNative: true, balance: isLoading || error ? undefined : solBalance.toString() },
            ...tokens.filter(token => token.mint !== NATIVE_MINT.toBase58()).map(token => ({ mint: token.mint, symbol: token.symbol || t("TokenList.unknownToken"), name: token.name || t("TokenList.unknownName"), decimals: token.decimals, balance: token.amount, icon: token.image }))
        ];
        if (custom && !all.some(token => token.mint === custom.mint)) all.push(custom);
        return all.filter(token => token.mint !== excludeToken && `${token.mint} ${token.symbol} ${token.name}`.toLowerCase().includes(search.toLowerCase()));
    }, [tokens, solBalance, excludeToken, search, custom, isLoading, error, t]);
    const lookup = async () => {
        const input = search;
        setLookingUp(true);
        try {
            const mint = new PublicKey(input);
            const info = await getMint(connection, mint);
            // 输入改变会卸载本次结果的 key，按钮期间禁用输入避免覆盖。
            setCustom({ mint: mint.toBase58(), decimals: info.decimals, symbol: `${input.slice(0, 4)}…${input.slice(-4)}` });
        } catch (reason) { setLookupError(reason); }
        finally { setLookingUp(false); }
    };
    return <VStack align="stretch" spacing={3}>
        <Text fontSize="xs" color="gray.500">{t("TokenSwap.searchByNameSymbolOrMintVerifyAddressesFor")}</Text>
        <Input aria-label={t("TokenSwap.searchBySymbolOrMintAddress")} placeholder={t("TokenSwap.symbolOrMintAddress")} value={search} isDisabled={lookingUp} onChange={e => setSearch(e.target.value)} />
        <HStack flexWrap="wrap"><Button size="sm" variant="ghost" onClick={() => void refresh()} isDisabled={lookingUp}>{t("TokenList.refreshBalances")}</Button><Button size="sm" variant="outline" onClick={lookup} isLoading={lookingUp} isDisabled={!search || lookingUp}>{t("TokenSwap.lookUpMintAddress")}</Button></HStack>
        {isLoading && <Spinner aria-label={t("TokenSwap.readingToken")} />}
        {(error || lookupError) && <Text role="alert" color="red.500">{error || lookupError}</Text>}
        <Box maxH="360px" overflowY="auto">
            {options.map(token => <Button key={token.mint} variant="ghost" w="full" h="auto" py={3} onClick={() => onSelect(token)} justifyContent="flex-start">
                <HStack w="full">{token.icon && <Image src={token.icon} alt={token.symbol} boxSize="28px" />}
                    <VStack align="start" spacing={1} flex={1} minW={0}><Text fontSize="sm" overflowWrap="anywhere">{token.symbol}</Text><Text fontSize="xs" color="gray.500" title={token.mint}>{token.mint.slice(0, 8)}…{token.mint.slice(-8)} · {token.decimals} {t("TokenSwap.decimals")}</Text><Text fontSize="xs" color="gray.500" overflowWrap="anywhere">{t("TokenSwap.balance")}{token.balance ?? t("TokenSwap.notReadNotHeld")}</Text></VStack>
                </HStack>
            </Button>)}
            {!isLoading && !options.length && <Text>{t("TokenSwap.noTokenFoundTryLookingUpItsMintAddress")}</Text>}
        </Box>
    </VStack>;
}
