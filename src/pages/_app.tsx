import { SiteIcons } from '../components/brand/SiteIcons';
import { ChakraProvider } from '@chakra-ui/react';
import type { AppProps } from 'next/app';
import { NextIntlClientProvider } from 'next-intl';
import { useRouter } from 'next/router';
import { WalletContextProvider } from '../components/WalletProvider';
import { theme } from '../theme';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    const { locale = 'en', pathname } = useRouter();
    return (
        <NextIntlClientProvider locale={locale} messages={pageProps.messages} timeZone="UTC">
            <SiteIcons />
            <ChakraProvider theme={theme}>
                {pathname !== '/' ? <Component {...pageProps} /> : <WalletContextProvider>
                    <Component {...pageProps} />
                </WalletContextProvider>}
            </ChakraProvider>
        </NextIntlClientProvider>
    );
} 