'use client';

import { baseHttpServiceInstance } from '@/services/BaseHttp.service';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
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
    Step,
    StepLabel,
    Stepper,
    Typography,
} from '@mui/material';
import { Gift as GiftIcon, CaretDown as CaretDownIcon, Copy as CopyIcon } from '@phosphor-icons/react/dist/ssr';
import { AxiosResponse } from 'axios';
import * as React from 'react';
import { useEffect, useState } from 'react';
import NotificationContext from '@/contexts/notification-context';
import { useTranslation } from '@/contexts/locale-context';
import { parseE164Phone, PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY, formatToE164 } from '@/config/phone-countries';
import type { Event } from './page';

// Reuse types from page.tsx or define locally
export interface TicketFormAnswer {
    id?: number;
    internalName: string;
    label: string;
    fieldType?: string;
    value: any;
}

export interface Ticket {
    id: number;
    holderName: string;
    holderPhone: string;
    holderEmail: string;
    holderTitle: string;
    holderAvatar: string | null;
    holderAddress?: string;
    holderDob?: string | null;
    holderIdcardNumber?: string;
    eCode?: string;
    createdAt: string;
    checkInAt: string | null;
    status: string;
    // Custom per-ticket (holder) form field answers - canonical array shape
    formAnswers?: TicketFormAnswer[];
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

// Per-ticket holder info override. A field left unset falls back to that ticket's
// own current (existing) holder info.
type TicketHolderOverride = {
    title?: string;
    name?: string;
    email?: string;
    phone_number?: string;
    phoneCountryIso2?: string;
    address?: string;
    dob?: string;
    idcard_number?: string;
};

// Ticket-form builtin fields always use the bare internal_name (title/name/email/
// phone_number/address/dob/idcard_number), matching the checkout form's convention -
// see BUILTIN_TICKET_FIELDS and PUT /ticket/config on the backend.
const TICKET_HOLDER_FIELD_NAMES = ['title', 'name', 'email', 'phone_number', 'address', 'dob', 'idcard_number'] as const;

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
    const [activeStep, setActiveStep] = useState(0);
    const [giftMode, setGiftMode] = useState<'all' | 'partial'>('all');
    const [selectedTicketIds, setSelectedTicketIds] = useState<number[]>([]);
    const [checkoutFormFields, setCheckoutFormFields] = useState<CheckoutRuntimeField[]>([]);
    const [ticketFormFields, setTicketFormFields] = useState<CheckoutRuntimeField[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    // Helper function to get title options based on language
    const getTitleOptions = React.useCallback(() => {
        if (lang === 'en') {
            return [
                { value: 'Mr.', label: 'Mr.' },
                { value: 'Ms.', label: 'Ms.' },
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
    // Per-ticket (holder) custom form answers, keyed by ticket id: { [ticketId]: { [internalName]: value } }
    const [ticketFormAnswers, setTicketFormAnswers] = useState<Record<number, Record<string, any>>>({});
    // Per-ticket holder info overrides (title/name/email/phone/...), keyed by ticket id.
    // Any field left unset falls back to that ticket's own current holder info.
    const [ticketHolderOverrides, setTicketHolderOverrides] = useState<Record<number, TicketHolderOverride>>({});

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

    // Load checkout form configuration (admin/event-studio runtime - includes internal-only fields)
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

    // Load per-ticket (holder) form configuration (admin/event-studio runtime)
    useEffect(() => {
        const fetchTicketForm = async () => {
            if (!transaction.eventId) return;
            try {
                const resp: AxiosResponse<{ fields: CheckoutRuntimeField[] }> =
                    await baseHttpServiceInstance.get(
                        `/event-studio/events/${transaction.eventId}/forms/ticket/runtime`
                    );
                setTicketFormFields(resp.data.fields || []);
            } catch (error) {
                console.error('Failed to load ticket form runtime', error);
            }
        };
        if (open && transaction.eventId) {
            fetchTicketForm();
        }
    }, [open, transaction.eventId]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (!open) {
            setActiveStep(0);
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
            setTicketFormAnswers({});
            setTicketHolderOverrides({});
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

    const handleTicketFormAnswerChange = (ticketId: number, fieldName: string, value: any) => {
        setTicketFormAnswers((prev) => ({
            ...prev,
            [ticketId]: { ...prev[ticketId], [fieldName]: value },
        }));
    };

    // A ticket's own current holder info, used as the default prefill value for that
    // ticket's holder fields (before any override is applied).
    const getTicketDefaultHolderValue = (ticket: Ticket, field: keyof TicketHolderOverride): string => {
        switch (field) {
            case 'title':
                return ticket.holderTitle || '';
            case 'name':
                return ticket.holderName || '';
            case 'email':
                return ticket.holderEmail || '';
            case 'phone_number': {
                const parsed = ticket.holderPhone ? parseE164Phone(ticket.holderPhone) : null;
                return parsed?.nationalNumber || ticket.holderPhone || '';
            }
            case 'phoneCountryIso2': {
                const parsed = ticket.holderPhone ? parseE164Phone(ticket.holderPhone) : null;
                return parsed?.countryCode || DEFAULT_PHONE_COUNTRY.iso2;
            }
            case 'address':
                return ticket.holderAddress || '';
            case 'dob':
                return ticket.holderDob || '';
            case 'idcard_number':
                return ticket.holderIdcardNumber || '';
            default:
                return '';
        }
    };

    // Get a ticket's effective holder field value: its own override if set, else its
    // own current (existing) info.
    const getTicketHolderValue = (ticket: Ticket, field: keyof TicketHolderOverride): string => {
        const override = ticketHolderOverrides[ticket.id]?.[field];
        if (override !== undefined) return override;
        return getTicketDefaultHolderValue(ticket, field);
    };

    const handleTicketHolderChange = (ticketId: number, field: keyof TicketHolderOverride, value: string) => {
        setTicketHolderOverrides((prev) => ({
            ...prev,
            [ticketId]: { ...prev[ticketId], [field]: value },
        }));
    };

    // Get a ticket's effective custom-field answer: its own edit if set, else its own
    // existing answer (if it already has one).
    const getTicketFormAnswerValue = (ticket: Ticket, internalName: string): any => {
        const edited = ticketFormAnswers[ticket.id]?.[internalName];
        if (edited !== undefined) return edited;
        const existing = ticket.formAnswers?.find((a) => a.internalName === internalName);
        return existing?.value ?? '';
    };

    const findTicketFieldConfig = (key: (typeof TICKET_HOLDER_FIELD_NAMES)[number]) =>
        ticketFormFields.find((f) => f.internalName === key);

    // Blank out every ticket's holder fields + custom fields, so the user can type
    // fresh values instead of reusing each ticket's current info.
    const handleClearAllTicketOverrides = () => {
        const blankOverrides: Record<number, TicketHolderOverride> = {};
        const blankAnswers: Record<number, Record<string, any>> = {};
        ticketsToConfigure.forEach((ticket) => {
            blankOverrides[ticket.id] = {
                title: '',
                name: '',
                email: '',
                phone_number: '',
                phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
                address: '',
                dob: '',
                idcard_number: '',
            };
            const answers: Record<string, any> = {};
            customTicketFields.forEach((field) => {
                answers[field.internalName] = field.fieldType === 'checkbox' ? [] : '';
            });
            blankAnswers[ticket.id] = answers;
        });
        setTicketHolderOverrides(blankOverrides);
        setTicketFormAnswers(blankAnswers);
    };

    const handleCopyFromFirstTicket = (targetTicket: Ticket) => {
        const firstTicket = ticketsToConfigure[0];
        if (!firstTicket || firstTicket.id === targetTicket.id) return;

        const resolvedHolder: TicketHolderOverride = {
            title: getTicketHolderValue(firstTicket, 'title'),
            name: getTicketHolderValue(firstTicket, 'name'),
            email: getTicketHolderValue(firstTicket, 'email'),
            phone_number: getTicketHolderValue(firstTicket, 'phone_number'),
            phoneCountryIso2: getTicketHolderValue(firstTicket, 'phoneCountryIso2'),
            address: getTicketHolderValue(firstTicket, 'address'),
            dob: getTicketHolderValue(firstTicket, 'dob'),
            idcard_number: getTicketHolderValue(firstTicket, 'idcard_number'),
        };
        setTicketHolderOverrides((prev) => ({ ...prev, [targetTicket.id]: resolvedHolder }));

        const resolvedAnswers: Record<string, any> = {};
        customTicketFields.forEach((field) => {
            resolvedAnswers[field.internalName] = getTicketFormAnswerValue(firstTicket, field.internalName);
        });
        setTicketFormAnswers((prev) => ({ ...prev, [targetTicket.id]: resolvedAnswers }));
    };

    const handleCopyRecipientFromFirstTicket = () => {
        const firstTicket = ticketsToConfigure[0];
        if (!firstTicket) return;
        setCustomerInfo((prev) => ({
            ...prev,
            title: getTicketHolderValue(firstTicket, 'title') || prev.title,
            name: getTicketHolderValue(firstTicket, 'name'),
            email: getTicketHolderValue(firstTicket, 'email'),
            phone_number: getTicketHolderValue(firstTicket, 'phone_number'),
            phoneCountryIso2: getTicketHolderValue(firstTicket, 'phoneCountryIso2'),
            address: getTicketHolderValue(firstTicket, 'address'),
            dob: getTicketHolderValue(firstTicket, 'dob'),
            idcard_number: getTicketHolderValue(firstTicket, 'idcard_number'),
        }));
    };

    const builtinInternalNames = React.useMemo(
        () => new Set(['title', 'name', 'email', 'phone_number', 'address', 'dob', 'idcard_number']),
        []
    );

    const customCheckoutFields = React.useMemo(
        () => checkoutFormFields.filter((f) => f.visible && !builtinInternalNames.has(f.internalName)),
        [checkoutFormFields, builtinInternalNames]
    );

    const customTicketFields = React.useMemo(
        () => ticketFormFields.filter((f) => f.visible && !builtinInternalNames.has(f.internalName)),
        [ticketFormFields, builtinInternalNames]
    );

    // Tickets that need their own holder info + custom-field inputs shown: all of them
    // in "all" mode, only the selected ones in "partial" mode.
    const ticketsToConfigure = React.useMemo(
        () => (giftMode === 'all' ? availableTickets : availableTickets.filter((t) => selectedTicketIds.includes(t.id))),
        [giftMode, availableTickets, selectedTicketIds]
    );

    // ---------------- Step validation ----------------

    const validateStep1 = (): boolean => {
        if (giftMode === 'partial' && selectedTicketIds.length === 0) {
            notificationCtx.warning(tt('Vui lòng chọn ít nhất một vé', 'Please select at least one ticket'));
            return false;
        }
        return true;
    };

    const validateStep2 = (): boolean => {
        const requiredHolderChecks: { key: (typeof TICKET_HOLDER_FIELD_NAMES)[number] }[] = [
            { key: 'title' },
            { key: 'name' },
            { key: 'email' },
            { key: 'phone_number' },
            { key: 'address' },
            { key: 'dob' },
            { key: 'idcard_number' },
        ];
        for (const { key } of requiredHolderChecks) {
            const cfg = findTicketFieldConfig(key);
            if (!cfg?.visible || !cfg?.required) continue;
            for (const ticket of ticketsToConfigure) {
                if (!getTicketHolderValue(ticket, key).trim()) {
                    notificationCtx.warning(
                        tt(`Vui lòng nhập "${cfg.label}" cho vé TID-${ticket.id}`, `Please enter "${cfg.label}" for ticket TID-${ticket.id}`)
                    );
                    return false;
                }
            }
        }

        for (const field of customTicketFields) {
            if (!field.required) continue;
            for (const ticket of ticketsToConfigure) {
                const value = getTicketFormAnswerValue(ticket, field.internalName);
                const isEmpty = Array.isArray(value) ? value.length === 0 : value === undefined || value === null || value === '';
                if (isEmpty) {
                    notificationCtx.warning(
                        tt(`Vui lòng nhập/chọn "${field.label}" cho vé TID-${ticket.id}`, `Please enter/select "${field.label}" for ticket TID-${ticket.id}`)
                    );
                    return false;
                }
            }
        }

        return true;
    };

    const validateStep3 = (): boolean => {
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

        for (const field of customCheckoutFields) {
            if (!field.required) continue;
            const value = formAnswers[field.internalName];
            const isEmpty = Array.isArray(value) ? value.length === 0 : value === undefined || value === null || value === '';
            if (isEmpty) {
                notificationCtx.warning(
                    tt(`Vui lòng nhập/chọn "${field.label}"`, `Please enter/select "${field.label}"`)
                );
                return false;
            }
        }

        return true;
    };

    // ---------------- Step navigation ----------------

    const handleNext = () => {
        if (activeStep === 0 && !validateStep1()) return;
        if (activeStep === 1 && !validateStep2()) return;
        setActiveStep((s) => Math.min(2, s + 1));
    };

    const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));

    const handleSubmit = () => {
        if (!validateStep3()) return;
        setOpenConfirmDialog(true);
    };

    const handleConfirmSubmit = async () => {
        setOpenConfirmDialog(false);
        setIsSubmitting(true);

        try {
            const ticketIds = giftMode === 'all' ? null : selectedTicketIds;

            // Process phone number to E.164 format and strip helper fields
            const phoneCountry = customerInfo.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2;
            const digits = customerInfo.phone_number.replace(/\D/g, '');
            const phoneNSN = digits.length > 1 && digits.startsWith('0') ? digits.slice(1) : digits;
            const e164Phone = formatToE164(phoneCountry, phoneNSN) || `+84${phoneNSN}`;

            const customerPayload = { ...customerInfo };
            customerPayload.phone_number = e164Phone;
            delete (customerPayload as any).phoneCountryIso2;
            delete (customerPayload as any).phone_country;
            delete (customerPayload as any).phone_national_number;

            // Only send per-ticket custom answers for the tickets actually being transferred
            const ticketFormAnswersPayload: Record<number, Record<string, any>> = {};
            ticketsToConfigure.forEach((ticket) => {
                const answers: Record<string, any> = {};
                customTicketFields.forEach((field) => {
                    answers[field.internalName] = getTicketFormAnswerValue(ticket, field.internalName);
                });
                ticketFormAnswersPayload[ticket.id] = answers;
            });

            // Resolve each ticket's effective holder info (own override, else its own current info)
            const ticketHoldersPayload: Record<number, Record<string, any>> = {};
            ticketsToConfigure.forEach((ticket) => {
                const holderPhoneCountry = getTicketHolderValue(ticket, 'phoneCountryIso2') || phoneCountry;
                const holderPhoneRaw = getTicketHolderValue(ticket, 'phone_number');
                const holderDigits = holderPhoneRaw.replace(/\D/g, '');
                const holderPhoneNSN = holderDigits.length > 1 && holderDigits.startsWith('0') ? holderDigits.slice(1) : holderDigits;
                const holderE164Phone = holderPhoneRaw
                    ? formatToE164(holderPhoneCountry, holderPhoneNSN) || `+84${holderPhoneNSN}`
                    : undefined;

                ticketHoldersPayload[ticket.id] = {
                    title: getTicketHolderValue(ticket, 'title') || undefined,
                    name: getTicketHolderValue(ticket, 'name') || undefined,
                    email: getTicketHolderValue(ticket, 'email') || undefined,
                    phoneNumber: holderE164Phone,
                    address: getTicketHolderValue(ticket, 'address') || undefined,
                    dob: getTicketHolderValue(ticket, 'dob') || undefined,
                    idcardNumber: getTicketHolderValue(ticket, 'idcard_number') || undefined,
                };
            });

            const response: AxiosResponse<{ message: string; newTransactionId: number }> =
                await baseHttpServiceInstance.post(
                    `/event-studio/events/${transaction.eventId}/transactions/${transaction.id}/transfer-tickets`,
                    {
                        giftMode,
                        ticketIds,
                        customer: customerPayload,
                        formAnswers,
                        ticketFormAnswers: ticketFormAnswersPayload,
                        ticketHolders: ticketHoldersPayload,
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

    const stepLabels = [
        tt('Chọn phương thức tặng vé', 'Select gift method'),
        tt('Người sở hữu mới', 'New ticket holders'),
        tt('Người nhận mới', 'New recipient'),
    ];

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
                                <Stepper activeStep={activeStep} alternativeLabel>
                                    {stepLabels.map((label) => (
                                        <Step key={label}>
                                            <StepLabel>{label}</StepLabel>
                                        </Step>
                                    ))}
                                </Stepper>

                                {/* Step 1: Gift Mode Selection */}
                                {activeStep === 0 && (
                                    <Stack spacing={3}>
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
                                    </Stack>
                                )}

                                {/* Step 2: Per-ticket holder info + custom fields */}
                                {activeStep === 1 && (
                                    <Box>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 0.5 }}>
                                            <Box>
                                                <Typography variant="h6">
                                                    {tt('Danh sách người sở hữu mới', 'New Ticket Holders')}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {tt(
                                                        'Mặc định lấy theo thông tin hiện tại của từng vé - có thể sửa nếu cần.',
                                                        "Defaults to each ticket's current info - edit if needed."
                                                    )}
                                                </Typography>
                                            </Box>
                                            <Button size="small" onClick={handleClearAllTicketOverrides}>
                                                {tt('Xoá tất cả', 'Clear all')}
                                            </Button>
                                        </Stack>
                                        {ticketsToConfigure.length === 0 ? (
                                            <Typography color="text.secondary">
                                                {tt('Vui lòng quay lại bước 1 để chọn vé', 'Please go back to step 1 to select tickets')}
                                            </Typography>
                                        ) : (
                                            <Stack spacing={1} sx={{ mt: 1 }}>
                                                {ticketsToConfigure.map((ticket, idx) => {
                                                    const titleCfg = findTicketFieldConfig('title');
                                                    const nameCfg = findTicketFieldConfig('name');
                                                    const emailCfg = findTicketFieldConfig('email');
                                                    const phoneCfg = findTicketFieldConfig('phone_number');
                                                    const addressCfg = findTicketFieldConfig('address');
                                                    const dobCfg = findTicketFieldConfig('dob');
                                                    const idCfg = findTicketFieldConfig('idcard_number');

                                                    return (
                                                        <Accordion key={ticket.id} disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, '&:before': { display: 'none' } }}>
                                                            <AccordionSummary expandIcon={<CaretDownIcon />} sx={{ minHeight: 40, '& .MuiAccordionSummary-content': { my: 0.5, alignItems: 'center' } }}>
                                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                        {tt(`Vé ${idx + 1}`, `Ticket ${idx + 1}`)} (TID-{ticket.id})
                                                                    </Typography>
                                                                    {`${ticket.holderTitle || ''} ${ticket.holderName}`.trim() && (
                                                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                                            {`${ticket.holderTitle || ''} ${ticket.holderName}`.trim()}
                                                                        </Typography>
                                                                    )}
                                                                    <Box sx={{ flex: 1 }} />
                                                                    {idx > 0 && (
                                                                        <Button
                                                                            size="small"
                                                                            variant="text"
                                                                            startIcon={<CopyIcon size={12} />}
                                                                            sx={{ minWidth: 'auto', px: 1, py: 0.25, fontSize: '0.75rem', textTransform: 'none' }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleCopyFromFirstTicket(ticket);
                                                                            }}
                                                                        >
                                                                            {tt('Copy từ vé 1', 'Copy from ticket 1')}
                                                                        </Button>
                                                                    )}
                                                                </Stack>
                                                            </AccordionSummary>
                                                            <AccordionDetails sx={{ pt: 0 }}>
                                                                <Grid container spacing={1} sx={{ mb: customTicketFields.length > 0 ? 1.5 : 0 }}>
                                                                    {(titleCfg?.visible ?? true) && (
                                                                        <Grid item xs={4} sm={2}>
                                                                            <FormControl fullWidth size="small">
                                                                                <InputLabel>{tt('Danh xưng', 'Title')}</InputLabel>
                                                                                <Select
                                                                                    label={tt('Danh xưng', 'Title')}
                                                                                    value={getTicketHolderValue(ticket, 'title')}
                                                                                    onChange={(e) => handleTicketHolderChange(ticket.id, 'title', e.target.value)}
                                                                                >
                                                                                    {getTitleOptions().map((option) => (
                                                                                        <MenuItem key={option.value} value={option.value}>
                                                                                            {option.label}
                                                                                        </MenuItem>
                                                                                    ))}
                                                                                </Select>
                                                                            </FormControl>
                                                                        </Grid>
                                                                    )}
                                                                    {(nameCfg?.visible ?? true) && (
                                                                        <Grid item xs={8} sm={4}>
                                                                            <FormControl fullWidth size="small">
                                                                                <InputLabel>{tt('Họ tên', 'Full name')}</InputLabel>
                                                                                <OutlinedInput
                                                                                    size="small"
                                                                                    label={tt('Họ tên', 'Full name')}
                                                                                    value={getTicketHolderValue(ticket, 'name')}
                                                                                    onChange={(e) => handleTicketHolderChange(ticket.id, 'name', e.target.value)}
                                                                                />
                                                                            </FormControl>
                                                                        </Grid>
                                                                    )}
                                                                    {(emailCfg?.visible ?? true) && (
                                                                        <Grid item xs={12} sm={3}>
                                                                            <FormControl fullWidth size="small">
                                                                                <InputLabel>Email</InputLabel>
                                                                                <OutlinedInput
                                                                                    size="small"
                                                                                    label="Email"
                                                                                    value={getTicketHolderValue(ticket, 'email')}
                                                                                    onChange={(e) => handleTicketHolderChange(ticket.id, 'email', e.target.value)}
                                                                                />
                                                                            </FormControl>
                                                                        </Grid>
                                                                    )}
                                                                    {(phoneCfg?.visible ?? true) && (
                                                                        <Grid item xs={12} sm={3}>
                                                                            <FormControl fullWidth size="small">
                                                                                <InputLabel>{tt('SĐT', 'Phone')}</InputLabel>
                                                                                <OutlinedInput
                                                                                    size="small"
                                                                                    type="tel"
                                                                                    label={tt('SĐT', 'Phone')}
                                                                                    value={getTicketHolderValue(ticket, 'phone_number')}
                                                                                    onChange={(e) => handleTicketHolderChange(ticket.id, 'phone_number', e.target.value)}
                                                                                    startAdornment={
                                                                                        <InputAdornment position="start">
                                                                                            <Select
                                                                                                variant="standard"
                                                                                                disableUnderline
                                                                                                value={getTicketHolderValue(ticket, 'phoneCountryIso2')}
                                                                                                onChange={(e) => handleTicketHolderChange(ticket.id, 'phoneCountryIso2', e.target.value)}
                                                                                                sx={{ minWidth: 44 }}
                                                                                                renderValue={(value) => {
                                                                                                    const country = PHONE_COUNTRIES.find((c) => c.iso2 === value) || DEFAULT_PHONE_COUNTRY;
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
                                                                    )}
                                                                    {addressCfg?.visible && (
                                                                        <Grid item xs={12} sm={4}>
                                                                            <FormControl fullWidth size="small">
                                                                                <InputLabel>{tt('Địa chỉ', 'Address')}</InputLabel>
                                                                                <OutlinedInput
                                                                                    size="small"
                                                                                    label={tt('Địa chỉ', 'Address')}
                                                                                    value={getTicketHolderValue(ticket, 'address')}
                                                                                    onChange={(e) => handleTicketHolderChange(ticket.id, 'address', e.target.value)}
                                                                                />
                                                                            </FormControl>
                                                                        </Grid>
                                                                    )}
                                                                    {dobCfg?.visible && (
                                                                        <Grid item xs={6} sm={4}>
                                                                            <FormControl fullWidth size="small">
                                                                                <InputLabel shrink>{tt('Ngày sinh', 'Date of birth')}</InputLabel>
                                                                                <OutlinedInput
                                                                                    size="small"
                                                                                    type="date"
                                                                                    label={tt('Ngày sinh', 'Date of birth')}
                                                                                    value={getTicketHolderValue(ticket, 'dob')}
                                                                                    onChange={(e) => handleTicketHolderChange(ticket.id, 'dob', e.target.value)}
                                                                                />
                                                                            </FormControl>
                                                                        </Grid>
                                                                    )}
                                                                    {idCfg?.visible && (
                                                                        <Grid item xs={6} sm={4}>
                                                                            <FormControl fullWidth size="small">
                                                                                <InputLabel>{tt('CCCD', 'ID card')}</InputLabel>
                                                                                <OutlinedInput
                                                                                    size="small"
                                                                                    label={tt('CCCD', 'ID card')}
                                                                                    value={getTicketHolderValue(ticket, 'idcard_number')}
                                                                                    onChange={(e) => handleTicketHolderChange(ticket.id, 'idcard_number', e.target.value)}
                                                                                />
                                                                            </FormControl>
                                                                        </Grid>
                                                                    )}
                                                                </Grid>
                                                                <Grid container spacing={1.5}>
                                                                    {customTicketFields.map((field) => {
                                                                        const rawValue = getTicketFormAnswerValue(ticket, field.internalName);

                                                                        return (
                                                                            <Grid item key={field.internalName} xs={12} sm={6}>
                                                                                <Stack spacing={0.5}>
                                                                                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                                                                        {field.label}
                                                                                        {field.required && <span style={{ color: 'red' }}> *</span>}
                                                                                    </Typography>

                                                                                    {['text', 'number'].includes(field.fieldType) && (
                                                                                        <OutlinedInput
                                                                                            fullWidth
                                                                                            size="small"
                                                                                            type={field.fieldType === 'number' ? 'number' : 'text'}
                                                                                            value={rawValue}
                                                                                            onChange={(e) =>
                                                                                                handleTicketFormAnswerChange(
                                                                                                    ticket.id,
                                                                                                    field.internalName,
                                                                                                    field.fieldType === 'number' ? Number(e.target.value) : e.target.value
                                                                                                )
                                                                                            }
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
                                                                                            onChange={(e) => handleTicketFormAnswerChange(ticket.id, field.internalName, e.target.value)}
                                                                                        />
                                                                                    )}

                                                                                    {field.fieldType === 'radio' && field.options && (
                                                                                        <RadioGroup
                                                                                            row
                                                                                            value={rawValue}
                                                                                            onChange={(e) => handleTicketFormAnswerChange(ticket.id, field.internalName, e.target.value)}
                                                                                        >
                                                                                            {field.options.map((opt) => (
                                                                                                <FormControlLabel
                                                                                                    key={opt.value}
                                                                                                    value={opt.value}
                                                                                                    control={<Radio size="small" sx={{ p: 0.5 }} />}
                                                                                                    label={<Typography variant="body2">{opt.label}</Typography>}
                                                                                                />
                                                                                            ))}
                                                                                        </RadioGroup>
                                                                                    )}

                                                                                    {field.fieldType === 'checkbox' && field.options && (
                                                                                        <FormGroup row>
                                                                                            {field.options.map((opt) => {
                                                                                                const current: string[] = Array.isArray(rawValue) ? rawValue : [];
                                                                                                const checked = current.includes(opt.value);
                                                                                                return (
                                                                                                    <FormControlLabel
                                                                                                        key={opt.value}
                                                                                                        control={
                                                                                                            <Checkbox
                                                                                                                size="small"
                                                                                                                sx={{ p: 0.5 }}
                                                                                                                checked={checked}
                                                                                                                onChange={(e) => {
                                                                                                                    const newValue = e.target.checked
                                                                                                                        ? [...current, opt.value]
                                                                                                                        : current.filter((v) => v !== opt.value);
                                                                                                                    handleTicketFormAnswerChange(ticket.id, field.internalName, newValue);
                                                                                                                }}
                                                                                                            />
                                                                                                        }
                                                                                                        label={<Typography variant="body2">{opt.label}</Typography>}
                                                                                                    />
                                                                                                );
                                                                                            })}
                                                                                        </FormGroup>
                                                                                    )}

                                                                                    {!['text', 'number', 'date', 'time', 'datetime', 'radio', 'checkbox'].includes(field.fieldType) && (
                                                                                        <OutlinedInput
                                                                                            fullWidth
                                                                                            size="small"
                                                                                            value={rawValue}
                                                                                            onChange={(e) => handleTicketFormAnswerChange(ticket.id, field.internalName, e.target.value)}
                                                                                        />
                                                                                    )}
                                                                                </Stack>
                                                                            </Grid>
                                                                        );
                                                                    })}
                                                                </Grid>
                                                            </AccordionDetails>
                                                        </Accordion>
                                                    );
                                                })}
                                            </Stack>
                                        )}
                                    </Box>
                                )}

                                {/* Step 3: New recipient / transaction info */}
                                {activeStep === 2 && (
                                    <Box>
                                        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
                                            <Typography variant="h6">
                                                {tt('Thông tin người nhận mới', 'New Recipient Information')}
                                            </Typography>
                                            {ticketsToConfigure.length > 0 && (
                                                <Button size="small" variant="text" startIcon={<CopyIcon size={14} />} onClick={handleCopyRecipientFromFirstTicket}>
                                                    {tt('Copy từ vé 1', 'Copy from ticket 1')}
                                                </Button>
                                            )}
                                        </Stack>
                                        <Grid container spacing={2}>
                                            {/* Built-in fields */}
                                            {(() => {
                                                const nameCfg = checkoutFormFields.find((f) => f.internalName === 'name');
                                                const visible = nameCfg ? nameCfg.visible : true;
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
                                )}

                                {/* Navigation */}
                                <Stack direction="row" spacing={2} justifyContent="space-between">
                                    <Button onClick={activeStep === 0 ? onClose : handleBack} disabled={isSubmitting}>
                                        {activeStep === 0 ? tt('Hủy', 'Cancel') : tt('Quay lại', 'Back')}
                                    </Button>
                                    {activeStep < 2 ? (
                                        <Button variant="contained" onClick={handleNext} disabled={isLoading}>
                                            {tt('Tiếp tục', 'Next')}
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="contained"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || isLoading}
                                            startIcon={isSubmitting ? <CircularProgress size={20} /> : <GiftIcon />}
                                        >
                                            {isSubmitting ? tt('Đang xử lý...', 'Processing...') : tt('Xác nhận', 'Confirm')}
                                        </Button>
                                    )}
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
