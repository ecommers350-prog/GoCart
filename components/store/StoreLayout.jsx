'use client'
import { useEffect, useState } from "react"
import Loading from "../Loading"
import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"
import SellerNavbar from "./StoreNavbar"
import SellerSidebar from "./StoreSidebar"
import axios from "axios"
import { useAuth, useUser } from "@clerk/nextjs"

const StoreLayout = ({ children }) => {
    const { getToken } = useAuth()
    const { user } = useUser()

    const [isSeller, setIsSeller] = useState(false)
    const [loading, setLoading] = useState(true)
    const [storeInfo, setStoreInfo] = useState(null)

    const fetchIsSeller = async () => {
        setLoading(true)
        try {
            if (!user) return

            // Get Clerk token
            const token = await getToken()

            // Correct API path with leading slash
            const { data } = await axios.get('/api/store/is-seller', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            setIsSeller(data.isSeller)
            setStoreInfo(data.storeInfo)
        } catch (error) {
            console.error("Error fetching seller info:", error.response?.data || error.message)
            setIsSeller(false)
            setStoreInfo(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchIsSeller()
        } else {
            setLoading(false)
        }
    }, [user])

    if (loading) {
        return <Loading />
    }

    if (!isSeller) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-2xl sm:text-4xl font-semibold text-slate-400">
                    You are not authorized to access this page
                </h1>
                <Link
                    href="/"
                    className="bg-slate-700 text-white flex items-center gap-2 mt-8 p-2 px-6 max-sm:text-sm rounded-full"
                >
                    Go to home <ArrowRightIcon size={18} />
                </Link>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen">
            <SellerNavbar />
            <div className="flex flex-1 items-start h-full overflow-y-scroll no-scrollbar">
                <SellerSidebar storeInfo={storeInfo} />
                <div className="flex-1 h-full p-5 lg:pl-12 lg:pt-12 overflow-y-scroll">
                    {children}
                </div>
            </div>
        </div>
    )
}

export default StoreLayout
