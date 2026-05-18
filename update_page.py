import re

with open("src/app/(features)/event-studio/(event-detail)/events/[event_id]/redeem-add-on/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Title and Headers
content = content.replace("Check-in sự kiện", "Sử dụng Tiện ích (Redeem Add-ons)")
content = content.replace("Check-in with QR Code", "Redeem Add-ons")
content = content.replace("Mã check-in", "Mã vé (Ticket Code)")
content = content.replace("Check-in thủ công", "Nhập mã vé thủ công")
content = content.replace("Lịch sử check-in gần nhất", "Lịch sử sử dụng tiện ích gần nhất (TODO)")
content = content.replace("Đang tải lịch sử check-in...", "Đang tải...")

# 2. Add Interfaces
interfaces = '''
export interface AddOnTemplate {
  id: number;
  name: string;
}

export interface TicketAddOn {
  id: number;
  isRedeemed: boolean;
  redeemedAt: string | null;
  redeemedById: number | null;
  note: string | null;
  addOn: AddOnTemplate;
  redeemedBy: {
    id: number;
    fullName: string;
    email: string;
  } | null;
}
'''
if "export interface AddOnTemplate" not in content:
    content = content.replace("export interface Ticket {", interfaces + "\nexport interface Ticket {")
    content = content.replace("audienceCode: string | null;", "audienceCode: string | null;\n  addOns?: TicketAddOn[];")

# 3. Add State
states = '''
  const [eventAddOns, setEventAddOns] = React.useState<AddOnTemplate[]>([]);
  const [selectedAddOnIds, setSelectedAddOnIds] = React.useState<number[]>([]);
  const [redeemLoading, setRedeemLoading] = React.useState<Record<number, boolean>>({});
'''
if "const [eventAddOns" not in content:
    content = content.replace("const [event, setEvent] = React.useState<EventResponse | null>(null);", "const [event, setEvent] = React.useState<EventResponse | null>(null);\n" + states)

# 4. Add API Fetch & Handlers
handlers = '''
  React.useEffect(() => {
    if (params.event_id) {
      baseHttpServiceInstance.get(`/event-studio/events/${params.event_id}/add-ons`)
        .then(res => {
          setEventAddOns(res.data);
          setSelectedAddOnIds(res.data.map((a: any) => a.id));
        })
        .catch(err => console.error(err));
    }
  }, [params.event_id]);

  const handleAddOnToggle = (id: number) => {
    setSelectedAddOnIds(prev => 
      prev.includes(id) ? prev.filter(aId => aId !== id) : [...prev, id]
    );
  };

  const handleRedeem = async (ticketAddOnId: number) => {
    try {
      setRedeemLoading(prev => ({ ...prev, [ticketAddOnId]: true }));
      await baseHttpServiceInstance.post(`/event-studio/events/${params.event_id}/ticket-add-ons/${ticketAddOnId}/redeem`);
      notificationCtx.success(tt('Sử dụng tiện ích thành công!', 'Add-on redeemed successfully!'));
      if (eCode) {
        getTransactionByECode(eCode, false);
      }
    } catch (err) {
      notificationCtx.error(err);
    } finally {
      setRedeemLoading(prev => ({ ...prev, [ticketAddOnId]: false }));
    }
  };
'''
if "handleAddOnToggle" not in content:
    content = content.replace("const handleCategorySelection = (categoryIds: number[]) => {\n    setSelectedCategories(categoryIds);\n  };", handlers)

# 5. UI filter section
ui_filter = '''
              <Card>
                <CardHeader title={tt('Chọn Tiện ích', 'Select Add-ons')} />
                <Divider />
                <List>
                  {eventAddOns.map(addon => (
                    <ListItem key={addon.id}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedAddOnIds.includes(addon.id)}
                            onChange={() => handleAddOnToggle(addon.id)}
                          />
                        }
                        label={addon.name}
                      />
                    </ListItem>
                  ))}
                  {eventAddOns.length === 0 && (
                     <ListItem>
                       <ListItemText primary={tt('Không có tiện ích nào.', 'No add-ons available.')} />
                     </ListItem>
                  )}
                </List>
              </Card>
'''
import re
content = re.sub(r'<Schedules shows=\{event\?\.shows\}.*?</Stack>', ui_filter + '\n            </Stack>', content, flags=re.DOTALL)
content = content.replace("sx={{ display: selectedSchedule && selectedCategories.length > 0 ? 'block' : 'none' }}", "sx={{ display: selectedAddOnIds.length > 0 ? 'block' : 'none' }}")

# 6. Ticket rendering section
addon_render = '''
                                      <Stack direction="column" spacing={1} sx={{ mt: 1.5 }}>
                                        {ticket.addOns?.map(addOnItem => {
                                          const isSelected = selectedAddOnIds.includes(addOnItem.addOn.id);
                                          const isRedeemed = addOnItem.isRedeemed;
                                          
                                          if (!isSelected) {
                                            return null; // hide completely if not selected according to requirement
                                          }
                                          
                                          return (
                                            <Stack key={addOnItem.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ borderBottom: '1px dashed #eee', pb: 1 }}>
                                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{addOnItem.addOn.name}</Typography>
                                              
                                              {isRedeemed ? (
                                                <Stack alignItems="flex-end">
                                                  <Chip size="small" color="success" label={tt('Đã sử dụng', 'Redeemed')} />
                                                  {addOnItem.redeemedAt && (
                                                    <Typography variant="caption" color="text.secondary">
                                                      {dayjs(addOnItem.redeemedAt).format('HH:mm DD/MM')}
                                                    </Typography>
                                                  )}
                                                </Stack>
                                              ) : (
                                                <Button 
                                                  variant="contained" 
                                                  color="primary"
                                                  size="small" 
                                                  disabled={redeemLoading[addOnItem.id]}
                                                  onClick={() => handleRedeem(addOnItem.id)}
                                                >
                                                  {tt('Sử dụng', 'Redeem')}
                                                </Button>
                                              )}
                                            </Stack>
                                          );
                                        })}
                                        {(!ticket.addOns || ticket.addOns.length === 0) && (
                                          <Typography variant="body2" color="text.secondary">
                                            {tt('Không có tiện ích', 'No add-ons')}
                                          </Typography>
                                        )}
                                      </Stack>
'''
content = re.sub(r'\{ticket\.status !== \'normal\' \?.*?isCheckedIn \?.*?\{tt\(\'Đã check-out\', \'Checked-out\'\)\}\s*</Typography>\s*\)\s*\)\s*\}', addon_render, content, flags=re.DOTALL)
content = re.sub(r'<Checkbox[^>]*?checked=\{ticketCheckboxState[^>]*?/>', '', content)
content = re.sub(r'<Button[^>]*?onClick=\{.*?sendCheckinRequest.*?>.*?</Button>', '', content, flags=re.DOTALL)

with open("src/app/(features)/event-studio/(event-detail)/events/[event_id]/redeem-add-on/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
