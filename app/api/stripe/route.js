import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function POST(request) {
  const sig = request.headers.get("stripe-signature");
  const body = await request.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Stripe signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const handlePayment = async (object, isPaid) => {
    const { metadata } = object;

    if (!metadata) {
      console.warn("No metadata found in session/paymentIntent");
      return;
    }

    const { orderIds, userId, appId } = metadata;

    if (appId !== "GoCart") return;

    const orderIdsArray = orderIds.split(",");

    if (isPaid) {
      // Mark orders as paid
      await Promise.all(
        orderIdsArray.map((orderId) =>
          prisma.order.update({
            where: { id: orderId },
            data: { isPaid: true },
          })
        )
      );

      // Clear user cart
      await prisma.user.update({
        where: { id: userId },
        data: { cart: {} },
      });
    } else {
      // Delete unpaid orders
      await Promise.all(
        orderIdsArray.map((orderId) =>
          prisma.order.delete({
            where: { id: orderId },
          })
        )
      );
    }
  };

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handlePayment(event.data.object, true);
        break;

      case "payment_intent.payment_failed":
        await handlePayment(event.data.object, false);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return NextResponse.json({ error: error.message || "Webhook error" }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
