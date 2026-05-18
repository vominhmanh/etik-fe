import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Checkbox,
    ListItemText,
    OutlinedInput,
    Typography,
} from "@mui/material";
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from "@/contexts/locale-context";
import NotificationContext from "@/contexts/notification-context";
import { Audience } from "./AudienceModal";

export interface AddOn {
    id: number;
    eventId: number;
    name: string;
    ticketCategoryIds: number[];
    audienceIds: number[];
    createdAt: string;
    updatedAt: string;
}

export interface AddOnCreate {
    name: string;
    ticketCategoryIds: number[];
    audienceIds: number[];
}

interface TicketCategoryItem {
    id: number;
    name: string;
    showName: string;
}

interface AddOnModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: AddOnCreate) => Promise<void>;
    initialValues?: AddOn;
    isEdit?: boolean;
    shows: any[]; // Or properly typed if exported
    audiences: Audience[];
}

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

export const AddOnModal = ({
    open,
    onClose,
    onSubmit,
    initialValues,
    isEdit = false,
    shows,
    audiences,
}: AddOnModalProps) => {
    const { tt } = useTranslation();
    const notificationCtx = useContext(NotificationContext);
    const [formData, setFormData] = useState<AddOnCreate>({
        name: "",
        ticketCategoryIds: [],
        audienceIds: [],
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Flatten ticket categories from shows
    const allTicketCategories: TicketCategoryItem[] = [];
    shows.forEach(show => {
        show.ticketCategories.forEach((tc: any) => {
            allTicketCategories.push({
                id: tc.id,
                name: tc.name,
                showName: show.name
            });
        });
    });

    useEffect(() => {
        if (open) {
            if (initialValues) {
                setFormData({
                    name: initialValues.name,
                    ticketCategoryIds: initialValues.ticketCategoryIds || [],
                    audienceIds: initialValues.audienceIds || [],
                });
            } else {
                setFormData({
                    name: "",
                    ticketCategoryIds: [],
                    audienceIds: [],
                });
            }
        }
    }, [open, initialValues]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));
    }

    const validate = (): boolean => {
        if (!formData.name.trim()) {
            notificationCtx.warning(tt("Vui lòng nhập tên tiện ích", "Please enter utility name"));
            return false;
        }
        return true;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (err: any) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isAllTcSelected = allTicketCategories.length > 0 && formData.ticketCategoryIds.length === allTicketCategories.length;
    const isAllAudienceSelected = audiences.length > 0 && formData.audienceIds.length === audiences.length;

    const handleSelectAllTc = () => {
        if (isAllTcSelected) {
            handleChange("ticketCategoryIds", []);
        } else {
            handleChange("ticketCategoryIds", allTicketCategories.map(tc => tc.id));
        }
    };

    const handleSelectAllAudience = () => {
        if (isAllAudienceSelected) {
            handleChange("audienceIds", []);
        } else {
            handleChange("audienceIds", audiences.map(a => a.id));
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>
                    {isEdit ? tt("Chỉnh sửa tiện ích", "Edit Utility") : tt("Thêm tiện ích bổ sung", "Add Utility")}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3}>
                        <TextField
                            fullWidth
                            id="name"
                            name="name"
                            label={tt("Tên tiện ích", "Utility Name")}
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            required
                        />

                        <FormControl fullWidth>
                            <InputLabel id="tc-multiple-checkbox-label">{tt("Áp dụng cho các loại vé", "Apply to Ticket Categories")}</InputLabel>
                            <Select
                                labelId="tc-multiple-checkbox-label"
                                id="tc-multiple-checkbox"
                                multiple
                                value={formData.ticketCategoryIds}
                                onChange={(e) => {
                                    const value = e.target.value as number[];
                                    // Remove 'select-all' value if it's there
                                    if (value.includes(-1)) return;
                                    handleChange("ticketCategoryIds", value);
                                }}
                                input={<OutlinedInput label={tt("Áp dụng cho các vé", "Apply to Tickets")} />}
                                renderValue={(selected) => {
                                    const selectedTcs = allTicketCategories.filter(tc => selected.includes(tc.id));
                                    return selectedTcs.map(tc => `${tc.showName} - ${tc.name}`).join(', ');
                                }}
                                MenuProps={MenuProps}
                            >
                                <MenuItem value={-1} onClick={handleSelectAllTc}>
                                    <Checkbox checked={isAllTcSelected} />
                                    <ListItemText primary={tt("Chọn tất cả", "Select All")} sx={{ fontWeight: 'bold' }} />
                                </MenuItem>
                                {allTicketCategories.map((tc) => (
                                    <MenuItem key={tc.id} value={tc.id}>
                                        <Checkbox checked={formData.ticketCategoryIds.indexOf(tc.id) > -1} />
                                        <ListItemText primary={`${tc.showName} - ${tc.name}`} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel id="audience-multiple-checkbox-label">{tt("Áp dụng cho các đối tượng", "Apply to Audiences")}</InputLabel>
                            <Select
                                labelId="audience-multiple-checkbox-label"
                                id="audience-multiple-checkbox"
                                multiple
                                value={formData.audienceIds}
                                onChange={(e) => {
                                    const value = e.target.value as number[];
                                    if (value.includes(-1)) return;
                                    handleChange("audienceIds", value);
                                }}
                                input={<OutlinedInput label={tt("Áp dụng cho các đối tượng", "Apply to Audiences")} />}
                                renderValue={(selected) => {
                                    const selectedAudiences = audiences.filter(a => selected.includes(a.id));
                                    return selectedAudiences.map(a => a.name).join(', ');
                                }}
                                MenuProps={MenuProps}
                            >
                                <MenuItem value={-1} onClick={handleSelectAllAudience}>
                                    <Checkbox checked={isAllAudienceSelected} />
                                    <ListItemText primary={tt("Chọn tất cả", "Select All")} sx={{ fontWeight: 'bold' }} />
                                </MenuItem>
                                {audiences.map((a) => (
                                    <MenuItem key={a.id} value={a.id}>
                                        <Checkbox checked={formData.audienceIds.indexOf(a.id) > -1} />
                                        <ListItemText primary={a.name} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                            * {tt("tiện ích / quà tặng sẽ tự động được gán vào vé nếu vé thoả mãn 2 điều kiện trên", "add-ons / gifts will be automatically assigned to the ticket if the ticket satisfies both conditions above")}
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
                        {tt("Hủy bỏ", "Cancel")}
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isEdit ? tt("Lưu thay đổi", "Save Changes") : tt("Tạo mới", "Create New")}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};
