import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Get dashboard data for admin ( total revenue, total stores, total products, total orders)
export async function GET(request){

    try {
    // Read the full Clerk user object from the incoming request's session cookie
    const user = await currentUser();

    if (!user) {
        return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const isAdmin = await authAdmin(user);

    if (!isAdmin) {
        return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Get total orders
    const orders = await prisma.order.count()
    // Get total store on app
    const stores = await prisma.store.count()
    // Get all orders include only createdAt and total & calculated total revenue
    const allOrders = await prisma.order.findMany({
        select: {
            createdAt: true,
            total: true
        }
    })

    let totalRevenue = 0
    allOrders.forEach(order => {
        totalRevenue += order.total
    })

    const revenue = totalRevenue.toFixed(2)
    // total products on app
    const products = await prisma.product.count()
    const dashboardData = {
        orders,
        stores,
        products,
        revenue,
        allOrders
    }

    return NextResponse.json({dashboardData})

    } catch (error) {
        console.error(error);
        return NextResponse.json({error: error.code || error.message  }, { status: 400})
    }
}