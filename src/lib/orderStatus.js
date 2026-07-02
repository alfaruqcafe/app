export const ORDER_STATUS_STEPS = ["pending", "preparing", "ready", "delivered"];

export const STATUS_LABELS = {
  pending: "Angenommen",
  preparing: "In Bearbeitung",
  ready: "Fertig / Abholbereit",
  delivered: "Geliefert",
  cancelled: "Storniert",
};

export const STATUS_COLORS = {
  pending: { bg: "#ffedd5", color: "#c2410c" },
  preparing: { bg: "#dbeafe", color: "#1d4ed8" },
  ready: { bg: "#dcfce7", color: "#15803d" },
  delivered: { bg: "#f3f4f6", color: "#4b5563" },
  cancelled: { bg: "#fee2e2", color: "#b91c1c" },
};

export function isActiveStatus(status) {
  return status !== "delivered" && status !== "cancelled";
}
