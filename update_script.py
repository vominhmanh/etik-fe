import re

with open(r'src\app\(features)\event-studio\(event-detail)\events\[event_id]\vouchers\[campaign_id]\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports if needed
if "import { SelectChangeEvent" not in content:
    content = content.replace("import { Select, MenuItem }", "import { Select, MenuItem, SelectChangeEvent }")
if "import { Radio, RadioGroup" not in content:
    content = content.replace("import {", "import { Radio, RadioGroup,\n", 1)

# 2. Add states and handlers
state_code = """
  const [formData, setFormData] = useState<any>({
    name: '',
    content: '',
    imageUrl: '',
    validFrom: '',
    validUntil: '',
    minTicketsRequired: null,
    minTicketsRequiredUnlimited: true,
    maxTicketsAllowed: null,
    maxTicketsAllowedUnlimited: true,
    requireLogin: false,
    maxUsesPerUser: null,
    maxUsesPerUserUnlimited: true,
    applyToAll: true,
    selectedTicketCategories: [] as number[],
  });
  const [allTicketCategories, setAllTicketCategories] = useState<any[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!formData.name) {
        notificationCtx.warning(tt('Vui lòng nhập tên chương trình', 'Please enter campaign name'));
        return;
      }
      if (!formData.validFrom || !formData.validUntil) {
        notificationCtx.warning(tt('Vui lòng chọn thời gian sử dụng', 'Please select usage time'));
        return;
      }
      if (!formData.applyToAll && formData.selectedTicketCategories.length === 0) {
        notificationCtx.warning(tt('Vui lòng chọn ít nhất một loại vé', 'Please select at least one ticket category'));
        return;
      }

      setIsLoading(true);
      const updateData = {
        name: formData.name,
        content: formData.content,
        imageUrl: formData.imageUrl,
        validFrom: formData.validFrom,
        validUntil: formData.validUntil,
        requireLogin: formData.requireLogin,
        minTicketsRequired: formData.minTicketsRequiredUnlimited ? null : (formData.minTicketsRequired ? Number(formData.minTicketsRequired) : null),
        maxTicketsAllowed: formData.maxTicketsAllowedUnlimited ? null : (formData.maxTicketsAllowed ? Number(formData.maxTicketsAllowed) : null),
        maxUsesPerUser: formData.maxUsesPerUserUnlimited ? null : (formData.maxUsesPerUser ? Number(formData.maxUsesPerUser) : null),
        applyToAll: formData.applyToAll,
        ticketCategories: formData.applyToAll ? [] : formData.selectedTicketCategories.map((id: number) => ({ ticketCategoryId: id })),
      };

      await baseHttpServiceInstance.put(
        `/event-studio/events/${params.event_id}/voucher-campaigns/${params.campaign_id}`,
        updateData
      );
      
      setCampaign(prev => prev ? { ...prev, ...updateData } as any : null);
      notificationCtx.success(tt('Cập nhật chiến dịch thành công', 'Campaign updated successfully'));
    } catch (error: any) {
      notificationCtx.error(tt('Lỗi khi cập nhật:', 'Error updating:') + ` ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
"""
content = re.sub(r'(const \[eventSlug, setEventSlug\] = useState<string>\(\'\'\);)', r'\1\n' + state_code, content)

# 3. Update fetchCampaign
fetch_campaign_old = r"""        setCampaign\(response\.data\);"""
fetch_campaign_new = r"""        setCampaign(response.data);
        setFormData({
          name: response.data.name || '',
          content: response.data.content || '',
          imageUrl: response.data.imageUrl || '',
          validFrom: response.data.validFrom || '',
          validUntil: response.data.validUntil || '',
          minTicketsRequired: response.data.minTicketsRequired,
          minTicketsRequiredUnlimited: response.data.minTicketsRequired === null,
          maxTicketsAllowed: response.data.maxTicketsAllowed,
          maxTicketsAllowedUnlimited: response.data.maxTicketsAllowed === null,
          requireLogin: response.data.requireLogin || false,
          maxUsesPerUser: response.data.maxUsesPerUser,
          maxUsesPerUserUnlimited: response.data.maxUsesPerUser === null,
          applyToAll: response.data.applyToAll,
          selectedTicketCategories: response.data.ticketCategories?.map((tc: any) => tc.ticketCategoryId) || [],
        });"""
content = re.sub(fetch_campaign_old, fetch_campaign_new, content)

# 4. Add fetchTicketCategories
fetch_tickets_code = """    const fetchTicketCategories = async () => {
      try {
        const response = await baseHttpServiceInstance.get(
          `/event-studio/events/${params.event_id}/ticket-categories`
        );
        setAllTicketCategories(response.data || []);
      } catch (error) {
        console.error('Error fetching ticket categories', error);
      }
    };
    fetchTicketCategories();
"""
content = re.sub(r'(fetchCampaign\(\);\n\s*fetchVouchers\(\);\n\s*fetchEventSlug\(\);)', fetch_tickets_code + r'\1', content)

# 5. UI Changes - Info
content = content.replace(
    "<OutlinedInput label={tt('Tên chương trình khuyến mãi', 'Campaign Name')} value={campaign.name} disabled />",
    """<OutlinedInput label={tt('Tên chương trình khuyến mãi', 'Campaign Name')} name="name" value={formData.name} onChange={handleChange} />"""
)
content = content.replace(
    """<TextField
                      label={tt('Nội dung', 'Content')}
                      value={campaign.content || ''}
                      disabled
                      multiline
                      rows={4}
                      fullWidth
                    />""",
    """<TextField
                      label={tt('Nội dung', 'Content')}
                      name="content"
                      value={formData.content || ''}
                      onChange={handleChange}
                      multiline
                      rows={4}
                      fullWidth
                    />"""
)

# UI Changes - Usage Time
content = content.replace(
    """<TextField
                      label={tt('Từ ngày', 'From Date')}
                      value={dayjs(campaign.validFrom).format('YYYY-MM-DDTHH:mm')}
                      disabled
                      type="datetime-local"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />""",
    """<TextField
                      label={tt('Từ ngày', 'From Date')}
                      name="validFrom"
                      value={formData.validFrom ? dayjs(formData.validFrom).format('YYYY-MM-DDTHH:mm') : ''}
                      onChange={handleChange}
                      type="datetime-local"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />"""
)
content = content.replace(
    """<TextField
                      label={tt('Đến ngày', 'To Date')}
                      value={dayjs(campaign.validUntil).format('YYYY-MM-DDTHH:mm')}
                      disabled
                      type="datetime-local"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />""",
    """<TextField
                      label={tt('Đến ngày', 'To Date')}
                      name="validUntil"
                      value={formData.validUntil ? dayjs(formData.validUntil).format('YYYY-MM-DDTHH:mm') : ''}
                      onChange={handleChange}
                      type="datetime-local"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />"""
)

# UI Changes - Application Conditions (Min tickets)
min_tickets_old = """<FormControl fullWidth>
                          <OutlinedInput
                            value={campaign.minTicketsRequired ? campaign.minTicketsRequired : tt('Không giới hạn', 'Unlimited')}
                            disabled
                          />
                          <FormHelperText>"""
min_tickets_new = """<FormControl component="fieldset">
                          <RadioGroup
                            name="minTicketsRequiredUnlimited"
                            value={formData.minTicketsRequiredUnlimited ? 'true' : 'false'}
                            onChange={(e) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                minTicketsRequiredUnlimited: e.target.value === 'true',
                              }))
                            }
                            row
                          >
                            <FormControlLabel value="true" control={<Radio />} label={tt('Không giới hạn', 'Unlimited')} />
                            <FormControlLabel value="false" control={<Radio />} label={tt('Giới hạn', 'Limited')} />
                          </RadioGroup>
                          <FormHelperText>"""
content = content.replace(min_tickets_old, min_tickets_new)
content = content.replace(
    """{tt('Số lượng vé tối thiểu trong đơn hàng để có thể áp dụng voucher', 'Minimum number of tickets in order to apply voucher')}
                          </FormHelperText>
                        </FormControl>""",
    """{tt('Số lượng vé tối thiểu trong đơn hàng để có thể áp dụng voucher', 'Minimum number of tickets in order to apply voucher')}
                          </FormHelperText>
                        </FormControl>
                        {!formData.minTicketsRequiredUnlimited && (
                          <FormControl fullWidth sx={{ mt: 2 }}>
                            <OutlinedInput
                              name="minTicketsRequired"
                              type="number"
                              value={formData.minTicketsRequired || ''}
                              onChange={handleChange}
                              placeholder={tt('Nhập số lượng', 'Enter quantity')}
                            />
                          </FormControl>
                        )}"""
)

# UI Changes - Max tickets
max_tickets_old = """<FormControl fullWidth>
                          <OutlinedInput
                            value={campaign.maxTicketsAllowed ? campaign.maxTicketsAllowed : tt('Không giới hạn', 'Unlimited')}
                            disabled
                          />
                          <FormHelperText>"""
max_tickets_new = """<FormControl component="fieldset">
                          <RadioGroup
                            name="maxTicketsAllowedUnlimited"
                            value={formData.maxTicketsAllowedUnlimited ? 'true' : 'false'}
                            onChange={(e) =>
                              setFormData((prev: any) => ({
                                ...prev,
                                maxTicketsAllowedUnlimited: e.target.value === 'true',
                              }))
                            }
                            row
                          >
                            <FormControlLabel value="true" control={<Radio />} label={tt('Không giới hạn', 'Unlimited')} />
                            <FormControlLabel value="false" control={<Radio />} label={tt('Giới hạn', 'Limited')} />
                          </RadioGroup>
                          <FormHelperText>"""
content = content.replace(max_tickets_old, max_tickets_new)
content = content.replace(
    """{tt('Số lượng vé tối đa trong đơn hàng để có thể áp dụng voucher', 'Maximum number of tickets in order to apply voucher')}
                          </FormHelperText>
                        </FormControl>""",
    """{tt('Số lượng vé tối đa trong đơn hàng để có thể áp dụng voucher', 'Maximum number of tickets in order to apply voucher')}
                          </FormHelperText>
                        </FormControl>
                        {!formData.maxTicketsAllowedUnlimited && (
                          <FormControl fullWidth sx={{ mt: 2 }}>
                            <OutlinedInput
                              name="maxTicketsAllowed"
                              type="number"
                              value={formData.maxTicketsAllowed || ''}
                              onChange={handleChange}
                              placeholder={tt('Nhập số lượng', 'Enter quantity')}
                            />
                          </FormControl>
                        )}"""
)


# UI Changes - Require Login
req_login_old = """<FormControl fullWidth>
                    <InputLabel>{tt('Bắt buộc đăng nhập', 'Require Login')}</InputLabel>
                    <OutlinedInput
                      label={tt('Bắt buộc đăng nhập', 'Require Login')}
                      value={campaign.requireLogin ? tt('Có', 'Yes') : tt('Không', 'No')}
                      disabled
                    />
                    <FormHelperText>"""
req_login_new = """<FormControl fullWidth>
                    <InputLabel>{tt('Bắt buộc đăng nhập', 'Require Login')}</InputLabel>
                    <Select
                      name="requireLogin"
                      value={formData.requireLogin}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          requireLogin: e.target.value === true || e.target.value === 'true',
                        }))
                      }
                      label={tt('Bắt buộc đăng nhập', 'Require Login')}
                    >
                      <MenuItem value={"true"}>{tt('Có', 'Yes')}</MenuItem>
                      <MenuItem value={"false"}>{tt('Không', 'No')}</MenuItem>
                    </Select>
                    <FormHelperText>"""
content = content.replace(req_login_old, req_login_new)


# UI Changes - Max uses per user
max_uses_old = """<FormControl fullWidth>
                      <OutlinedInput
                        value={campaign.maxUsesPerUser ? campaign.maxUsesPerUser : tt('Không giới hạn', 'Unlimited')}
                        disabled
                      />
                      <FormHelperText>"""
max_uses_new = """<FormControl component="fieldset">
                      <RadioGroup
                        name="maxUsesPerUserUnlimited"
                        value={formData.maxUsesPerUserUnlimited ? 'true' : 'false'}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            maxUsesPerUserUnlimited: e.target.value === 'true',
                          }))
                        }
                        row
                      >
                        <FormControlLabel value="true" control={<Radio />} label={tt('Không giới hạn', 'Unlimited')} />
                        <FormControlLabel value="false" control={<Radio />} label={tt('Giới hạn', 'Limited')} />
                      </RadioGroup>
                      <FormHelperText>"""
content = content.replace(max_uses_old, max_uses_new)
content = content.replace(
    """{tt('Số lần tối đa một khách hàng (theo email/tài khoản) có thể sử dụng voucher này', 'Maximum number of times a customer (by email/account) can use this voucher')}
                      </FormHelperText>
                    </FormControl>""",
    """{tt('Số lần tối đa một khách hàng (theo email/tài khoản) có thể sử dụng voucher này', 'Maximum number of times a customer (by email/account) can use this voucher')}
                      </FormHelperText>
                    </FormControl>
                    {!formData.maxUsesPerUserUnlimited && (
                      <FormControl fullWidth sx={{ mt: 2 }}>
                        <OutlinedInput
                          name="maxUsesPerUser"
                          type="number"
                          value={formData.maxUsesPerUser || ''}
                          onChange={handleChange}
                          placeholder={tt('Nhập số lần', 'Enter number of uses')}
                        />
                      </FormControl>
                    )}"""
)


# UI Changes - Scope
scope_old_regex = r"""<FormControl fullWidth>
\s*<InputLabel>\{tt\('Phạm vi áp dụng', 'Application Scope'\)\}</InputLabel>
\s*<OutlinedInput
\s*label=\{tt\('Phạm vi áp dụng', 'Application Scope'\)\}
\s*value=\{
\s*campaign\.applyToAll
\s*\? tt\('Toàn bộ suất diễn và toàn bộ hạng vé', 'All Shows and All Ticket Categories'\)
\s*: tt\('Chọn danh sách ticket category', 'Select Ticket Categories'\)
\s*\}
\s*disabled
\s*/>
\s*<FormHelperText>
\s*\{campaign\.applyToAll
\s*\? tt\('Voucher có thể áp dụng cho tất cả các loại vé trong sự kiện', 'Voucher can be applied to all ticket types in the event'\)
\s*: tt\('Voucher chỉ áp dụng cho các loại vé được chọn bên dưới', 'Voucher only applies to selected ticket categories below'\)\}
\s*</FormHelperText>
\s*</FormControl>
\s*\{\!campaign\.applyToAll && campaign\.ticketCategories && campaign\.ticketCategories\.length > 0 && \(
\s*<Stack spacing=\{2\}>
\s*<Typography variant="body2" sx=\{\{ fontWeight: 600 \}\}>
\s*\{tt\('Danh sách ticket category được áp dụng:', 'Selected Ticket Categories:'\)\}
\s*</Typography>
\s*<Stack direction="row" spacing=\{1\} flexWrap="wrap" useFlexGap>
\s*\{campaign\.ticketCategories\.map\(\(tc\) => \(
\s*<Chip
\s*key=\{tc\.id\}
\s*label=\{
\s*tc\.ticketCategory && tc\.ticketCategory\.show
\s*\? `\$\{tc\.ticketCategory\.show\.name\} - \$\{tc\.ticketCategory\.name\}`
\s*: tc\.ticketCategory
\s*\? tc\.ticketCategory\.name
\s*: `Ticket Category ID: \$\{tc\.ticketCategoryId\}`
\s*\}
\s*variant="outlined"
\s*/>
\s*\)\)\}
\s*</Stack>
\s*</Stack>
\s*\)\}
\s*\{\!campaign\.applyToAll && \(\!campaign\.ticketCategories \|\| campaign\.ticketCategories\.length === 0\) && \(
\s*<Typography variant="body2" color="text\.secondary">
\s*\{tt\('Chưa có ticket category nào được chọn', 'No ticket categories selected'\)\}
\s*</Typography>
\s*\)\}"""

scope_new = """<FormControl component="fieldset">
                    <RadioGroup
                      name="applyToAll"
                      value={formData.applyToAll}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          applyToAll: e.target.value === 'true',
                        }))
                      }
                      row
                    >
                      <FormControlLabel
                        value="true"
                        control={<Radio />}
                        label={tt('Toàn bộ suất diễn và toàn bộ hạng vé', 'All Shows and All Ticket Categories')}
                      />
                      <FormControlLabel
                        value="false"
                        control={<Radio />}
                        label={tt('Chọn danh sách ticket category', 'Select Ticket Categories')}
                      />
                    </RadioGroup>
                    <FormHelperText>
                      {formData.applyToAll
                        ? tt('Voucher có thể áp dụng cho tất cả các loại vé trong sự kiện', 'Voucher can be applied to all ticket types in the event')
                        : tt('Voucher chỉ áp dụng cho các loại vé được chọn bên dưới', 'Voucher only applies to selected ticket categories below')}
                    </FormHelperText>
                  </FormControl>
                  {!formData.applyToAll && (
                    <FormControl fullWidth>
                      <InputLabel>{tt('Chọn loại vé', 'Select Ticket Categories')}</InputLabel>
                      <Select
                        multiple
                        value={formData.selectedTicketCategories}
                        onChange={(e) =>
                          setFormData((prev: any) => ({
                            ...prev,
                            selectedTicketCategories: e.target.value as number[],
                          }))
                        }
                        renderValue={(selected) =>
                          (selected as number[])
                            .map(
                              (id) =>
                                allTicketCategories.find((tc) => tc.id === id)?.name || `ID: ${id}`
                            )
                            .join(', ')
                        }
                      >
                        {allTicketCategories.map((tc) => (
                          <MenuItem key={tc.id} value={tc.id}>
                            {tc.showName} - {tc.name}
                          </MenuItem>
                        ))}
                      </Select>
                      <FormHelperText>
                        {tt('Chọn ít nhất một loại vé. Voucher chỉ áp dụng cho các loại vé đã chọn.', 'Select at least one ticket category. Voucher only applies to selected categories.')}
                      </FormHelperText>
                    </FormControl>
                  )}"""

content = re.sub(scope_old_regex, scope_new, content)

# 6. Add Save Button
save_button = """<Card>
              <CardContent>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button variant="contained" onClick={handleSave} disabled={isLoading}>
                    {tt('Lưu thay đổi', 'Save Changes')}
                  </Button>
                </Stack>
              </CardContent>
            </Card>"""
content = content.replace("          </Stack>\\n        </Grid>\\n      </Grid>\\n    </Stack>", "            " + save_button + "\\n          </Stack>\\n        </Grid>\\n      </Grid>\\n    </Stack>")

with open(r'src\app\(features)\event-studio\(event-detail)\events\[event_id]\vouchers\[campaign_id]\page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
