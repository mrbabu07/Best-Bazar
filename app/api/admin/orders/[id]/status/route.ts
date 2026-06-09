import { handleApiError, ok, requireAdmin } from "@/lib/api/admin";
import { updateOrderStatus } from "@/lib/order-status";
import { orderStatusSchema } from "@/lib/validations/admin";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: { id: string };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await requireAdmin();
    const data = orderStatusSchema.parse(await request.json());
    const order = await updateOrderStatus({
      orderId: params.id,
      orderStatus: data.orderStatus,
      internalNotes: data.internalNotes
    });

    return ok(order);
  } catch (error) {
    return handleApiError(error);
  }
}
