export type TicketCategory = {
    id: number;
    avatar: string | null;
    name: string;
    price: number;
    type: string;
    description: string;
    status: string;
    color?: string; // Optional as it might not be in all responses initially? User added it recently.
    quantity: number;
    sold: number;
    disabled: boolean;
    limitPerTransaction: number | null;
    limitPerCustomer: number | null;
};

export type Show = {
    id: number;
    name: string;
    avatar: string;
    status: string;
    type: string;
    disabled: boolean;
    seatmapMode?: 'no_seatmap' | 'seatings_selection' | 'ticket_categories_selection' | string;
    layoutJson?: any;
    startDateTime: string;
    endDateTime: string;
    ticketCategories: TicketCategory[];
    limitPerTransaction?: number | null;
    limitPerCustomer?: number | null;
};

export type CheckoutRuntimeFieldOption = {
    value: string;
    label: string;
    sortOrder: number;
};

export type CheckoutRuntimeField = {
    internalName: string;
    label: string;
    fieldType: string;
    visible: boolean;
    required: boolean;
    note?: string | null;
    options?: CheckoutRuntimeFieldOption[];
};

export type EventResponse = {
    id: number;
    name: string;
    organizer: string;
    description: string;
    startDateTime: string | null;
    endDateTime: string | null;
    place: string | null;
    locationUrl: string | null;
    bannerUrl: string;
    avatarUrl?: string; // Optional in some contexts? Marketplace has it.
    slug: string;
    locationInstruction: string | null;
    shows: Show[];
    checkoutFormFields: CheckoutRuntimeField[];
    displayOption?: string;
    timeInstruction?: string;
    limitPerTransaction?: number | null;
    limitPerCustomer?: number | null;
};

export type TicketHolderInfo = {
    title: string;
    name: string;
    email: string;
    phone: string;
    phoneCountryIso2?: string;
    avatar?: string;
};

export interface CustomerInfo {
    title: string;
    name: string;
    email: string;
    phoneNumber: string; // E.164 format for BE
    nationalPhone: string; // National number for state/copy
    address: string;
    phoneCountryIso2?: string; // Country code for state/copy
    dob?: string | null;
    idcard_number?: string;
    avatar?: string;
}

export interface HolderInfo {
    title: string;
    name: string;
    email?: string;
    phone?: string; // E.164 format for BE
    nationalPhone?: string; // National number for state/copy
    avatar?: string;
    address?: string;
    gender?: string;
    nationality?: string;
    idcard_number?: string;
    phoneCountryIso2?: string; // Country code for state/copy
}

export interface TicketInfo {
    showId: number;
    ticketCategoryId: number;
    seatId?: string;
    seatRow?: string | undefined;
    seatNumber?: string | undefined;
    seatLabel?: string | undefined;
    holder?: HolderInfo;
    price?: number;
}

export interface Order {
    customer: CustomerInfo;
    tickets: TicketInfo[];
    qrOption: 'shared' | 'separate';
    paymentMethod: string;
    extraFee: number;
    formAnswers?: Record<string, any>;
    voucherCode?: string;
}

export interface Transaction {
    id: number;
    paymentCheckoutUrl: string | null;
}
