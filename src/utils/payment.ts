
export const getPaymentMethodLabel = (paymentMethod: string, tt: (vi: string, en: string) => string): string => {
    switch (paymentMethod) {
        case 'cash':
            return tt('Tiền mặt', 'Cash');
        case 'transfer':
            return tt('Chuyển khoản', 'Transfer');
        case 'napas247':
            return 'Napas 247';
        default:
            return paymentMethod;
    }
};
