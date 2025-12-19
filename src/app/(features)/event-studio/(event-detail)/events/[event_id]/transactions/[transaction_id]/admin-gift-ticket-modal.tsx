'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Grid,
    InputAdornment,
    InputLabel,
    MenuItem,
    Modal,
    OutlinedInput,
    Radio,
    RadioGroup,
    Select,
    Stack,
    Typography,
} from '@mui/material';
import { Gift as GiftIcon } from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';
import * as React from 'react';
import { useEffect, useState } from 'react';
import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { parseE164Phone, PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY } from '@/config/phone-countries';
import Event from './page';
// Reuse types from page.tsx or define locally
export interface Ticket {
    id: number;
    holderName: string;
    holderPhone: string;
    holderEmail: string;
    holderTitle: string;
    holderAvatar: string | null;
    eCode?: string;
    createdAt: string;
    checkInAt: string | null;
    status: string;
}

export interface TicketCategory {
    id: number;
    name: string;
    show: {
        id: number;
        name: string;
    };
}

export interface TransactionTicketCategory {
    netPricePerOne: number;
    tickets: Ticket[];
    ticketCategory: TicketCategory;
    quantity: number;
}

export interface Transaction {
    id: number;
    eventId: number;
    customerId: number;
    email: string;
    name: string;
    phoneNumber: string;
    transactionTicketCategories: TransactionTicketCategory[];
    customerResponseToken?: string; // Not needed really, but for compat
}

type CheckoutRuntimeFieldOption = {
    value: string;
    label: string;
    sortOrder: number;
};

type CheckoutRuntimeField = {
    internalName: string;
    label: string;
    fieldType: string;
    visible: boolean;
    required: boolean;
    note?: string | null;
    options?: CheckoutRuntimeFieldOption[];
};

type CustomerInfo = {
    title: string;
    name: string;
    email: string;
    phone_number: string;
    address?: string;
    dob?: string;
    idcard_number?: string;
    phone_country?: string;
    phone_national_number?: string;
    phoneCountryIso2?: string;
};

interface AdminGiftTicketModalProps {
    open: boolean;
    onClose: () => void;
    transaction: Transaction;
    event: Event;
    onSuccess?: () => void;
}

