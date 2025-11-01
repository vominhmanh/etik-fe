"use client";

import { Avatar, Button, CardActions, CardContent, Container, FormControl, Grid, InputAdornment, InputLabel, MenuItem, Modal, OutlinedInput, Select, Stack, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import { cyan, deepOrange, deepPurple, green, indigo, pink, yellow } from "@mui/material/colors";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Radio from "@mui/material/Radio";
import { ArrowCounterClockwise as ArrowCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr/ArrowCounterClockwise";
import { DotsThreeVertical as DotsThreeVerticalIcon } from "@phosphor-icons/react/dist/ssr/DotsThreeVertical";
import React, { useState } from "react";
import { Show } from "./page";
import { Plus, Ticket, X } from "@phosphor-icons/react/dist/ssr";
import NotificationContext from "@/contexts/notification-context";


interface TicketCategoriesProps {
  show: Show;
  qrOption?: string;
  requestedCategoryModalId?: number;
  onModalRequestHandled?: () => void;
  onCategorySelect: (ticketCategoryId: number) => void;
  onAddToCart?: (ticketCategoryId: number, quantity: number, holders?: { title: string; name: string; email: string; phone: string; }[]) => void;
}

type ColorMap = {
  [key: number]: string
}

const colorMap: ColorMap = {
  0: deepOrange[500],
  1: deepPurple[500],
  2: green[500],
  3: cyan[500],
  4: indigo[500],
  5: pink[500],
  6: yellow[500],
  7: deepPurple[300],
};

export function TicketCategories({ show, qrOption, requestedCategoryModalId, onModalRequestHandled, onCategorySelect, onAddToCart }: TicketCategoriesProps): React.JSX.Element {
  const ticketCategories = show.ticketCategories;
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [ticketCategoryDescriptionModalOpen, setTicketCategoryDescriptionModalOpen] = useState(false);
  const [selectedTicketCategory, setSelectedTicketCategory] = useState<any>(null); // Store selected ticket category
  const [ticketQuantities, setTicketQuantities] = useState<Record<number, number>>({});
  const [cartQuantities, setCartQuantities] = useState<Record<number, number>>({});
  const [showMore, setShowMore] = useState(false);
  const notificationCtx = React.useContext(NotificationContext);
  type TicketHolderInfo = { title: string; name: string; email: string; phone: string };
  const [ticketHolderInfos, setTicketHolderInfos] = useState<{ title: string; name: string; email: string; phone: string; }[]>([]);
  const [ticketHolderInfosByCategory, setTicketHolderInfosByCategory] = useState<Record<number, TicketHolderInfo[]>>({});
  // no separate holder modal; details are inside the description modal

  React.useEffect(() => {
    if (!requestedCategoryModalId) return;
    const target = ticketCategories.find((c) => c.id === requestedCategoryModalId);
    if (!target) return;
    setSelectedTicketCategory(target);
    setTicketCategoryDescriptionModalOpen(true);
    const maxAllowed = getMaxAllowedForCategory(target);
    const initialQty = Math.max(1, Math.min(maxAllowed, ticketQuantities[target.id] || 1));
    setTicketQuantities((prev) => ({ ...prev, [target.id]: initialQty }));
    const saved = ticketHolderInfosByCategory[target.id] || [];
    const next = Array.from({ length: initialQty }, (_, i) => saved[i] || { title: 'Bạn', name: '', email: '', phone: '' });
    setTicketHolderInfos(next);
    onModalRequestHandled && onModalRequestHandled();
  }, [requestedCategoryModalId]);

  const formatPrice = (price: number) => {
    return price.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
  };

  const typeMap: { [key: string]: string } = {
    private: "Nội bộ",
    public: "Công khai",
  };

  const handleSelect = (id: number) => {
    const ticketCategory = ticketCategories.find((ticketCategory) => ticketCategory.id === id);

    if (!ticketCategory) return;  // If the ticket category doesn't exist

    // Combine all conditions to check if the ticket is valid
    const isValidSelection = ticketCategory.status === 'on_sale' && ticketCategory.sold < ticketCategory.quantity && !ticketCategory.disabled;

    // Only proceed if all conditions are met
    if (isValidSelection) {
      setSelectedCategory(id);
      onCategorySelect(id);;
    }
  };

  const getMaxAllowedForCategory = (ticketCategory: any) => {
    if (!ticketCategory) return 1;
    const remaining = Math.max(0, (ticketCategory.quantity || 0) - (ticketCategory.sold || 0));
    const perTransactionLimit = ticketCategory.limitPerTransaction || remaining || 1;
    return Math.max(1, Math.min(remaining || 1, perTransactionLimit));
  };

  const handleOpenDescriptionModal = (ticketCategory: any) => {
    setSelectedTicketCategory(ticketCategory);
    setTicketCategoryDescriptionModalOpen(true);
    setShowMore(false);
    setTicketQuantities((prev) => {
      const current = prev[ticketCategory.id];
      if (current && current > 0) return prev;
      const maxAllowed = getMaxAllowedForCategory(ticketCategory);
      return { ...prev, [ticketCategory.id]: Math.min(1, maxAllowed) };
    });
    // Initialize holder infos to match current quantity (default 1)
    const initialQty = Math.max(1, Math.min(getMaxAllowedForCategory(ticketCategory), ticketQuantities[ticketCategory.id] || 1));
    const saved = ticketHolderInfosByCategory[ticketCategory.id] || [];
    const next = Array.from({ length: initialQty }, (_, i) => saved[i] || { title: 'Bạn', name: '', email: '', phone: '' });
    setTicketHolderInfos(next);
  };

  const handleTicketQuantityChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!selectedTicketCategory) return;
    const raw = parseInt(event.target.value as unknown as string, 10);
    const value = Number.isNaN(raw) ? 0 : raw;
    const maxAllowed = getMaxAllowedForCategory(selectedTicketCategory);
    const clamped = Math.max(0, Math.min(value, maxAllowed));
    setTicketQuantities((prev) => ({ ...prev, [selectedTicketCategory.id]: clamped }));
    // Adjust holder infos length to match clamped quantity
    setTicketHolderInfos((prev) => {
      if (clamped <= 0) return [];
      if (clamped === prev.length) return prev;
      if (clamped < prev.length) return prev.slice(0, clamped);
      const additions = Array.from({ length: clamped - prev.length }, () => ({ title: 'Bạn', name: '', email: '', phone: '' }));
      return [...prev, ...additions];
    });
  };

  const handleAddToCart = () => {
    if (!selectedTicketCategory) return;
    const id = selectedTicketCategory.id as number;
    const qty = ticketQuantities[id] ?? 0;
    if (qty > 0 && qrOption === 'separate') {
      const hasInvalid = ticketHolderInfos.slice(0, qty).some((h) => !h.title || !h.name);
      if (hasInvalid) {
        notificationCtx.warning('Vui lòng điền đủ thông tin người tham dự cho mỗi vé.');
        return;
      }
    }
    if (qty <= 0) {
      setCartQuantities((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setTicketHolderInfosByCategory((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      notificationCtx.info('Xóa khỏi đơn hàng thành công');
    } else {
      setCartQuantities((prev) => ({ ...prev, [id]: qty }));
      setTicketHolderInfosByCategory((prev) => ({ ...prev, [id]: ticketHolderInfos.slice(0, qty) }));
      notificationCtx.info('Lưu thành công');
    }
    if (typeof onAddToCart === 'function') {
      onAddToCart(id, qty, qty > 0 ? ticketHolderInfos.slice(0, qty) : []);
    }
    setTicketCategoryDescriptionModalOpen(false);

  };

  return (
    <>
      <Card>
        <CardHeader
          title={`Chọn loại vé cho ${show.name}`}
          action={
            <IconButton>
              <ArrowCounterClockwiseIcon fontSize="var(--icon-fontSize-md)" />
            </IconButton>
          }
        />
        <Divider />
        <List>
          {ticketCategories.map((ticketCategory, index) => (
            <ListItem
              divider={index < ticketCategories.length - 1}
              key={ticketCategory.id}
              sx={{ cursor: "pointer" }}
            >
              {/* <Box
                sx={{ display: "flex", alignItems: "center", marginRight: "10px" }}
                onClick={() => handleSelect(ticketCategory.id)}
              >
                <Radio
                  sx={{ display: "block" }}
                  checked={selectedCategory === ticketCategory.id}
                  disabled={
                    ticketCategory.status !== "on_sale" ||
                    ticketCategory.sold >= ticketCategory.quantity ||
                    ticketCategory.disabled
                  }
                />
              </Box> */}
              <ListItemAvatar
                onClick={() => handleSelect(ticketCategory.id)}
              >
                {ticketCategory.avatar ? (
                  <Box
                    component="img"
                    src={ticketCategory.avatar}
                    sx={{ borderRadius: 1, height: "48px", width: "48px" }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      height: "48px",
                      width: "48px",
                      fontSize: "2rem",
                      borderRadius: "5px",
                      bgcolor: colorMap[ticketCategory.id % 8],
                    }}
                    variant="square"
                  >
                    <Ticket />
                  </Avatar>
                )}
              </ListItemAvatar>
              <ListItemText
                onClick={() => handleOpenDescriptionModal(ticketCategory)}
                primary={ticketCategory.name}
                primaryTypographyProps={{ variant: "subtitle2" }}
                secondary={
                  `${formatPrice(ticketCategory.price)} ${ticketCategory.disabled
                    ? "| Đang khóa bởi hệ thống"
                    : ticketCategory.status !== "on_sale"
                      ? ticketCategory.status === "not_opened_for_sale"
                        ? "| Chưa mở bán"
                        : ticketCategory.status === "temporarily_locked"
                          ? "| Đang tạm khóa"
                          : ""
                      : ticketCategory.sold >= ticketCategory.quantity
                        ? "| Đã hết"
                        : `| Còn ${ticketCategory.quantity - ticketCategory.sold}/${ticketCategory.quantity} vé`
                  }`
                }
                secondaryTypographyProps={{ variant: "caption" }}
              />
              {cartQuantities[ticketCategory.id] ? (
                <Button variant="text" sx={{ color: "primary.main", fontSize: "1.1rem" }} onClick={() => handleOpenDescriptionModal(ticketCategory)}>{cartQuantities[ticketCategory.id]}</Button>
              ) : (
                <IconButton onClick={() => handleOpenDescriptionModal(ticketCategory)}>
                  <Plus />
                </IconButton>
              )}

            </ListItem>
          ))}
        </List>
      </Card>
      <Modal
        open={ticketCategoryDescriptionModalOpen}
        onClose={() => setTicketCategoryDescriptionModalOpen(false)}
        aria-labelledby="ticket-category-description-modal-title"
        aria-describedby="ticket-category-description-modal-description"
      >
        <Container maxWidth="xl">
          <Card
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: { md: "700px", xs: "95%" },
              maxHeight: '90vh',
              bgcolor: "background.paper",
              boxShadow: 24,
            }}
          >
            <CardHeader
              title={`${show?.name} - ${selectedTicketCategory?.name}`}
              action={
                <IconButton onClick={() => setTicketCategoryDescriptionModalOpen(false)}>
                  <X />
                </IconButton>
              }
            />
            <CardContent sx={{ pt: 0, maxHeight: '70vh', overflowY: 'auto' }}>
              <Stack spacing={4}>

                <Stack spacing={0} sx={{ display: "flex", alignItems: "flex-start", pl: 2, boxShadow: 'inset 4px 0 6px -6px rgba(0,0,0,0.25)' }}>
                  {selectedTicketCategory?.description ? (
                    <>
                      <Box
                        sx={{
                          fontSize: '14px',
                          margin: 0,
                          padding: 0,
                          "& img": {
                            maxWidth: "100%",
                            height: "auto",
                          },
                          ...(showMore
                            ? {}
                            : {
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }),
                        }}
                        dangerouslySetInnerHTML={{
                          __html: selectedTicketCategory?.description,
                        }}
                      />

                      {showMore && (
                        <>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Số vé tối đa mỗi đơn hàng:{" "}
                            {selectedTicketCategory?.limitPerTransaction || "Không giới hạn"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            Số vé tối đa mỗi khách hàng:{" "}
                            {selectedTicketCategory?.limitPerCustomer || "Không giới hạn"}
                          </Typography>
                        </>
                      )}
                      {!showMore && (
                        <Button size="small" variant="text" onClick={() => setShowMore(true)} sx={{ alignSelf: 'flex-start', px: 0 }}>
                          Xem thêm
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Số vé tối đa mỗi đơn hàng:{" "}
                        {selectedTicketCategory?.limitPerTransaction || "Không giới hạn"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        Số vé tối đa mỗi khách hàng:{" "}
                        {selectedTicketCategory?.limitPerCustomer || "Không giới hạn"}
                      </Typography>
                    </>
                  )}
                </Stack>
                <Stack spacing={1}>
                  {/* createdAt */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">Đơn giá</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {formatPrice(selectedTicketCategory?.price || 0)}
                    </Typography>
                  </Grid>
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">Số lượng vé</Typography>
                    </Stack>
                    <Typography variant="body1">
                      <OutlinedInput
                        sx={{ maxWidth: 80 }}
                        size="small"
                        type="number"
                        value={selectedTicketCategory ? (ticketQuantities[selectedTicketCategory.id] ?? 0) : 0}
                        onChange={handleTicketQuantityChange}
                        inputProps={{ min: 0 }}
                      />
                    </Typography>
                  </Grid>
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">Thành tiền</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {formatPrice((selectedTicketCategory?.price || 0) * (ticketQuantities[selectedTicketCategory?.id as number] ?? 0))}
                    </Typography>
                  </Grid>
                </Stack>
                {qrOption === 'separate' && (
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Thông tin người tham dự</Typography>
                    <Grid container spacing={2}>
                      {ticketHolderInfos.map((holder, index) => (
                        <React.Fragment key={`holder-${index}`}>
                          <Grid item md={5} xs={12}>
                            <FormControl fullWidth size="small" required>
                              <InputLabel>Danh xưng* &emsp; Họ và tên vé {index + 1}</InputLabel>
                              <OutlinedInput
                                label={`Danh xưng* &emsp; Họ và tên vé ${index + 1}`}
                                value={holder.name}
                                onChange={(e) => {
                                  setTicketHolderInfos((prev) => {
                                    const next = [...prev];
                                    next[index] = { ...next[index], name: e.target.value };
                                    return next;
                                  });
                                }}
                                startAdornment={
                                  <InputAdornment position="start">
                                    <Select
                                      variant="standard"
                                      disableUnderline
                                      value={holder.title || 'Bạn'}
                                      onChange={(e) => {
                                        setTicketHolderInfos((prev) => {
                                          const next = [...prev];
                                          next[index] = { ...next[index], title: e.target.value as string };
                                          return next;
                                        });
                                      }}
                                      sx={{ minWidth: 65 }}
                                    >
                                      <MenuItem value="Anh">Anh</MenuItem>
                                      <MenuItem value="Chị">Chị</MenuItem>
                                      <MenuItem value="Bạn">Bạn</MenuItem>
                                      <MenuItem value="Em">Em</MenuItem>
                                      <MenuItem value="Ông">Ông</MenuItem>
                                      <MenuItem value="Bà">Bà</MenuItem>
                                      <MenuItem value="Cô">Cô</MenuItem>
                                      <MenuItem value="Mr.">Mr.</MenuItem>
                                      <MenuItem value="Ms.">Ms.</MenuItem>
                                      <MenuItem value="Miss">Miss</MenuItem>
                                      <MenuItem value="Thầy">Thầy</MenuItem>
                                    </Select>
                                  </InputAdornment>
                                }
                              />
                            </FormControl>
                          </Grid>
                          <Grid item md={4} xs={12}>
                            <FormControl fullWidth size="small">
                              <InputLabel>Email vé {index + 1}</InputLabel>
                              <OutlinedInput
                                label={`Email vé ${index + 1}`}
                                type="email"
                                value={holder.email}
                                onChange={(e) => {
                                  setTicketHolderInfos((prev) => {
                                    const next = [...prev];
                                    next[index] = { ...next[index], email: e.target.value };
                                    return next;
                                  });
                                }}
                              />
                            </FormControl>
                          </Grid>
                          <Grid item md={3} xs={12}>
                            <FormControl fullWidth size="small">
                              <InputLabel>SĐT vé {index + 1}</InputLabel>
                              <OutlinedInput
                                label={`SĐT vé ${index + 1}`}
                                type="tel"
                                value={holder.phone}
                                onChange={(e) => {
                                  setTicketHolderInfos((prev) => {
                                    const next = [...prev];
                                    next[index] = { ...next[index], phone: e.target.value };
                                    return next;
                                  });
                                }}
                              />
                            </FormControl>
                          </Grid>
                        </React.Fragment>
                      ))}
                    </Grid>
                  </Stack>
                )}

                
              </Stack>
            </CardContent>
            <Divider />
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button
                size="small"
                color={(ticketQuantities[selectedTicketCategory?.id as number] ?? 1) > 0 ? "primary" : "error"}
                variant="contained"
                onClick={handleAddToCart}
                disabled={
                  !selectedTicketCategory ||
                  (selectedTicketCategory.status !== 'on_sale') ||
                  (selectedTicketCategory.sold >= selectedTicketCategory.quantity) ||
                  !!selectedTicketCategory.disabled ||
                  (ticketQuantities[selectedTicketCategory?.id as number] ?? 0) < 0
                }
              >
                {(ticketQuantities[selectedTicketCategory?.id as number] ?? 1) > 0 ? 'Lưu' : 'Xóa khỏi giỏ hàng'}
              </Button>
            </CardActions>
          </Card>
        </Container>
      </Modal>
    </>
  );
}
