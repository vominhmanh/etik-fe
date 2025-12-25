"use client";

import * as React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import { alpha } from '@mui/material/styles';
import { CaretDown, DotsThreeOutlineVertical, Pencil, Plus } from '@phosphor-icons/react/dist/ssr';
import { Ticket as TicketIcon } from '@phosphor-icons/react/dist/ssr/Ticket';

import { LocalizedLink } from '@/components/localized-link';
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES } from '@/config/phone-countries';

import type { CheckoutRuntimeField, Show, TicketHolderInfo } from './page';

export type Step2InfoProps = {
  tt: (vi: string, en: string) => string;
  locale: string;
  defaultTitle: string;
  paramsEventId: number;

  // Buyer info form menu
  formMenuAnchorEl: HTMLElement | null;
  onOpenFormMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onCloseFormMenu: () => void;

  // Buyer info
  customer: {
    title: string;
    name: string;
    email: string;
    phoneNumber: string;
    phoneCountryIso2: string;
    dob: string | null;
    address: string;
    idcard_number: string;
    avatar: string;
  };
  setCustomer: React.Dispatch<React.SetStateAction<any>>;
  ticketHolderEditted: boolean;
  ticketHolders: TicketHolderInfo[];
  setTicketHolders: React.Dispatch<React.SetStateAction<TicketHolderInfo[]>>;

  checkoutFormFields: CheckoutRuntimeField[];
  customCheckoutFields: CheckoutRuntimeField[];
  builtinInternalNames: Set<string>;
  checkoutCustomAnswers: Record<string, any>;
  setCheckoutCustomAnswers: React.Dispatch<React.SetStateAction<Record<string, any>>>;

  // Ticket holders section
  requireGuestAvatar: boolean;
  requireTicketHolderInfo: boolean;
  selectedCategories: Record<number, Record<number, number>>;
  shows: Show[];
  ticketHoldersByCategory: Record<string, TicketHolderInfo[]>;
  setTicketHoldersByCategory: React.Dispatch<React.SetStateAction<Record<string, TicketHolderInfo[]>>>;
  handleCustomerAvatarFile: (file?: File) => void;
  handleTicketHolderAvatarFile: (showId: number, categoryId: number, index: number, file?: File) => void;
  formatPrice: (price: number) => string;
  setActiveScheduleId: (showId: number) => void;
  setRequestedCategoryModalId: (categoryId: number) => void;

  onBack: () => void;
  onNext: () => void;
};

