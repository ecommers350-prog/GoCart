'use client'
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import Image from "next/image"
import Loading from "@/components/Loading"
import { useAuth, useUser } from "@clerk/nextjs"
import axios from "axios"
import { Trash2 } from "lucide-react"

export default function StoreManageProducts() {

    const { getToken } = useAuth()
    const { user } = useUser()

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹'

    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState([])

    const fetchProducts = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/store/product', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setProducts(
                data.products.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                )
            )
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    const toggleStock = async (productId) => {
        try {
            const token = await getToken()
            const { data } = await axios.post(
                '/api/store/stock-toggle',
                { productId },
                { headers: { Authorization: `Bearer ${token}` } }
            )

            setProducts(prev =>
                prev.map(p =>
                    p.id === productId ? { ...p, inStock: !p.inStock } : p
                )
            )

            toast.success(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    const deleteProduct = async (productId) => {
        if (!confirm("Are you sure you want to delete this product?")) return

        try {
            const token = await getToken()
            const { data } = await axios.delete('/api/store/product', {
                data: { productId },
                headers: { Authorization: `Bearer ${token}` }
            })

            setProducts(prev => prev.filter(p => p.id !== productId))
            toast.success(data.message)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    useEffect(() => {
        if (user) fetchProducts()
    }, [user])

    if (loading) return <Loading />

    return (
    <>
        <h1 className="text-2xl text-slate-500 mb-5">
            Manage <span className="text-slate-800 font-medium">Products</span>
        </h1>

        <table className="w-full max-w-4xl ring ring-slate-200 rounded text-sm overflow-hidden">
            <thead className="bg-slate-50 uppercase text-gray-700">
                <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 hidden md:table-cell text-left">MRP</th>
                    <th className="px-4 py-3 text-left">Price</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                    <th className="px-4 py-3 text-center">Delete</th>
                </tr>
            </thead>

            <tbody className="text-slate-700">
                {products.map(product => (
                    <tr
                        key={product.id}
                        className="border-t hover:bg-gray-50"
                    >
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                                <Image
                                    src={product.images[0]}
                                    width={40}
                                    height={40}
                                    className="rounded shadow"
                                    alt=""
                                />
                                <span className="whitespace-nowrap">
                                    {product.name}
                                </span>
                            </div>
                        </td>

                        <td className="px-4 py-3 hidden md:table-cell">
                            {currency} {product.mrp.toLocaleString()}
                        </td>

                        <td className="px-4 py-3">
                            {currency} {product.price.toLocaleString()}
                        </td>

                        <td className="px-4 py-3 text-center">
                            <label className="relative inline-flex items-center justify-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={product.inStock}
                                    onChange={() =>
                                        toast.promise(
                                            toggleStock(product.id),
                                            { loading: "Updating data..." }
                                        )
                                    }
                                />
                                <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-600 transition-colors"></div>
                                <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></span>
                            </label>
                        </td>

                        <td className="px-4 py-3 text-center">
                            <button
                                onClick={() => deleteProduct(product.id)}
                                className="inline-flex items-center justify-center text-red-600 hover:text-red-800"
                            >
                                <Trash2 size={18} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </>
)

}
