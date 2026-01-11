import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// Add new coupon
export async function POST(request) {
    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

        const isAdmin = await authAdmin(user);
        if (!isAdmin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

        const { coupon } = await request.json();
        coupon.code = coupon.code.toUpperCase();

        await prisma.coupon.create({
            data: coupon
        }).then(async(coupon) => {
            await inngest.send({
                name: "app/coupon.expired",
                data: {
                    code: coupon.code,
                    expires_at: coupon.expiresAt
                }
            })
        })

        return NextResponse.json({ message: "Coupon created successfully" });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

// delete coupon
export async function DELETE(request) {
    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

        const isAdmin = await authAdmin(user);
        if (!isAdmin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get("code");

        if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

        await prisma.coupon.delete({ where: { code } });
        return NextResponse.json({ message: "Coupon deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

// get all coupons
export async function GET(request) {
    try {
        const user = await currentUser();
        if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

        const isAdmin = await authAdmin(user);
        if (!isAdmin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

        const coupons = await prisma.coupon.findMany({});
        return NextResponse.json({ coupons });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}