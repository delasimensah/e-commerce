import { headers } from "next/headers";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

export async function POST(req: Request) {
  const event = await req.json();
  const signature = headers().get("x-paystack-signature") as string;

  if (!signature) {
    return new NextResponse("No Signature", { status: 400 });
  }

  if (event.event === "charge.success") {
    await prismadb.order.update({
      where: {
        trxRef: event.data.reference,
      },
      data: {
        isPaid: true,
      },
      include: {
        orderItems: true,
      },
    });

    //   const productIds = order.orderItems.map((orderItem) => orderItem.productId);
    //   await prismadb.product.updateMany({
    //     where: {
    //       id: {
    //         in: [...productIds],
    //       },
    //     },
    //     data: {
    //       isArchived: true,
    //     },
    //   });
  }

  return new NextResponse(null, { status: 200 });
}
