/**
 * Format currency in INR.
 */
export function formatCurrency(amount) {
  return "₹" + (amount || 0).toFixed(2);
}

/**
 * Format date to readable string.
 */
export function formatDate(date) {
  if (!date) return "N/A";
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format date with time.
 */
export function formatDateTime(date) {
  if (!date) return "N/A";
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get status badge color class.
 */
export function getStatusColor(status) {
  switch (status?.toLowerCase()) {
    case "pending": return "status-pending";
    case "processing": return "status-processing";
    case "ready": return "status-ready";
    case "delivered": return "status-delivered";
    case "cancelled": return "status-cancelled";
    default: return "status-pending";
  }
}

/**
 * Get status display text.
 */
export function getStatusText(status) {
  switch (status?.toLowerCase()) {
    case "pending": return "Pending";
    case "processing": return "Processing";
    case "ready": return "Ready";
    case "delivered": return "Delivered";
    case "cancelled": return "Cancelled";
    default: return status || "Unknown";
  }
}

/**
 * Get color type display text.
 */
export function getColorTypeText(colorType) {
  return colorType === "bw" ? "Black & White" : "Full Color";
}

/**
 * Get side type display text.
 */
export function getSideTypeText(sideType) {
  return sideType === "single" ? "Single Side" : "Double Side";
}

/**
 * Generate order ID.
 */
export function generateOrderId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `PH-${timestamp}-${random}`;
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text, maxLength = 30) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
