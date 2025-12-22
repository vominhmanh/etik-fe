import * as React from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Popover,
    Stack,
    Typography,
} from '@mui/material';
import { HexColorPicker } from 'react-colorful';
import { FloppyDisk } from '@phosphor-icons/react/dist/ssr';

interface TicketCategory {
    id: number;
    name: string;
    color: string;
}

const MOCK_CATEGORIES: TicketCategory[] = [
    { id: 1, name: 'Vé VIP', color: '#f44336' },
    { id: 2, name: 'Vé thường', color: '#9c27b0' },
    { id: 3, name: 'Vé sinh viên', color: '#2196f3' },
];

interface TicketCategoryModalProps {
    open: boolean;
    onClose: () => void;
}

export function TicketCategoryModal({ open, onClose }: TicketCategoryModalProps) {
    const [categories, setCategories] = React.useState<TicketCategory[]>(MOCK_CATEGORIES);
    const [colorPickerAnchor, setColorPickerAnchor] = React.useState<null | HTMLElement>(null);
    const [activeCategoryId, setActiveCategoryId] = React.useState<number | null>(null);

    // Handle color change
    const handleColorChange = (newColor: string) => {
        if (activeCategoryId !== null) {
            setCategories((prev) =>
                prev.map((cat) => (cat.id === activeCategoryId ? { ...cat, color: newColor } : cat))
            );
        }
    };

    const handleOpenColorPicker = (event: React.MouseEvent<HTMLElement>, categoryId: number) => {
        setColorPickerAnchor(event.currentTarget);
        setActiveCategoryId(categoryId);
    };

    const handleCloseColorPicker = () => {
        setColorPickerAnchor(null);
        setActiveCategoryId(null);
    };

    const activeCategory = categories.find((c) => c.id === activeCategoryId);

    const handleSave = () => {
        console.log('Saving categories:', categories);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Hạng mục vé</DialogTitle>
            <DialogContent dividers>
                <List sx={{ pt: 0 }}>
                    {categories.map((category) => (
                        <ListItem key={category.id} disableGutters>
                            <Stack direction="row" spacing={2} alignItems="center" width="100%">
                                <Box
                                    onClick={(e) => handleOpenColorPicker(e, category.id)}
                                    sx={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        bgcolor: category.color,
                                        cursor: 'pointer',
                                        border: '2px solid #fff',
                                        boxShadow: '0 0 0 1px #e0e0e0',
                                    }}
                                />
                                <ListItemText primary={category.name} />
                            </Stack>
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Hủy
                </Button>
                <Button onClick={handleSave} variant="contained" startIcon={<FloppyDisk size={18} />}>
                    Lưu
                </Button>
            </DialogActions>

            {/* Color Picker Popover */}
            <Popover
                open={Boolean(colorPickerAnchor)}
                anchorEl={colorPickerAnchor}
                onClose={handleCloseColorPicker}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ p: 2 }}>
                    <HexColorPicker
                        color={activeCategory?.color || '#000000'}
                        onChange={handleColorChange}
                    />
                </Box>
            </Popover>
        </Dialog>
    );
}
