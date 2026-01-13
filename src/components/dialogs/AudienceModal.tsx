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
    FormControlLabel,
    Switch,
} from "@mui/material";
import React, { useContext, useEffect, useState } from 'react';
import { useTranslation } from "@/contexts/locale-context";
import NotificationContext from "@/contexts/notification-context";

// --- Types ---
export interface Audience {
    id: number;
    eventId: number;
    code: string;
    name: string;
    description?: string;
    condition?: any;
    isActive: boolean;
    isDefault: boolean;
    created_at: string;
}

export interface AudienceCreate {
    code: string;
    name: string;
    description?: string;
    isActive?: boolean;
}

export interface AudienceUpdate {
    name?: string;
    description?: string;
    isActive?: boolean;
}

interface AudienceModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (values: AudienceCreate | AudienceUpdate) => Promise<void>;
    initialValues?: Audience;
    isEdit?: boolean;
}

const PREDEFINED_AUDIENCES = [
    { code: "adult", name: "Người lớn" },
    { code: "student", name: "Học sinh / Sinh viên" },
    { code: "child", name: "Trẻ em" },
    { code: "senior", name: "Người cao tuổi" },
    { code: "foreigner", name: "Người nước ngoài" },
    { code: "member", name: "Thành viên" },
    { code: "vip", name: "VIP" },
    { code: "other", name: "Khác" },
];

export const AudienceModal = ({
    open,
    onClose,
    onSubmit,
    initialValues,
    isEdit = false,
}: AudienceModalProps) => {
    const { tt } = useTranslation();
    const notificationCtx = useContext(NotificationContext);
    const [formData, setFormData] = useState({
        code: "adult",
        name: "Người lớn",
        description: "",
        isActive: true,
    });

    const [selectedType, setSelectedType] = useState<string>("adult");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Determine initial selected type
    useEffect(() => {
        if (open) {
            if (initialValues) {
                // If editing, check if code matches predefined
                const found = PREDEFINED_AUDIENCES.find(
                    (a) => a.code === initialValues.code
                );
                setSelectedType(found ? found.code : "other");
                setFormData({
                    code: initialValues.code,
                    name: initialValues.name,
                    description: initialValues.description || "",
                    isActive: initialValues.isActive,
                });
            } else {
                // Reset for create
                setSelectedType("adult");
                setFormData({
                    code: "adult",
                    name: "Người lớn",
                    description: "",
                    isActive: true,
                });
            }
        }
    }, [open, initialValues]);

    const handleTypeChange = (event: any) => {
        const newCode = event.target.value;
        setSelectedType(newCode);

        if (newCode !== "other") {
            const predefined = PREDEFINED_AUDIENCES.find((a) => a.code === newCode);
            if (predefined) {
                setFormData((prev) => ({
                    ...prev,
                    code: predefined.code,
                    name: predefined.name,
                }));
            }
        } else {
            // Clear for other
            setFormData((prev) => ({
                ...prev,
                code: "",
                name: "",
            }))
        }
    };

    const handleChange = (field: string, value: string | boolean) => {
        setFormData((prev) => {
            const newData = { ...prev, [field]: value };
            // Auto-generate code if 'other' is selected and not editing
            if (field === "name" && selectedType === "other" && !isEdit && typeof value === 'string') {
                const autoCode = value
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]/g, "_")
                    .substring(0, 50);
                newData.code = autoCode;
            }
            return newData;
        });
    }

    const validate = (): boolean => {
        if (!formData.name.trim()) {
            notificationCtx.warning(tt("Vui lòng nhập tên đối tượng", "Please enter audience name"));
            return false;
        }
        if (!formData.code.trim()) {
            notificationCtx.warning(tt("Vui lòng nhập mã đối tượng", "Please enter audience code"));
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
            // Error handling normally done in parent or global handler
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={handleSubmit}>
                <DialogTitle>
                    {isEdit ? tt("Chỉnh sửa đối tượng", "Edit Audience") : tt("Thêm đối tượng mua vé", "Add Audience")}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3}>
                        {!isEdit && (
                            <FormControl fullWidth>
                                <InputLabel>{tt("Chọn loại đối tượng", "Select Audience Type")}</InputLabel>
                                <Select
                                    value={selectedType}
                                    label={tt("Chọn loại đối tượng", "Select Audience Type")}
                                    onChange={handleTypeChange}
                                >
                                    {PREDEFINED_AUDIENCES.map((option) => (
                                        <MenuItem key={option.code} value={option.code}>
                                            {option.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        <TextField
                            fullWidth
                            id="name"
                            name="name"
                            label={tt("Tên hiển thị", "Display Name")}
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            required
                        />

                        <TextField
                            fullWidth
                            id="code"
                            name="code"
                            label={tt("Mã định danh (Code)", "Identifier Code")}
                            value={formData.code}
                            onChange={(e) => handleChange("code", e.target.value)}
                            helperText={
                                tt("Mã dùng để phân biệt trong hệ thống (A-Z, 0-9, _)", "Code used to distinguish in system (A-Z, 0-9, _)")
                            }
                            disabled={!isEdit && selectedType !== "other"} // Disable unless 'other'
                            InputProps={{
                                readOnly: isEdit,
                            }}
                            required
                        />

                        <TextField
                            fullWidth
                            id="description"
                            name="description"
                            label={tt("Mô tả (tùy chọn)", "Description (optional)")}
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                        />

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={formData.isActive}
                                    onChange={(e) => handleChange("isActive", e.target.checked)}
                                    color="success"
                                />
                            }
                            label={formData.isActive ? tt("Hoạt động", "Active") : tt("Không hoạt động", "Inactive")}
                        />
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
