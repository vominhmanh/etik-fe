/**
 * Helper function to calculate voucher discount amount
 * @param voucher - The voucher object with discount details
 * @param orderTickets - Array of tickets in the order with showId, ticketCategoryId, price, quantity
 * @param isTicketInScope - Function to check if a ticket is in voucher scope
 * @param validateVoucher - Function to validate voucher (returns {valid: boolean, message?: string})
 * @returns The calculated discount amount
 */
export function calculateVoucherDiscount(
  voucher: any,
  orderTickets: Array<{ showId: number; ticketCategoryId: number; price: number; quantity: number }>,
  isTicketInScope: (showId: number, ticketCategoryId: number, voucher: any) => boolean,
  validateVoucher: (voucher: any) => { valid: boolean; message?: string }
): number {
  if (!voucher) return 0;

  // Validate voucher first
  const validation = validateVoucher(voucher);
  if (!validation.valid) {
    return 0;
  }

  // Get tickets in scope
  const ticketsInScope = orderTickets
    .filter((ticket) => isTicketInScope(ticket.showId, ticket.ticketCategoryId, voucher))
    .flatMap((ticket) =>
      Array.from({ length: ticket.quantity }, () => ({
        showId: ticket.showId,
        ticketCategoryId: ticket.ticketCategoryId,
        price: ticket.price,
      }))
    )
    .sort((a, b) => a.price - b.price); // Sort by price ascending

  if (ticketsInScope.length === 0) {
    return 0;
  }

  if (voucher.applicationType === 'total_order') {
    // Calculate total amount of tickets in scope
    const scopeSubtotal = ticketsInScope.reduce((sum, t) => sum + t.price, 0);

    // Apply discount to total order (only for tickets in scope)
    let discount = 0;
    if (voucher.discountType === 'amount') {
      discount = voucher.discountValue;
    } else if (voucher.discountType === 'percentage') {
      discount = (scopeSubtotal * voucher.discountValue) / 100;
    }
    // Discount cannot exceed scope subtotal
    return Math.min(discount, scopeSubtotal);
  } else if (voucher.applicationType === 'per_ticket') {
    // Apply discount per ticket - select cheapest tickets first
    const maxTicketsToDiscount = voucher.maxTicketsToDiscount || ticketsInScope.length;
    const ticketsToDiscount = ticketsInScope.slice(0, Math.min(maxTicketsToDiscount, ticketsInScope.length));

    // Calculate total discount for selected tickets
    let totalDiscount = 0;
    for (const ticket of ticketsToDiscount) {
      let discountPerTicket = 0;
      if (voucher.discountType === 'amount') {
        discountPerTicket = Math.min(voucher.discountValue, ticket.price);
      } else if (voucher.discountType === 'percentage') {
        discountPerTicket = (ticket.price * voucher.discountValue) / 100;
      }
      totalDiscount += discountPerTicket;
    }

    return totalDiscount;
  }

  return 0;
}

