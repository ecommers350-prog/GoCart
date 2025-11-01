import { NextResponse } from "next/server"; 
import authAdmin from "@/middlewares/authAdmin";
import { currentUser } from "@clerk/nextjs/server"; 

// Auth Admin endpoint
export async function GET(request) {
    try {
        
        const user = await currentUser();

        
        if (!user) {
            
            return NextResponse.json({ isAdmin: false, error: "Authentication required" }, { status: 401 });
        }

    
    const isAdmin = await authAdmin(user);
        
        
        if (!isAdmin) {
            return NextResponse.json({ isAdmin: false, error: "Not authorized" }, { status: 403 });
        }

           return NextResponse.json({ isAdmin: true }, { status: 200 });

    } catch (error) {
        console.error("API Error in Admin Check:", error);
        
        return NextResponse.json({ isAdmin: false, error: "Internal Server Error" }, { status: 500 });
    }
}