import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Toggle store isActive
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

        const { storeId } = await request.json();

        if (!storeId) {
            return NextResponse.json({ error: "missing storeId" }, { status: 400 });
        }

        // Find the store
        const store = await prisma.store.findUnique({
            where: { id: storeId },
        });

        if (!store) {
            return NextResponse.json({ error: "store not found" }, { status: 400 });
        }

        await prisma.store.update({
            where: { id: storeId },
            data: { isActive: !store.isActive },
        });

        return NextResponse.json({ message: "store updated successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 });
    }
}