export function Step2Info(props: Step2InfoProps): React.JSX.Element {
  const {
    tt,
    locale,
    defaultTitle,
    paramsEventId,
    formMenuAnchorEl,
    onOpenFormMenu,
    onCloseFormMenu,
    customer,
    setCustomer,
    ticketHolderEditted,
    ticketHolders,
    setTicketHolders,
    checkoutFormFields,
    customCheckoutFields,
    builtinInternalNames,
    checkoutCustomAnswers,
    setCheckoutCustomAnswers,
    requireGuestAvatar,
    requireTicketHolderInfo,
    selectedCategories,
    shows,
    ticketHoldersByCategory,
    setTicketHoldersByCategory,
    handleCustomerAvatarFile,
    handleTicketHolderAvatarFile,
    formatPrice,
    setActiveScheduleId,
    setRequestedCategoryModalId,
    onBack,
    onNext,
  } = props;

  return (
    <Stack spacing={3}>
      {/* Customer Information Card */}
      <Card>
        <CardHeader
          subheader={tt("Vui lòng điền các trường thông tin phía dưới.", "Please fill in the information fields below.")}
          title={tt("Thông tin người mua", "Buyer Information")}
          action={
            <>
              <IconButton onClick={onOpenFormMenu}>
                <DotsThreeOutlineVertical />
              </IconButton>
              <Menu
                anchorEl={formMenuAnchorEl}
                open={Boolean(formMenuAnchorEl)}
                onClose={onCloseFormMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              >
                <MenuItem onClick={onCloseFormMenu}>
                  <LocalizedLink
                    style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}
                    href={`/event-studio/events/${paramsEventId}/etik-forms/checkout-form?back_to=/event-studio/events/${paramsEventId}/transactions/create`}
                  >
                    {tt("Thêm câu hỏi vào biểu mẫu này", "Add questions to this form")}
                  </LocalizedLink>
                </MenuItem>
              </Menu>
            </>
          }
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid lg={4} xs={12}>
              <FormControl fullWidth required>
                <InputLabel htmlFor="customer-name">{tt("Danh xưng* &emsp; Họ và tên", "Title* &emsp; Full Name")}</InputLabel>
                <OutlinedInput
                  id="customer-name"
                  label={tt("Danh xưng* &emsp; Họ và tên", "Title* &emsp; Full Name")}
                  name="customer_name"
                  value={customer.name}
                  onChange={(e) => {
                    !ticketHolderEditted && ticketHolders.length > 0 &&
                      setTicketHolders((prev) => {
                        const updatedHolders = [...prev];
                        const current = updatedHolders[0] || { title: 'Bạn', name: '', email: '', phone: '', avatar: '' };
                        updatedHolders[0] = { ...current, name: e.target.value };
                        return updatedHolders;
                      });
                    setCustomer({ ...customer, name: e.target.value });
                  }}
                  startAdornment={
                    <InputAdornment position="start">
                      <Select
                        variant="standard"
                        disableUnderline
                        value={customer.title || defaultTitle}
                        onChange={(e) => setCustomer({ ...customer, title: e.target.value })}
                        sx={{ minWidth: 65 }}
                      >
                        <MenuItem value="Anh">Anh</MenuItem>
                        <MenuItem value="Chị">Chị</MenuItem>
                        <MenuItem value="Bạn">Bạn</MenuItem>
                        <MenuItem value="Em">Em</MenuItem>
                        <MenuItem value="Ông">Ông</MenuItem>
                        <MenuItem value="Bà">Bà</MenuItem>
                        <MenuItem value="Cô">Cô</MenuItem>
                        <MenuItem value="Thầy">Thầy</MenuItem>
                        <MenuItem value="Mr.">Mr.</MenuItem>
                        <MenuItem value="Ms.">Ms.</MenuItem>
                        <MenuItem value="Mx.">Mx.</MenuItem>
                        <MenuItem value="Miss">Miss</MenuItem>
                      </Select>
                    </InputAdornment>
                  }
                />
              </FormControl>
            </Grid>

            <Grid md={4} xs={12}>
              <FormControl fullWidth required>
                <InputLabel>{tt("Địa chỉ Email", "Email Address")}</InputLabel>
                <OutlinedInput
                  label={tt("Địa chỉ Email", "Email Address")}
                  name="customer_email"
                  type="email"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                />
              </FormControl>
            </Grid>

            <Grid md={4} xs={12}>
              <FormControl fullWidth required>
                <InputLabel>{tt("Số điện thoại", "Phone Number")}</InputLabel>
                <OutlinedInput
                  label={tt("Số điện thoại", "Phone Number")}
                  name="customer_phone_number"
                  type="tel"
                  value={customer.phoneNumber}
                  onChange={(e) => setCustomer({ ...customer, phoneNumber: e.target.value })}
                  startAdornment={
                    <InputAdornment position="start">
                      <Select
                        variant="standard"
                        disableUnderline
                        value={customer.phoneCountryIso2}
                        onChange={(e) => setCustomer({ ...customer, phoneCountryIso2: e.target.value as string })}
                        sx={{ minWidth: 80 }}
                        renderValue={(value) => {
                          const country = PHONE_COUNTRIES.find((c) => c.iso2 === value) || DEFAULT_PHONE_COUNTRY;
                          return country.dialCode;
                        }}
                      >
                        {PHONE_COUNTRIES.map((country) => (
                          <MenuItem key={country.iso2} value={country.iso2}>
                            {tt(country.nameVi, country.nameEn)} ({country.dialCode})
                          </MenuItem>
                        ))}
                      </Select>
                    </InputAdornment>
                  }
                />
              </FormControl>
            </Grid>

            {/* Builtin optional fields controlled by checkout form config */}
            {(() => {
              const dobCfg = checkoutFormFields.find((f) => f.internalName === 'dob');
              const visible = !!dobCfg && dobCfg.visible;
              const required = !!dobCfg?.required;
              return (
                visible && (
                  <Grid lg={6} xs={12}>
                    <TextField
                      fullWidth
                      label={tt("Ngày tháng năm sinh", "Date of Birth")}
                      name="customer_dob"
                      type="date"
                      required={required}
                      value={customer.dob || ""}
                      onChange={(e) => setCustomer({ ...customer, dob: e.target.value })}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ max: new Date().toISOString().slice(0, 10) }}
                    />
                  </Grid>
                )
              );
            })()}

            {(() => {
              const idCfg = checkoutFormFields.find((f) => f.internalName === 'idcard_number');
              const visible = !!idCfg && idCfg.visible;
              const required = !!idCfg?.required;
              return (
                visible && (
                  <Grid lg={6} xs={12}>
                    <FormControl fullWidth required={required}>
                      <InputLabel>{tt("Số Căn cước công dân", "ID Card Number")}</InputLabel>
                      <OutlinedInput
                        label={tt("Số Căn cước công dân", "ID Card Number")}
                        name="customer_idcard_number"
                        value={customer.idcard_number}
                        onChange={(e) => setCustomer({ ...customer, idcard_number: e.target.value })}
                      />
                    </FormControl>
                  </Grid>
                )
              );
            })()}

            {(() => {
              const addrCfg = checkoutFormFields.find((f) => f.internalName === 'address');
              const visible = !!addrCfg && addrCfg.visible;
              const required = !!addrCfg?.required;
              return (
                visible && (
                  <Grid lg={12} xs={12}>
                    <FormControl fullWidth required={required}>
                      <InputLabel>{tt("Địa chỉ", "Address")}</InputLabel>
                      <OutlinedInput
                        label={tt("Địa chỉ", "Address")}
                        name="customer_address"
                        value={customer.address}
                        onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      />
                    </FormControl>
                  </Grid>
                )
              );
            })()}

            {/* Custom checkout fields */}
            {customCheckoutFields.map((field) => (
              <Grid key={field.internalName} xs={12}>
                <Stack spacing={0.5}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {field.label}
                    {field.required && ' *'}
                  </Typography>
                  {field.note && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {field.note}
                    </Typography>
                  )}

                  {['text', 'number'].includes(field.fieldType) && (
                    <TextField
                      fullWidth
                      size="small"
                      type={field.fieldType === 'number' ? 'number' : 'text'}
                      value={checkoutCustomAnswers[field.internalName] ?? ''}
                      onChange={(e) =>
                        setCheckoutCustomAnswers((prev) => ({
                          ...prev,
                          [field.internalName]: e.target.value,
                        }))
                      }
                    />
                  )}

                  {['date', 'time', 'datetime'].includes(field.fieldType) && (
                    <TextField
                      fullWidth
                      size="small"
                      type={
                        field.fieldType === 'date'
                          ? 'date'
                          : field.fieldType === 'time'
                            ? 'time'
                            : 'datetime-local'
                      }
                      InputLabelProps={{ shrink: true }}
                      value={checkoutCustomAnswers[field.internalName] ?? ''}
                      onChange={(e) =>
                        setCheckoutCustomAnswers((prev) => ({
                          ...prev,
                          [field.internalName]: e.target.value,
                        }))
                      }
                    />
                  )}

                  {field.fieldType === 'radio' && field.options && (
                    <FormControl component="fieldset" variant="standard">
                      <Stack spacing={1}>
                        {field.options.map((opt) => (
                          <FormControlLabel
                            key={opt.value}
                            value={opt.value}
                            control={
                              <Checkbox
                                checked={checkoutCustomAnswers[field.internalName] === opt.value}
                                onChange={() =>
                                  setCheckoutCustomAnswers((prev) => ({
                                    ...prev,
                                    [field.internalName]: opt.value,
                                  }))
                                }
                              />
                            }
                            label={opt.label}
                          />
                        ))}
                      </Stack>
                    </FormControl>
                  )}

                  {field.fieldType === 'checkbox' && field.options && (
                    <FormGroup>
                      {field.options.map((opt) => {
                        const current: string[] = checkoutCustomAnswers[field.internalName] ?? [];
                        const checked = current.includes(opt.value);
                        return (
                          <FormControlLabel
                            key={opt.value}
                            control={
                              <Checkbox
                                size="small"
                                checked={checked}
                                onChange={(e) => {
                                  setCheckoutCustomAnswers((prev) => {
                                    const prevArr: string[] = prev[field.internalName] ?? [];
                                    const nextArr = e.target.checked
                                      ? Array.from(new Set([...prevArr, opt.value]))
                                      : prevArr.filter((v) => v !== opt.value);
                                    return { ...prev, [field.internalName]: nextArr };
                                  });
                                }}
                              />
                            }
                            label={opt.label}
                          />
                        );
                      })}
                    </FormGroup>
                  )}
                </Stack>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Ticket holders input (accordion) */}
      {Object.values(selectedCategories).some((catMap) => Object.keys(catMap || {}).length > 0) && (
        <Card>
          <CardHeader
            title={tt(
              `Thông tin người sở hữu vé: ${Object.values(selectedCategories).reduce((s, m) => s + Object.values(m || {}).reduce((a, q) => a + (q || 0), 0), 0)} vé`,
              `Ticket List`
            )}
            action={
              requireGuestAvatar && (
                <Box sx={{ position: 'relative', width: 36, height: 36, '&:hover .avatarUploadBtn': { opacity: 1, visibility: 'visible' } }}>
                  <Avatar src={customer.avatar || ''} sx={{ width: 36, height: 36 }} />
                  <IconButton
                    className="avatarUploadBtn"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      opacity: 0,
                      visibility: 'hidden',
                      backdropFilter: 'blur(6px)',
                      backgroundColor: 'rgba(0,0,0,0.35)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                    onClick={() => {
                      const input = document.getElementById('upload-customer-avatar') as HTMLInputElement | null;
                      input?.click();
                    }}
                  >
                    <Plus size={14} />
                  </IconButton>
                  <input
                    id="upload-customer-avatar"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      handleCustomerAvatarFile(f);
                      e.currentTarget.value = '';
                    }}
                  />
                </Box>
              )
            }
          />
          <Divider />
          <CardContent>
            <Stack spacing={3}>
              {Object.entries(selectedCategories).flatMap(([showId, categories]) => {
                const show = shows.find((s) => s.id === parseInt(showId));
                return Object.entries(categories || {}).map(([categoryIdStr, qty]) => {
                  const categoryId = parseInt(categoryIdStr);
                  const ticketCategory = show?.ticketCategories.find((cat) => cat.id === categoryId);
                  const quantity = qty || 0;
                  return (
                    <Stack spacing={2} key={`${showId}-${categoryId}`}>
                      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Stack spacing={2} direction={'row'} sx={{ display: 'flex', alignItems: 'center' }}>
                          <TicketIcon fontSize="var(--icon-fontSize-md)" />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {show?.name || tt('Chưa xác định', 'Not specified')} - {ticketCategory?.name || tt('Chưa rõ loại vé', 'Unknown ticket category')}
                          </Typography>
                          <IconButton
                            size="small"
                            sx={{ ml: 1, alignSelf: 'flex-start' }}
                            onClick={() => {
                              setActiveScheduleId(parseInt(showId));
                              setRequestedCategoryModalId(categoryId);
                            }}
                          >
                            <Pencil />
                          </IconButton>
                        </Stack>
                        <Stack spacing={2} direction={'row'} sx={{ pl: { xs: 5, md: 0 } }}>
                          <Typography variant="caption">{formatPrice(ticketCategory?.price || 0)}</Typography>
                          <Typography variant="caption">x {quantity}</Typography>
                          <Typography variant="caption">= {formatPrice((ticketCategory?.price || 0) * quantity)}</Typography>
                        </Stack>
                      </Stack>

                      {requireTicketHolderInfo && quantity > 0 && (
                        <Stack spacing={2}>
                          {Array.from({ length: quantity }, (_, index) => {
                            const holderKey = `${showId}-${categoryId}`;
                            const holderInfo =
                              ticketHoldersByCategory[holderKey]?.[index] || {
                                title: locale === 'en' ? 'Mx.' : 'Bạn',
                                name: '',
                                email: '',
                                phone: '',
                                phoneCountryIso2: DEFAULT_PHONE_COUNTRY.iso2,
                                avatar: '',
                              };

                            const setHolderInfo = (patch: Partial<typeof holderInfo>) => {
                              setTicketHoldersByCategory((prev) => {
                                const arr = prev[holderKey] || [];
                                const next = arr.slice();
                                const current = next[index] || holderInfo;
                                next[index] = { ...current, ...patch };
                                return { ...prev, [holderKey]: next };
                              });
                            };

                            return (
                              <Accordion
                                key={`${holderKey}-${index}`}
                                defaultExpanded
                                disableGutters
                                elevation={0}
                                sx={{
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  backgroundColor: 'background.paper',
                                  backgroundImage: (theme) =>
                                    `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.06)}, ${alpha(theme.palette.secondary.main, 0.04)})`,
                                  '&:before': { display: 'none' },
                                }}
                              >
                                <AccordionSummary
                                  expandIcon={<CaretDown />}
                                  sx={{
                                    minHeight: 44,
                                    '& .MuiAccordionSummary-content': { my: 0.5, alignItems: 'center' },
                                  }}
                                >
                                  <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%', minWidth: 0 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                      {tt(`Vé ${index + 1}`, `Ticket ${index + 1}`)}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                                      {holderInfo.name ? `${holderInfo.title ? `${holderInfo.title} ` : ''}${holderInfo.name}` : tt('Chưa có thông tin', 'No information')}
                                    </Typography>
                                  </Stack>
                                </AccordionSummary>
                                <AccordionDetails sx={{ pt: 0, pb: 2 }}>
                                  <Grid container spacing={2} alignItems="center">
                                    <Grid xs={12} md={2}>
                                      <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'center' } }}>
                                        <Box sx={{ position: 'relative', width: 48, height: 48, '&:hover .avatarUploadBtn': { opacity: 1, visibility: 'visible' } }}>
                                          <Avatar src={holderInfo.avatar || ''} sx={{ width: 48, height: 48 }} />
                                          <IconButton
                                            className="avatarUploadBtn"
                                            size="small"
                                            sx={{
                                              position: 'absolute',
                                              top: 0,
                                              left: 0,
                                              width: '100%',
                                              height: '100%',
                                              borderRadius: '50%',
                                              opacity: 0,
                                              visibility: 'hidden',
                                              backdropFilter: 'blur(6px)',
                                              backgroundColor: 'rgba(0,0,0,0.35)',
                                              color: 'white',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              zIndex: 1,
                                            }}
                                            onClick={() => {
                                              const input = document.getElementById(`upload-holder-${showId}-${categoryId}-${index}`) as HTMLInputElement | null;
                                              input?.click();
                                            }}
                                            aria-label={tt('Tải ảnh đại diện', 'Upload avatar')}
                                          >
                                            <Plus size={14} />
                                          </IconButton>
                                          <input
                                            id={`upload-holder-${showId}-${categoryId}-${index}`}
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={(e) => {
                                              const f = e.target.files?.[0];
                                              handleTicketHolderAvatarFile(parseInt(showId), categoryId, index, f);
                                              e.currentTarget.value = '';
                                            }}
                                          />
                                        </Box>
                                      </Box>
                                    </Grid>

                                    <Grid xs={12} md={4}>
                                      <FormControl fullWidth size="small" required>
                                        <InputLabel>
                                          {tt(`Danh xưng*    Họ và tên vé ${index + 1}`, `Title* &emsp; Full Name ticket ${index + 1}`)}
                                        </InputLabel>
                                        <OutlinedInput
                                          label={tt(`Danh xưng*    Họ và tên vé ${index + 1}`, `Title* &emsp; Full Name ticket ${index + 1}`)}
                                          value={holderInfo.name}
                                          onChange={(e) => setHolderInfo({ name: e.target.value })}
                                          startAdornment={
                                            <InputAdornment position="start">
                                              <Select
                                                variant="standard"
                                                disableUnderline
                                                value={holderInfo.title || (locale === 'en' ? 'Mx.' : 'Bạn')}
                                                onChange={(e) => setHolderInfo({ title: e.target.value })}
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
                                                <MenuItem value="Mx.">Mx.</MenuItem>
                                                <MenuItem value="Miss">Miss</MenuItem>
                                                <MenuItem value="Thầy">Thầy</MenuItem>
                                              </Select>
                                            </InputAdornment>
                                          }
                                        />
                                      </FormControl>
                                    </Grid>

                                    <Grid xs={12} md={3}>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>{tt(`Email vé ${index + 1}`, `Email ticket ${index + 1}`)}</InputLabel>
                                        <OutlinedInput
                                          label={tt(`Email vé ${index + 1}`, `Email ticket ${index + 1}`)}
                                          type="email"
                                          value={holderInfo.email || ''}
                                          onChange={(e) => setHolderInfo({ email: e.target.value })}
                                        />
                                      </FormControl>
                                    </Grid>

                                    <Grid xs={12} md={3}>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>{tt(`SĐT vé ${index + 1}`, `Phone ticket ${index + 1}`)}</InputLabel>
                                        <OutlinedInput
                                          label={tt(`SĐT vé ${index + 1}`, `Phone ticket ${index + 1}`)}
                                          type="tel"
                                          value={holderInfo.phone || ''}
                                          onChange={(e) => setHolderInfo({ phone: e.target.value })}
                                          startAdornment={
                                            <InputAdornment position="start">
                                              <Select
                                                variant="standard"
                                                disableUnderline
                                                value={holderInfo.phoneCountryIso2 || DEFAULT_PHONE_COUNTRY.iso2}
                                                onChange={(event) => setHolderInfo({ phoneCountryIso2: event.target.value })}
                                                sx={{ minWidth: 50 }}
                                                renderValue={(value) => {
                                                  const country = PHONE_COUNTRIES.find((c) => c.iso2 === value) || DEFAULT_PHONE_COUNTRY;
                                                  return country.dialCode;
                                                }}
                                              >
                                                {PHONE_COUNTRIES.map((country) => (
                                                  <MenuItem key={country.iso2} value={country.iso2}>
                                                    {country.nameVi} ({country.dialCode})
                                                  </MenuItem>
                                                ))}
                                              </Select>
                                            </InputAdornment>
                                          }
                                        />
                                      </FormControl>
                                    </Grid>
                                  </Grid>
                                </AccordionDetails>
                              </Accordion>
                            );
                          })}
                        </Stack>
                      )}
                    </Stack>
                  );
                });
              })}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Stack direction="row" justifyContent="space-between">
        <Button variant="outlined" onClick={onBack}>
          {tt('Quay lại', 'Back')}
        </Button>
        <Button variant="contained" onClick={onNext}>
          {tt('Tiếp tục', 'Continue')}
        </Button>
      </Stack>
    </Stack>
  );
}


