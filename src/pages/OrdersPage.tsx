import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WoodhouseApprovalStatus } from "../../shared/types";
import { api } from "@/lib/api";
import { formatDate, formatMoneyPrecise } from "@/lib/format";

const statusStyles: Record<WoodhouseApprovalStatus, string> = {
  pending: "bg-amber-500/20 text-amber-100 ring-amber-500/40",
  approved: "bg-emerald-500/20 text-emerald-100 ring-emerald-500/40",
  held: "bg-rose-500/20 text-rose-100 ring-rose-500/40",
};

export function OrdersPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: api.getOrders,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: WoodhouseApprovalStatus }) =>
      api.patchOrder(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["metrics"] });
    },
  });

  if (isLoading) return <p className="text-supply-200/60">Loading orders…</p>;
  if (error || !data) {
    return <p className="text-rose-300">Could not load orders. {error?.message}</p>;
  }

  const sorted = [...data.orders].sort((a, b) => {
    const rank = (s: WoodhouseApprovalStatus) =>
      s === "pending" ? 0 : s === "held" ? 1 : 2;
    return rank(a.woodhouseApproval) - rank(b.woodhouseApproval) || b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-supply-50">Order approval</h2>
        <p className="mt-1 max-w-xl text-sm text-supply-200/60">
          Approve orders for fulfillment, or hold for review. Status syncs to Shopify order tags (
          <code className="text-supply-400">woodhouse:approved</code> /{" "}
          <code className="text-supply-400">woodhouse:held</code>) for Alfred and your team.
        </p>
      </div>

      <ul className="space-y-4">
        {sorted.map((order) => (
          <li
            key={order.id}
            className="rounded-2xl bg-ink-900/60 p-5 ring-1 ring-white/5 transition hover:ring-supply-600/20"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-lg text-supply-100">{order.name}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${statusStyles[order.woodhouseApproval]}`}
                  >
                    {order.woodhouseApproval}
                  </span>
                  <span className="text-xs text-supply-200/40">{formatDate(order.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-supply-200/70">
                  {order.customerName}
                  {order.customerEmail ? ` · ${order.customerEmail}` : ""}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-supply-200/80">
                  {order.lineItems.map((li) => (
                    <li key={li.id}>
                      {li.quantity}× {li.title} — {formatMoneyPrecise(li.price * li.quantity, order.currency)}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-supply-200/40">
                  Payment: {order.financialStatus} · Fulfillment: {order.fulfillmentStatus ?? "unfulfilled"}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row md:flex-col">
                <p className="text-right font-display text-xl text-supply-50 md:text-left">
                  {formatMoneyPrecise(order.totalPrice, order.currency)}
                </p>
                <div className="flex gap-2">
                  <ActionBtn
                    label="Approve"
                    variant="approve"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: order.id, status: "approved" })}
                  />
                  <ActionBtn
                    label="Hold"
                    variant="hold"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ id: order.id, status: "held" })}
                  />
                  {order.woodhouseApproval !== "pending" && (
                    <ActionBtn
                      label="Reset"
                      variant="neutral"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ id: order.id, status: "pending" })}
                    />
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionBtn({
  label,
  variant,
  onClick,
  disabled,
}: {
  label: string;
  variant: "approve" | "hold" | "neutral";
  onClick: () => void;
  disabled: boolean;
}) {
  const cls =
    variant === "approve"
      ? "bg-supply-600 hover:bg-supply-500 text-white"
      : variant === "hold"
        ? "bg-ink-850 hover:bg-ink-900 text-rose-200 ring-1 ring-rose-500/30"
        : "bg-ink-850 hover:bg-ink-900 text-supply-200 ring-1 ring-white/10";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${cls}`}
    >
      {label}
    </button>
  );
}
