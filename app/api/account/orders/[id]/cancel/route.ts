import { OrderStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { ApiError, handleApiError, ok } from "@/lib/api/admin";
import { authOptions } from "@/lib/auth";
import { sendOrderStatusEmail } from "@/lib/email";
import { sendOrderMessagingNotifications } from "@/lib/notifications";
import { CUSTOMER_CANCELLABLE_ORDER_STATUSES, updateOrderStatus } from "@/lib/order-status";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string };
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user.id) {
      throw new ApiError("Authentication required.", 401);
    }

    const order = await updateOrderStatus({
      orderId: params.id,
      orderStatus: OrderStatus.CANCELLED,
      userId: session.user.id,
      allowedCurrentStatuses: CUSTOMER_CANCELLABLE_ORDER_STATUSES,
      internalNotes: "Customer cancelled this order from their account."
    });
    await Promise.allSettled([
      sendOrderStatusEmail(order),
      sendOrderMessagingNotifications(order, "status")
    ]);

    return ok(order);
  } catch (error) {
    return handleApiError(error);
  }
}