export default function AdminGiftTicketModal({
    open,
    onClose,
    transaction,
    event,
    onSuccess,
}: AdminGiftTicketModalProps): React.JSX.Element {
    const { tt, locale: lang } = useTranslation();
    const notificationCtx = React.useContext(NotificationContext);
    const [giftMode, setGiftMode] = useState<'all' | 'partial'>('all');
    const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);
    const [checkoutFormFields, setCheckoutFormFields] = useState<CheckoutRuntimeField[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    // Helper function to get title options based on language
    const getTitleOptions = React.useCallback(() => {
        if (lang === 'en') {
            return [
                { value: 'Mr.', label: 'Mr.' },
                { value: 'Ms', label: 'Ms' },
                { value: 'Mx.', label: 'Mx.' },
            ];
        }
        return [
            { value: 'Anh', label: 'Anh' },
            { value: 'Chị', label: 'Chị' },
            { value: 'Bạn', label: 'Bạn' },
        ];
    }, [lang]);

    const getDefaultTitle = React.useCallback(() => {
        return lang === 'en' ? 'Mx.' : 'Bạn';
    }, [lang]);

    const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
        title: getDefaultTitle(),
        name: '',
        email: '',
        phone_number: '',
        phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
        address: '',
        dob: '',
        idcard_number: '',
    });
    const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});

    // Filter tickets to only show normal status
    const availableTickets = React.useMemo(() => {
        const tickets: Ticket[] = [];
        transaction.transactionTicketCategories.forEach((ttc) => {
            ttc.tickets.forEach((ticket) => {
                if (ticket.status === 'normal') {
                    tickets.push(ticket);
                }
            });
        });
        return tickets;
    }, [transaction]);

    // Load checkout form configuration
    // Note: For Admin, we use same endpoint as customer/public to get runtime fields?
    // Or event studio has its own endpoint?
    // Usually /marketplace/events/{slug}/forms/checkout/runtime is public.
    // We can also use /event-studio/events/{id}/forms/checkout/runtime if it exists.
    // But using the public one via slug is safer as it's what was used for transaction creation mostly.
    // Assuming 'event.slug' is available in the passed Event object.
    useEffect(() => {
        const fetchCheckoutForm = async () => {
            if (!transaction.eventId) return;
            try {
                setIsLoading(true);
                const resp: AxiosResponse<{ fields: CheckoutRuntimeField[] }> =
                    await baseHttpServiceInstance.get(
                        `/event-studio/events/${transaction.eventId}/forms/checkout/runtime`
                    );
                setCheckoutFormFields(resp.data.fields || []);
            } catch (error) {
                console.error('Failed to load checkout form runtime', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (open && transaction.eventId) {
            fetchCheckoutForm();
        }
    }, [open, transaction.eventId]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!open) {
            setGiftMode('all');
            setSelectedTicketIds([]);
            setCustomerInfo({
                title: getDefaultTitle(),
                name: '',
                email: '',
                phone_number: '',
                phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
                address: '',
                dob: '',
                idcard_number: '',
            });
            setFormAnswers({});
        }
    }, [open, getDefaultTitle]);

    const handleGiftModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGiftMode(event.target.value as 'all' | 'partial');
        if (event.target.value === 'all') {
            setSelectedTicketIds([]);
        }
    };

    const handleTicketToggle = (ticketId: number) => {
        setSelectedTicketIds((prev) =>
            prev.includes(ticketId)
                ? prev.filter((id) => id !== ticketId)
                : [...prev, ticketId]
        );
    };

    const handleSelectAll = () => {
        if (selectedTicketIds.length === availableTickets.length) {
            setSelectedTicketIds([]);
        } else {
            setSelectedTicketIds(availableTickets.map((t) => t.id));
        }
    };

    const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
        setCustomerInfo((prev) => ({ ...prev, [field]: value }));
    };

    const handleFormAnswerChange = (fieldName: string, value: any) => {
        setFormAnswers((prev) => ({ ...prev, [fieldName]: value }));
    };

    const validateForm = (): boolean => {
        // Validate required builtin fields
        const nameField = checkoutFormFields.find((f) => f.internalName === 'name');
        if (nameField?.visible && nameField?.required && !customerInfo.name.trim()) {
            notificationCtx.warning(tt('Vui lòng nhập họ tên', 'Please enter full name'));
            return false;
        }

        const emailField = checkoutFormFields.find((f) => f.internalName === 'email');
        if (emailField?.visible && emailField?.required && !customerInfo.email.trim()) {
            notificationCtx.warning(tt('Vui lòng nhập email', 'Please enter email'));
            return false;
        }

        const phoneField = checkoutFormFields.find((f) => f.internalName === 'phone_number');
        if (phoneField?.visible && phoneField?.required && !customerInfo.phone_number.trim()) {
            notificationCtx.warning(tt('Vui lòng nhập số điện thoại', 'Please enter phone number'));
            return false;
        }

        // Validate ticket selection for partial mode
        if (giftMode === 'partial' && selectedTicketIds.length === 0) {
            notificationCtx.warning(tt('Vui lòng chọn ít nhất một vé', 'Please select at least one ticket'));
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setOpenConfirmDialog(true);
    };

    const handleConfirmSubmit = async () => {
        setOpenConfirmDialog(false);
        setIsSubmitting(true);

        try {
            const ticketIds = giftMode === 'all' ? null : selectedTicketIds;

            // Process phone number
            const phoneCountry = customerInfo.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2;
            const digits = customerInfo.phone_number.replace(/\D/g, '');
            const phoneNSN = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;

            const response: AxiosResponse<{ message: string; newTransactionId: number }> =
                await baseHttpServiceInstance.post(
                    `/event-studio/events/${transaction.eventId}/transactions/${transaction.id}/transfer-tickets`,
                    {
                        giftMode,
                        ticketIds,
                        customer: {
                            ...customerInfo,
                            phone_country: phoneCountry,
                            phone_national_number: phoneNSN,
                        },
                        formAnswers,
                    }
                );

            notificationCtx.success(response.data.message || tt('Chuyển nhượng vé thành công', 'Ticket transfer successful'));
            onSuccess?.();
            onClose();
        } catch (error: any) {
            let errorMessage = tt('Có lỗi xảy ra khi chuyển nhượng vé', 'An error occurred while transferring tickets');

            if (error?.response?.data) {
                if (error.response.data.detail) {
                    errorMessage = error.response.data.detail;
                } else if (error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (typeof error.response.data === 'string') {
                    errorMessage = error.response.data;
                }
            } else if (error?.message) {
                errorMessage = error.message;
            }

            notificationCtx.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const builtinInternalNames = React.useMemo(
        () => new Set(['title', 'name', 'email', 'phone_number', 'address', 'dob', 'idcard_number']),
        []
    );

    const customCheckoutFields = React.useMemo(
        () => checkoutFormFields.filter((f) => f.visible && !builtinInternalNames.has(f.internalName)),
        [checkoutFormFields, builtinInternalNames]
    );

    return (
        <>
            <Modal open={open} onClose={onClose} aria-labelledby="gift-ticket-modal-title">
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: { xs: '95%', sm: '95%', md: '80%', lg: '70%' },
                        maxWidth: '900px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        borderRadius: 2,
                    }}
                >
                    <Card>
                        <CardHeader
                            title={tt('Tặng vé (Admin)', 'Gift Tickets (Admin)')}
                            action={
                                <Button onClick={onClose} size="small">
                                    {tt('Đóng', 'Close')}
                                </Button>
                            }
                        />
                        <Divider />
                        <CardContent>
                            <Stack spacing={3}>
                                {/* Gift Mode Selection */}
                                <FormControl component="fieldset">
                                    <Typography variant="h6" sx={{ mb: 1 }}>
                                        {tt('Chọn phương thức tặng vé', 'Select Gift Method')}
                                    </Typography>
                                    <RadioGroup value={giftMode} onChange={handleGiftModeChange}>
                                        <FormControlLabel
                                            value="all"
                                            control={<Radio />}
                                            label={tt('Tặng toàn bộ vé', 'Gift All Tickets')}
                                        />
                                        <FormControlLabel
                                            value="partial"
                                            control={<Radio />}
                                            label={tt('Chọn vé để tặng', 'Select Tickets to Gift')}
                                        />
                                    </RadioGroup>
                                </FormControl>

                                {/* Ticket Selection (if partial mode) */}
                                {giftMode === 'partial' && (
                                    <Box>
                                        <Typography variant="h6" sx={{ mb: 1 }}>
                                            {tt('Chọn vé', 'Select Tickets')}
                                        </Typography>
                                        {availableTickets.length === 0 ? (
                                            <Typography color="text.secondary">
                                                {tt('Tất cả vé đã được chuyển nhượng', 'All tickets have been transferred')}
                                            </Typography>
                                        ) : (
                                            <>
                                                <FormControlLabel
                                                    control={
                                                        <Checkbox
                                                            checked={selectedTicketIds.length === availableTickets.length}
                                                            indeterminate={
                                                                selectedTicketIds.length > 0 &&
                                                                selectedTicketIds.length < availableTickets.length
                                                            }
                                                            onChange={handleSelectAll}
                                                        />
                                                    }
                                                    label={tt('Chọn tất cả', 'Select All')}
                                                    sx={{ mb: 1 }}
                                                />
                                                <Stack spacing={1}>
                                                    {transaction.transactionTicketCategories.map((ttc, categoryIndex) => {
                                                        const categoryTickets = ttc.tickets.filter((t) => t.status === 'normal');
                                                        if (categoryTickets.length === 0) return null;

                                                        return (
                                                            <Box key={categoryIndex} sx={{ pl: 2, borderLeft: '2px solid', borderColor: 'divider' }}>
                                                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                                    {ttc.ticketCategory.show.name} - {ttc.ticketCategory.name}
                                                                </Typography>
                                                                {categoryTickets.map((ticket) => (
                                                                    <Box key={ticket.id} sx={{ mb: 0.5 }}>
                                                                        <FormControlLabel
                                                                            control={
                                                                                <Checkbox
                                                                                    checked={selectedTicketIds.includes(ticket.id)}
                                                                                    onChange={() => handleTicketToggle(ticket.id)}
                                                                                />
                                                                            }
                                                                            label={
                                                                                <Box>
                                                                                    <Typography variant="body2" component="span">
                                                                                        TID-{ticket.id} {`${ticket.holderTitle || ''} ${ticket.holderName}`.trim() || tt('Chưa có thông tin', 'No information')}
                                                                                    </Typography>
                                                                                </Box>
                                                                            }
                                                                        />
                                                                    </Box>
                                                                ))}
                                                            </Box>
                                                        );
                                                    })}
                                                </Stack>
                                            </>
                                        )}
                                    </Box>
                                )}

                                {/* New Customer Form */}
                                <Box>
                                    <Typography variant="h6" sx={{ mb: 2 }}>
                                        {tt('Thông tin người nhận', 'Recipient Information')}
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {/* Built-in fields */}
                                        {(() => {
                                            const nameCfg = checkoutFormFields.find((f) => f.internalName === 'name');
                                            const visible = nameCfg ? nameCfg.visible : true; // Default true if not loaded? Or wait for loading?
                                            // If checkoutFormFields is empty (failed load or no form), should we default show core fields?
                                            // The original modal relies on loaded form.
                                            // Let's assume name/email/phone are critical.
                                            // If form not loaded, assume default visibility?
                                            // Customer modal defaults to hiding if not found in list? No, `!!nameCfg && nameCfg.visible`.
                                            // So if fields not loaded, nothing shows? That's risky for admin.
                                            // But keep consistency with original modal.

                                            const label = nameCfg?.label || tt('Danh xưng*  Họ và tên', 'Title*  Full name');
                                            return (
                                                visible && (
                                                    <Grid item xs={12} md={6}>
                                                        <FormControl fullWidth required={nameCfg?.required}>
                                                            <InputLabel htmlFor="recipient-name">{label}</InputLabel>
                                                            <OutlinedInput
                                                                id="recipient-name"
                                                                name="name"
                                                                value={customerInfo.name}
                                                                onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
                                                                label={label}
                                                                startAdornment={
                                                                    <InputAdornment position="start">
                                                                        <Select
                                                                            variant="standard"
                                                                            disableUnderline
                                                                            value={customerInfo.title}
                                                                            onChange={(e) =>
                                                                                handleCustomerInfoChange('title', e.target.value)
                                                                            }
                                                                            sx={{ minWidth: 65 }}
                                                                        >
                                                                            {getTitleOptions().map((option) => (
                                                                                <MenuItem key={option.value} value={option.value}>
                                                                                    {option.label}
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </InputAdornment>
                                                                }
                                                            />
                                                        </FormControl>
                                                    </Grid>
                                                )
                                            );
                                        })()}

                                        {(() => {
                                            const emailCfg = checkoutFormFields.find((f) => f.internalName === 'email');
                                            const visible = emailCfg ? emailCfg.visible : true;
                                            const label = emailCfg?.label || 'Email';
                                            return (
                                                visible && (
                                                    <Grid item xs={12} md={6}>
                                                        <FormControl fullWidth required={emailCfg?.required}>
                                                            <InputLabel>{label}</InputLabel>
                                                            <OutlinedInput
                                                                value={customerInfo.email}
                                                                onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
                                                                label={label}
                                                            />
                                                        </FormControl>
                                                    </Grid>
                                                )
                                            );
                                        })()}

                                        {(() => {
                                            const phoneCfg = checkoutFormFields.find((f) => f.internalName === 'phone_number');
                                            const visible = phoneCfg ? phoneCfg.visible : true;
                                            const label = phoneCfg?.label || tt('Số điện thoại', 'Phone number');
                                            return (
                                                visible && (
                                                    <Grid item xs={12} md={6}>
                                                        <FormControl fullWidth required={phoneCfg?.required}>
                                                            <InputLabel>{label}</InputLabel>
                                                            <OutlinedInput
                                                                type="tel"
                                                                value={customerInfo.phone_number}
                                                                onChange={(e) => handleCustomerInfoChange('phone_number', e.target.value)}
                                                                label={label}
                                                                startAdornment={
                                                                    <InputAdornment position="start">
                                                                        <Select
                                                                            variant="standard"
                                                                            disableUnderline
                                                                            value={customerInfo.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2}
                                                                            onChange={(e) =>
                                                                                handleCustomerInfoChange('phoneCountryIso2', e.target.value)
                                                                            }
                                                                            sx={{ minWidth: 50 }}
                                                                            renderValue={(value) => {
                                                                                const country =
                                                                                    PHONE_COUNTRIES.find((c) => c.iso2 === value) || DEFAULT_PHONE_COUNTRY;
                                                                                return country.dialCode;
                                                                            }}
                                                                        >
                                                                            {PHONE_COUNTRIES.map((country) => (
                                                                                <MenuItem key={country.iso2} value={country.iso2}>
                                                                                    {lang === 'vi' ? country.nameVi : country.nameEn} ({country.dialCode})
                                                                                </MenuItem>
                                                                            ))}
                                                                        </Select>
                                                                    </InputAdornment>
                                                                }
                                                            />
                                                        </FormControl>
                                                    </Grid>
                                                )
                                            );
                                        })()}

                                        {(() => {
                                            const addrCfg = checkoutFormFields.find((f) => f.internalName === 'address');
                                            const visible = !!addrCfg && addrCfg.visible;
                                            const label = addrCfg?.label || tt('Địa chỉ', 'Address');
                                            return (
                                                visible && (
                                                    <Grid item xs={12} md={6}>
                                                        <FormControl fullWidth required={addrCfg?.required}>
                                                            <InputLabel>{label}</InputLabel>
                                                            <OutlinedInput
                                                                value={customerInfo.address || ''}
                                                                onChange={(e) => handleCustomerInfoChange('address', e.target.value)}
                                                                label={label}
                                                            />
                                                        </FormControl>
                                                    </Grid>
                                                )
                                            );
                                        })()}

                                        {(() => {
                                            const dobCfg = checkoutFormFields.find((f) => f.internalName === 'dob');
                                            const visible = !!dobCfg && dobCfg.visible;
                                            const label = dobCfg?.label || tt('Ngày tháng năm sinh', 'Date of Birth');
                                            return (
                                                visible && (
                                                    <Grid item xs={12} md={6}>
                                                        <FormControl fullWidth required={dobCfg?.required}>
                                                            <InputLabel shrink>{label}</InputLabel>
                                                            <OutlinedInput
                                                                label={label}
                                                                type="date"
                                                                value={customerInfo.dob || ''}
                                                                onChange={(e) => handleCustomerInfoChange('dob', e.target.value)}
                                                            />
                                                        </FormControl>
                                                    </Grid>
                                                )
                                            );
                                        })()}

                                        {(() => {
                                            const idCfg = checkoutFormFields.find((f) => f.internalName === 'idcard_number');
                                            const visible = !!idCfg && idCfg.visible;
                                            const label = idCfg?.label || tt('Căn cước công dân', 'ID Card Number');
                                            return (
                                                visible && (
                                                    <Grid item xs={12} md={6}>
                                                        <FormControl fullWidth required={idCfg?.required}>
                                                            <InputLabel>{label}</InputLabel>
                                                            <OutlinedInput
                                                                label={label}
                                                                value={customerInfo.idcard_number || ''}
                                                                onChange={(e) => handleCustomerInfoChange('idcard_number', e.target.value)}
                                                            />
                                                        </FormControl>
                                                    </Grid>
                                                )
                                            );
                                        })()}

                                        {/* Custom checkout fields */}
                                        {customCheckoutFields.map((field) => {
                                            const rawValue = formAnswers[field.internalName] ?? '';

                                            return (
                                                <Grid item key={field.internalName} xs={12}>
                                                    <Stack spacing={0.5}>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {field.label}
                                                            {field.required && <span style={{ color: 'red' }}> *</span>}
                                                        </Typography>
                                                        {field.note && (
                                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                {field.note}
                                                            </Typography>
                                                        )}

                                                        {['text', 'number'].includes(field.fieldType) && (
                                                            <OutlinedInput
                                                                fullWidth
                                                                size="small"
                                                                type={field.fieldType === 'number' ? 'number' : 'text'}
                                                                value={rawValue}
                                                                onChange={(e) =>
                                                                    handleFormAnswerChange(
                                                                        field.internalName,
                                                                        field.fieldType === 'number' ? Number(e.target.value) : e.target.value
                                                                    )
                                                                }
                                                                required={field.required}
                                                            />
                                                        )}

                                                        {['date', 'time', 'datetime'].includes(field.fieldType) && (
                                                            <OutlinedInput
                                                                fullWidth
                                                                size="small"
                                                                type={
                                                                    field.fieldType === 'date'
                                                                        ? 'date'
                                                                        : field.fieldType === 'time'
                                                                            ? 'time'
                                                                            : 'datetime-local'
                                                                }
                                                                value={rawValue}
                                                                onChange={(e) => handleFormAnswerChange(field.internalName, e.target.value)}
                                                                required={field.required}
                                                            />
                                                        )}

                                                        {field.fieldType === 'radio' && field.options && (
                                                            <FormGroup>
                                                                <RadioGroup
                                                                    value={rawValue}
                                                                    onChange={(e) => handleFormAnswerChange(field.internalName, e.target.value)}
                                                                >
                                                                    {field.options.map((opt) => (
                                                                        <FormControlLabel
                                                                            key={opt.value}
                                                                            value={opt.value}
                                                                            control={<Radio size="small" />}
                                                                            label={opt.label}
                                                                        />
                                                                    ))}
                                                                </RadioGroup>
                                                            </FormGroup>
                                                        )}

                                                        {field.fieldType === 'checkbox' && field.options && (
                                                            <FormGroup>
                                                                {field.options.map((opt) => {
                                                                    const current: string[] = Array.isArray(rawValue) ? rawValue : [];
                                                                    const checked = current.includes(opt.value);
                                                                    return (
                                                                        <FormControlLabel
                                                                            key={opt.value}
                                                                            control={
                                                                                <Checkbox
                                                                                    size="small"
                                                                                    checked={checked}
                                                                                    onChange={(e) => {
                                                                                        const newValue = e.target.checked
                                                                                            ? [...current, opt.value]
                                                                                            : current.filter((v) => v !== opt.value);
                                                                                        handleFormAnswerChange(field.internalName, newValue);
                                                                                    }}
                                                                                />
                                                                            }
                                                                            label={opt.label}
                                                                        />
                                                                    );
                                                                })}
                                                            </FormGroup>
                                                        )}

                                                        {!['text', 'number', 'date', 'time', 'datetime', 'radio', 'checkbox'].includes(
                                                            field.fieldType
                                                        ) && (
                                                                <OutlinedInput
                                                                    fullWidth
                                                                    size="small"
                                                                    value={rawValue}
                                                                    onChange={(e) => handleFormAnswerChange(field.internalName, e.target.value)}
                                                                    required={field.required}
                                                                />
                                                            )}
                                                    </Stack>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                </Box>

                                {/* Action Buttons */}
                                <Stack direction="row" spacing={2} justifyContent="flex-end">
                                    <Button onClick={onClose} disabled={isSubmitting}>
                                        {tt('Hủy', 'Cancel')}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || isLoading}
                                        startIcon={isSubmitting ? <CircularProgress size={20} /> : <GiftIcon />}
                                    >
                                        {isSubmitting ? tt('Đang xử lý...', 'Processing...') : tt('Xác nhận', 'Confirm')}
                                    </Button>
                                </Stack>
                            </Stack>
                        </CardContent>
                    </Card>
                </Box>
            </Modal>

            {/* Confirmation Dialog */}
            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
                <DialogTitle>{tt('Xác nhận tặng vé', 'Confirm Gift Tickets')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {tt(
                            'Bạn chắc chắn muốn tặng vé này?',
                            'Are you sure you want to gift these tickets?'
                        )}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmDialog(false)} disabled={isSubmitting}>
                        {tt('Hủy', 'Cancel')}
                    </Button>
                    <Button onClick={handleConfirmSubmit} color="primary" disabled={isSubmitting} variant="contained">
                        {isSubmitting ? (
                            <CircularProgress size={20} />
                        ) : (
                            tt('Xác nhận', 'Confirm')
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
