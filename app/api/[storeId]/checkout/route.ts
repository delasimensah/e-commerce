// import dotenv from "dotenv";
import axios from "axios";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

// dotenv.config({ path: `.env` });

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

type Params = {
  params: {
    storeId: string;
  };
};

export async function POST(req: Request, { params }: Params) {
  const { productIds, totalPrice, customerEmail } = await req.json();

  if (!productIds || productIds.length === 0) {
    return new NextResponse("Product ids are required", { status: 400 });
  }

  await prismadb.order.create({
    data: {
      storeId: params.storeId,
      isPaid: false,
      orderItems: {
        create: productIds.map((productId: string) => ({
          product: {
            connect: {
              id: productId,
            },
          },
        })),
      },
    },
  });

  const response = await axios.post(
    "https://api.paystack.co/transaction/initialize",
    {
      email: customerEmail,
      amount: totalPrice,
    },
    {
      headers: {
        Authorization: `BEARER ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  return NextResponse.json(
    { url: response.data.data.authorization_url },
    {
      headers: corsHeaders,
    },
  );
}
