import axios from "axios";
import { NextResponse } from "next/server";

import prismadb from "@/lib/prismadb";

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
  const {
    productIds,
    totalPrice,
    customerName,
    customerEmail,
    customerPhoneNumber,
    customerAddress,
  } = await req.json();

  if (!productIds || productIds.length === 0) {
    return new NextResponse("Product ids are required", { status: 400 });
  }

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

  await prismadb.order.create({
    data: {
      storeId: params.storeId,
      isPaid: false,
      phone: customerPhoneNumber,
      address: customerAddress,
      email: customerEmail,
      name: customerName,
      trxRef: response.data.data.reference as string,
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

  return NextResponse.json(
    { url: response.data.data.authorization_url },
    {
      headers: corsHeaders,
    },
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const reference = searchParams.get("trxref");

  const response = await axios.get(
    `https://api.paystack.co/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `BEARER ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  return NextResponse.json(
    { status: response.data.status },
    {
      headers: corsHeaders,
    },
  );
}
