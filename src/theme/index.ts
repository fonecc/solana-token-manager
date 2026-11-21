import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
    config: { initialColorMode: 'light', useSystemColorMode: false },
    fonts: { heading: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif', body: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif' },
    fontSizes: { xs: '0.875rem', sm: '1rem', md: '1rem', lg: '1.125rem', xl: '1.375rem', '2xl': '1.75rem', '3xl': '2.25rem', '4xl': '2.75rem' },
    colors: { ink: '#172234', canvas: '#f5f6fa', gray: { 400: '#64748b', 500: '#53647b' }, purple: { 50: '#f3f0ff', 100: '#e8e1ff', 200: '#d1c3fb', 300: '#b19aef', 400: '#9273e0', 500: '#7656cf', 600: '#6142b5', 700: '#4d3591', 800: '#3a286e', 900: '#271b4b' } },
    styles: { global: { body: { bg: 'canvas', color: 'ink', fontSize: 'sm', lineHeight: 1.75 }, '::selection': { background: '#e8e1ff' }, 'summary': { cursor: 'pointer' }, 'input, button, select': { scrollMarginTop: '100px' }, ':focus-visible': { outlineOffset: '3px' } } },
    components: {
        Heading: { baseStyle: { fontWeight: 650, letterSpacing: '-0.025em', lineHeight: 1.4 } },
        Button: { baseStyle: { borderRadius: 'lg', fontWeight: 600, whiteSpace: 'normal', lineHeight: 1.5, flexShrink: 0, maxW: 'full' }, sizes: { xs: { h: 'auto', minH: 8, fontSize: 'xs', px: 3, py: 1 }, sm: { h: 'auto', minH: 10, fontSize: 'sm', px: 4, py: 2 }, md: { h: 'auto', minH: 12, fontSize: 'md', px: 5, py: 3 }, lg: { h: 'auto', minH: 14, fontSize: 'lg', px: 7, py: 3 } }, defaultProps: { colorScheme: 'purple', size: 'md' } },
        Input: { sizes: { md: { field: { h: 12, fontSize: 'md' } }, sm: { field: { h: 10, fontSize: 'sm' } } }, defaultProps: { focusBorderColor: 'purple.500' }, variants: { outline: { field: { borderColor: 'gray.200', bg: 'white', borderRadius: 'lg', fontSize: 'sm', _placeholder: { color: 'gray.400' }, _hover: { borderColor: 'gray.300' } } } } },
        Select: { sizes: { md: { field: { h: 12, fontSize: 'md' } }, sm: { field: { h: 10, fontSize: 'sm' } } }, defaultProps: { focusBorderColor: 'purple.500' } },
        NumberInput: { sizes: { md: { field: { h: 12, fontSize: 'md' } } }, defaultProps: { focusBorderColor: 'purple.500' }, variants: { outline: { field: { borderColor: 'gray.200', borderRadius: 'lg', fontSize: 'sm' } } } },
        FormLabel: { baseStyle: { fontSize: 'sm', fontWeight: 600, color: 'gray.700' } },
        FormHelperText: { baseStyle: { fontSize: 'xs', color: 'gray.500', lineHeight: 1.8 } },
        Modal: { baseStyle: { dialog: { borderRadius: '2xl', mx: 3, my: 6, maxH: 'calc(100dvh - 48px)' }, header: { fontSize: 'lg', pt: 6 }, body: { overflowY: 'auto' }, footer: { gap: 3, flexWrap: 'wrap', pb: 6, '& > button': { maxW: 'full', minW: 0, h: 'auto', minH: 10, py: 2, w: { base: 'full', sm: 'auto' } } }, closeButton: { top: 4, right: 4 } } },
        Checkbox: { defaultProps: { colorScheme: 'purple' } },
        Tabs: { defaultProps: { colorScheme: 'purple' }, baseStyle: { tab: { fontSize: 'sm', fontWeight: 600 }, tabpanel: { px: 0 } } },
        Alert: { baseStyle: { container: { borderRadius: 'lg', fontSize: 'sm', alignItems: 'flex-start' } } },
        Badge: { baseStyle: { fontWeight: 600, borderRadius: 'md', px: 2, py: 0.5, letterSpacing: '0.02em', textTransform: 'none' } },
    },
});
