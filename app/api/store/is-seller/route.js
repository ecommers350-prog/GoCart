import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller"; // ✅ works now
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    console.log("🧭 Clerk userId:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isSeller = await authSeller(userId);
    console.log("✅ isSeller:", isSeller);

    if (!isSeller) {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }

    const storeInfo = await prisma.store.findUnique({ where: { userId } });

    return NextResponse.json({ isSeller, storeInfo });
  } catch (error) {
    console.error("❌ Error in /api/store/is-seller:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
