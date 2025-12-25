"use client";

import { Avatar, Button, CardActions, CardContent, Container, Grid, Modal, OutlinedInput, Stack, Typography } from "@mui/material";
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
import { useTranslation } from "@/contexts/locale-context";


interface TicketCategoriesProps {
  show: Show;
  qrOption?: string;
  requireTicketHolderInfo?: boolean;
  cartQuantities?: Record<number, number>;
  requestedCategoryModalId?: number;
  onModalRequestHandled?: () => void;
  onCategorySelect: (ticketCategoryId: number) => void;
  onAddToCart?: (ticketCategoryId: number, quantity: number, holders?: { title: string; name: string; email: string; phone: string; phoneCountryIso2?: string; }[]) => void;
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

export function TicketCategories({ show, cartQuantities = {}, requestedCategoryModalId, onModalRequestHandled, onCategorySelect, onAddToCart }: TicketCategoriesProps): React.JSX.Element {
  const { tt } = useTranslation();
  const ticketCategories = show.ticketCategories;
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [ticketCategoryDescriptionModalOpen, setTicketCategoryDescriptionModalOpen] = useState(false);
  const [selectedTicketCategory, setSelectedTicketCategory] = useState<any>(null); // Store selected ticket category
  const [ticketQuantities, setTicketQuantities] = useState<Record<number, number>>({});
  const [showMore, setShowMore] = useState(false);
  const notificationCtx = React.useContext(NotificationContext);
  // no separate holder modal; details are inside the description modal

  React.useEffect(() => {
    if (!requestedCategoryModalId) return;
    const target = ticketCategories.find((c) => c.id === requestedCategoryModalId);
    if (!target) return;
    setSelectedTicketCategory(target);
    setTicketCategoryDescriptionModalOpen(true);
    const maxAllowed = getMaxAllowedForCategory(target);
    const initialQty = Math.max(1, Math.min(maxAllowed, cartQuantities[target.id] ?? ticketQuantities[target.id] ?? 1));
    setTicketQuantities((prev) => ({ ...prev, [target.id]: initialQty }));
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
      const fromCart = cartQuantities[ticketCategory.id];
      return { ...prev, [ticketCategory.id]: Math.min(Math.max(1, fromCart ?? 1), maxAllowed) };
    });
  };

  const handleTicketQuantityChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!selectedTicketCategory) return;
    const raw = parseInt(event.target.value as unknown as string, 10);
    const value = Number.isNaN(raw) ? 0 : raw;
    const maxAllowed = getMaxAllowedForCategory(selectedTicketCategory);
    const clamped = Math.max(0, Math.min(value, maxAllowed));
    setTicketQuantities((prev) => ({ ...prev, [selectedTicketCategory.id]: clamped }));
  };

  const handleAddToCart = () => {
    if (!selectedTicketCategory) return;
    const id = selectedTicketCategory.id as number;
    const qty = ticketQuantities[id] ?? 0;
    if (qty <= 0) {
      notificationCtx.info(tt('Xóa khỏi đơn hàng thành công', 'Removed from order successfully'));
    } else {
      notificationCtx.info(tt('Đã lưu vào giỏ hàng', 'Saved successfully'));
    }
    if (typeof onAddToCart === 'function') {
      onAddToCart(id, qty);
    }
    setTicketCategoryDescriptionModalOpen(false);

  };

  return (
    <>
      <Card>
        <CardHeader
          title={tt(`Chọn loại vé cho ${show.name}`, `Select ticket category for ${show.name}`)}
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
                    ? `| ${tt("Đang khóa bởi hệ thống", "Locked by system")}`
                    : ticketCategory.status !== "on_sale"
                      ? ticketCategory.status === "not_opened_for_sale"
                        ? `| ${tt("Chưa mở bán", "Not opened for sale")}`
                        : ticketCategory.status === "temporarily_locked"
                          ? `| ${tt("Đang tạm khóa", "Temporarily locked")}`
                          : ""
                      : ticketCategory.sold >= ticketCategory.quantity
                        ? `| ${tt("Đã hết", "Sold out")}`
                        : `| ${tt("Còn", "Available")} ${ticketCategory.quantity - ticketCategory.sold}/${ticketCategory.quantity} ${tt("vé", "tickets")}`
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
        sx={{ zIndex: (theme) => theme.zIndex.modal + 2 }}
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
                            {tt("Số vé tối đa mỗi đơn hàng:", "Maximum tickets per order:")}{" "}
                            {selectedTicketCategory?.limitPerTransaction || tt("Không giới hạn", "Unlimited")}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "text.secondary" }}>
                            {tt("Số vé tối đa mỗi khách hàng:", "Maximum tickets per customer:")}{" "}
                            {selectedTicketCategory?.limitPerCustomer || tt("Không giới hạn", "Unlimited")}
                          </Typography>
                        </>
                      )}
                      {!showMore && (
                        <Button size="small" variant="text" onClick={() => setShowMore(true)} sx={{ alignSelf: 'flex-start', px: 0 }}>
                          {tt("Xem thêm", "Show more")}
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {tt("Số vé tối đa mỗi đơn hàng:", "Maximum tickets per order:")}{" "}
                        {selectedTicketCategory?.limitPerTransaction || tt("Không giới hạn", "Unlimited")}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>
                        {tt("Số vé tối đa mỗi khách hàng:", "Maximum tickets per customer:")}{" "}
                        {selectedTicketCategory?.limitPerCustomer || tt("Không giới hạn", "Unlimited")}
                      </Typography>
                    </>
                  )}
                </Stack>
                <Stack spacing={1}>
                  {/* createdAt */}
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{tt("Đơn giá", "Unit Price")}</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {formatPrice(selectedTicketCategory?.price || 0)}
                    </Typography>
                  </Grid>
                  <Grid sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">{tt("Số lượng vé", "Ticket Quantity")}</Typography>
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
                      <Typography variant="body1">{tt("Thành tiền", "Total Amount")}</Typography>
                    </Stack>
                    <Typography variant="body1">
                      {formatPrice((selectedTicketCategory?.price || 0) * (ticketQuantities[selectedTicketCategory?.id as number] ?? 0))}
                    </Typography>
                  </Grid>
                </Stack>
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
                {(ticketQuantities[selectedTicketCategory?.id as number] ?? 1) > 0 ? tt('Lưu', 'Save') : tt('Xóa khỏi giỏ hàng', 'Remove from cart')}
              </Button>
            </CardActions>
          </Card>
        </Container>
      </Modal>
    </>
  );
}
