import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        // Auth check
        const {userId, has} = getAuth(request)
        if (!userId) {
            return NextResponse.json({error: "Unauthorized"}, {status: 401})
        }

        // Input validation
        const body = await request.json()
        if (!body?.code || typeof body.code !== 'string') {
            return NextResponse.json({error: "Invalid coupon code"}, {status: 400})
        }

        const code = body.code.trim().toUpperCase()
        if (!code) {
            return NextResponse.json({error: "Coupon code required"}, {status: 400})
        }

        // Use UTC dates for consistent server/client comparison
        const now = new Date()
        now.setMilliseconds(0)

        const coupon = await prisma.coupon.findFirst({
            where: {
                code,
                expiresAt: { gt: now }
            }
        })

        if (!coupon) {
            return NextResponse.json({error: "Coupon not found"}, {status: 404})
        }

        // New user check
        if (coupon.forNewUser) {
            const userorders = await prisma.order.findMany({
                where: { userId },
                select: { id: true },
                take: 1
            })
            if (userorders.length > 0) {
                return NextResponse.json({error: "Coupon valid for new users only"}, {status: 400})
            }
        }

        // Member check
        if (coupon.forMember) {
            const hasPlusPlan = has({ role: 'plus' })
            if (!hasPlusPlan) {
                return NextResponse.json({error: "Coupon valid for members only"}, {status: 400})
            }
        }

        // Return stable response structure
        return NextResponse.json({
            coupon: {
                code: coupon.code,
                discount: coupon.discount,
                description: coupon.description,
                expiresAt: coupon.expiresAt.toISOString()
            }
        })

    } catch (error) {
        console.error('Coupon API error:', error);
        return NextResponse.json({
            error: error.code || "Failed to process coupon"
        }, {status: 500})
    }
}