// ...existing code...
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import { NextResponse } from "next/server";
import Stripe from "stripe";


export async function POST(request) {
    try {
        // pass the incoming request into getAuth so Clerk can access headers
        const { userId, has } = getAuth(request)
        if (!userId) {
            return NextResponse.json({error: "not authorized"}, {status: 401})
        }
        const { addressId, items, couponCode, paymentMethod } = await request.json()

        // check if all required fields are present
        if (!addressId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "missing order details."}, {status: 400})
        }

        let coupon = null;

        if (couponCode) {
            coupon = await prisma.coupon.findUnique({
                where: {code: couponCode }
            })
            if (!coupon) {
                return NextResponse.json({error: "Coupon not found"}, {status: 400})
            }
        }

        // Check if coupon is applicable for new users
        if (couponCode && coupon.forNewUser) {
            const userorders = await prisma.order.findMany({where: {userId}})
            if (userorders.length > 0) {
                return NextResponse.json({error: "Coupon valid for new users"}, {status: 400})
            }
        }

        const isPlusMember = has({ role: 'plus' })

        // Check if coupon is applicable for members
        if (couponCode && coupon.forMember) {  
            if (!isPlusMember) {
                return NextResponse.json({error: "Coupon valid for plus members only"}, {status: 400})
            }
        }

        // Group order by storeId using a Map
        const ordersByStore = new Map()

        for (const item of items) {
            const product  =  await prisma.product.findUnique({where: {id: item.id}})
            if (!product) {
                return NextResponse.json({ error: `Product not found: ${item.id}` }, { status: 400 })
            }
            const storeId = product.storeId
            const itemWithPrice = { ...item, price: product.price }

            if (!ordersByStore.has(storeId)) {
                ordersByStore.set(storeId, [itemWithPrice])
            } else {
                ordersByStore.get(storeId).push(itemWithPrice)
            }
        }

        let orderIds = [];
        let fullAmount = 0;

        let isShippingFeeAdded = false;
        
        // Create order for each store
        for (const [storeId, sellerItems] of ordersByStore.entries()) {
            let total = sellerItems.reduce((acc, item)=>acc + (item.price * item.quantity), 0)

            if (couponCode) {
                total -= (total * coupon.discount) / 100
            }
            if (!isPlusMember && !isShippingFeeAdded) {
                total += 40;
                isShippingFeeAdded = true;
            }

            fullAmount += parseFloat(total.toFixed(2))

            const order = await prisma.order.create({
                data: {
                    userId,
                    storeId,
                    addressId,
                    total: parseFloat(total.toFixed(2)),
                    paymentMethod,
                    isCouponUsed: coupon ? true : false,
                    coupon: coupon ? coupon : {},
                    orderItems: {
                        create: sellerItems.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            })
            orderIds.push(order.id)
        }

        if (paymentMethod === 'STRIPE') {
            const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
            const origin = await request.headers.get('origin')

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: `Order`,
                        },
                        unit_amount: fullAmount * 100,
                    },
                    quantity: 1,
                }],
                expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
                mode: 'payment',
                success_url: `${origin}/loading?nextUrl=/orders`,
                cancel_url: `${origin}/cart`,
                metadata: {
                    orderIds: orderIds.join(','),
                    userId,
                    appId: 'GoCart'
                }
            })
            return NextResponse.json({ message: "Stripe session created", session, orderIds, fullAmount })
        }

        // clear the cart 
        await prisma.user.update({
            where: {id: userId},
            data: {cart: {}}
        })

        return NextResponse.json({message: "Order placed successfully", orderIds, fullAmount})

    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message }, {status: 400})
    }
}

// Get all orders for a user
export async function GET(request) {
    try {
        // pass the incoming request into getAuth so Clerk can access headers
        const { userId } = getAuth(request)
        if (!userId) {
            return NextResponse.json({error: "not authorized"}, {status: 401})
        }

        const orders = await prisma.order.findMany({
            where: {userId, OR: [
                {paymentMethod: PaymentMethod.COD},
                {AND: [{paymentMethod: PaymentMethod.STRIPE}, {isPaid: true }]}
            ]},
            include: {
                orderItems: {include: {product: true}},
                address: true
            },
            orderBy: {createdAt: 'desc'}
        })

        return NextResponse.json({orders})
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message }, {status: 400})
    }
}
// ...existing code...