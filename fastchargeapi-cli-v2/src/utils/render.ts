import { Decimal } from "decimal.js";

export function renderMoney(amount: string | number | Decimal) {
  return Number(amount).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}
