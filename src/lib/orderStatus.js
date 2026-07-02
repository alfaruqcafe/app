export const ORDER_STATUS_STEPS = ["pending", "accepted", "ready", "delivering", "delivered"];
export const CUSTOMER_STATUS_STEPS = ["pending", "accepted", "delivering", "delivered"];

export const STATUS_LABELS = {
  pending: "Bestellung abgegeben",
  accepted: "Angenommen",
  ready: "Abholbereit",
  delivering: "Wird geliefert",
  delivered: "Zugestellt",
  cancelled: "Storniert",
};

export const STATUS_COLORS = {
  pending: { bg: "#ffedd5", color: "#c2410c" },       // Orange
  accepted: { bg: "#dbeafe", color: "#1d4ed8" },      // Blue
  ready: { bg: "#dcfce7", color: "#15803d" },         // Green
  delivering: { bg: "#faf5ff", color: "#6b21a8" },    // Purple
  delivered: { bg: "#f3f4f6", color: "#4b5563" },     // Gray
  cancelled: { bg: "#fee2e2", color: "#b91c1c" },     // Red
};

export function isActiveStatus(status) {
  return status !== "delivered" && status !== "cancelled";
}

