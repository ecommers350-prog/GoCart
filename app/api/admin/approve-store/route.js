import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// Approve seller
export async function POST(request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const isAdmin = await authAdmin(user);
        if (!isAdmin) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const { storeId, status } = await request.json();

        if (status === "approved") {
            await prisma.store.update({
                where: { id: storeId },
                data: { status: "approved", isActive: true },
            });
        } else if (status === "rejected") {
            await prisma.store.update({
                where: { id: storeId },
                data: { status: "rejected" },
            });
        }

        return NextResponse.json({ message: status + " successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}

// get all pending and rejected stores
export async function GET(request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const isAdmin = await authAdmin(user);
        if (!isAdmin) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const stores = await prisma.store.findMany({
            where: { status: { in: ["pending", "rejected"] } },
            include: { user: true },
        });

        return NextResponse.json({ stores });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}