import imagekit from "@/configs/imageKit";
import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// add a new product
export async function POST(request) {
    try {
        const { userId } = getAuth(request); // <-- pass request here
        const storeId = await authSeller(userId);

        if (!storeId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        // Get the data from the form
        const formData = await request.formData();
        const name = formData.get("name");
        const description = formData.get("description");
        const mrp = Number(formData.get("mrp"));
        const price = Number(formData.get("price"));
        const category = formData.get("category"); // fixed typo
        const images = formData.getAll("images");

        if (!name || !description || !mrp || !price || !category || images.length < 1) {
            return NextResponse.json({ error: "missing product details" }, { status: 400 });
        }

        // Upload images to ImageKit
        const imagesUrl = await Promise.all(
            images.map(async (image) => {
                const buffer = Buffer.from(await image.arrayBuffer());
                const response = await imagekit.upload({
                    file: buffer,
                    fileName: image.name,
                    folder: "products",
                });
                return imagekit.url({
                    path: response.filePath,
                    transformation: [
                        { quality: "auto" },
                        { format: "webp" },
                        { width: "1024" },
                    ],
                });
            })
        );

        await prisma.product.create({
            data: {
                name,
                description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId,
            },
        });

        return NextResponse.json({ message: "Product added successfully" });
    } catch (error) {
        console.error("Add product error:", error);
        return NextResponse.json(
            { error: error.code || error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

// Get all products of a store
export async function GET(request) {
    try {
        const { userId } = getAuth(request); // <-- pass request
        const storeId = await authSeller(userId);

        if (!storeId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 });
        }

        const products = await prisma.product.findMany({
            where: { storeId },
        });

        return NextResponse.json({ products });
    } catch (error) {
        console.error("Get products error:", error);
        return NextResponse.json(
            { error: error.code || error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

// Delete a product
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if (!storeId) {
            return NextResponse.json({ error: "not authorized" }, { status: 401 })
        }

        const { productId } = await request.json()

        if (!productId) {
            return NextResponse.json(
                { error: "productId is required" },
                { status: 400 }
            )
        }

        // Check ownership
        const product = await prisma.product.findFirst({
            where: { id: productId, storeId }
        })

        if (!product) {
            return NextResponse.json(
                { error: "product not found" },
                { status: 404 }
            )
        }

        await prisma.product.delete({
            where: { id: productId }
        })

        return NextResponse.json({
            message: "Product deleted successfully"
        })
    } catch (error) {
        console.error("Delete product error:", error)
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        )
    }
}
