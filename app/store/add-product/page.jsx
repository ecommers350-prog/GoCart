'use client'
import { assets } from "@/assets/assets"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import Image from "next/image"
import { useState } from "react"
import { toast } from "react-hot-toast"

export default function StoreAddProduct() {

    const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']

    // Default 8 image slots
    const [images, setImages] = useState({
        1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null,
    })

    // Start with 4 visible containers
    const [visibleCount, setVisibleCount] = useState(4)

    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        category: "",
    })

    const [loading, setLoading] = useState(false)
    const { getToken } = useAuth()

    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        try {
            // Require at least one image
            if (!images[1] && !images[2] && !images[3] && !images[4]) {
                return toast.error("Please upload at least one image")
            }

            setLoading(true)
            const formData = new FormData()
            formData.append('name', productInfo.name)
            formData.append('description', productInfo.description)
            formData.append('mrp', productInfo.mrp)
            formData.append('price', productInfo.price)
            formData.append('category', productInfo.category)

            // Add uploaded images
            Object.keys(images).forEach((key) => {
                images[key] && formData.append('images', images[key])
            })

            const token = await getToken()
            const { data } = await axios.post('/api/store/product', formData, {
                headers: { Authorization: `Bearer ${token}` }
            })

            toast.success(data.message)

            // Reset form
            setProductInfo({
                name: "",
                description: "",
                mrp: 0,
                price: 0,
                category: "",
            })
            setImages({ 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null })
            setVisibleCount(4)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form
            onSubmit={e => toast.promise(onSubmitHandler(e), { loading: "Adding Product..." })}
            className="text-slate-500 mb-28"
        >
            <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Products</span></h1>
            <p className="mt-7">Product Images</p>

            {/* Image Upload Section */}
            <div className="flex flex-wrap gap-3 mt-4">
                {Object.keys(images)
                    .slice(0, visibleCount)
                    .map((key) => (
                        <div key={key} className="relative">
                            {/* Cancel button only for extra slots (5–8) */}
                            {key > 4 && (
                                <button
                                    type="button"
                                    onClick={() => setVisibleCount(visibleCount - 1)}
                                    className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-700 transition text-sm"
                                    title="Remove this upload slot"
                                >
                                    ✕
                                </button>
                            )}

                            <label htmlFor={`images${key}`}>
                                <Image
                                    width={300}
                                    height={300}
                                    className='h-15 w-auto border border-slate-200 rounded cursor-pointer object-cover'
                                    src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area}
                                    alt=""
                                />
                                <input
                                    type="file"
                                    accept='image/*'
                                    id={`images${key}`}
                                    onChange={e => setImages({ ...images, [key]: e.target.files[0] })}
                                    hidden
                                />
                            </label>
                        </div>
                    ))}
            </div>

            {/* Add More Button */}
            {visibleCount < 8 && (
                <button
                    type="button"
                    onClick={() => setVisibleCount(visibleCount + 1)}
                    className="mt-4 px-5 py-2 rounded-md bg-gradient-to-r from-slate-700 to-slate-900 text-white hover:opacity-90 transition font-medium shadow-sm"
                >
                    + Add more images
                </button>
            )}

            {/* Product Info Fields */}
            <label className="flex flex-col gap-2 my-6">
                Name
                <input
                    type="text"
                    name="name"
                    onChange={onChangeHandler}
                    value={productInfo.name}
                    placeholder="Enter product name"
                    className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded"
                    required
                />
            </label>

            <label className="flex flex-col gap-2 my-6">
                Description
                <textarea
                    name="description"
                    onChange={onChangeHandler}
                    value={productInfo.description}
                    placeholder="Enter product description"
                    rows={5}
                    className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none"
                    required
                />
            </label>

            <div className="flex gap-5">
                <label className="flex flex-col gap-2">
                    Actual Price (₹)
                    <input
                        type="number"
                        name="mrp"
                        onChange={onChangeHandler}
                        value={productInfo.mrp}
                        placeholder="0"
                        className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none"
                        required
                    />
                </label>

                <label className="flex flex-col gap-2">
                    Offer Price (₹)
                    <input
                        type="number"
                        name="price"
                        onChange={onChangeHandler}
                        value={productInfo.price}
                        placeholder="0"
                        className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded resize-none"
                        required
                    />
                </label>
            </div>

            <select
                onChange={e => setProductInfo({ ...productInfo, category: e.target.value })}
                value={productInfo.category}
                className="w-full max-w-sm p-2 px-4 my-6 outline-none border border-slate-200 rounded"
                required
            >
                <option value="">Select a category</option>
                {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                ))}
            </select>

            <br />

            <button
                disabled={loading}
                className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition"
            >
                Add Product
            </button>
        </form>
    )
}
