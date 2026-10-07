"use client";

import { useEffect, useState } from "react";
import ToursPage from "../../page";
import { tourCategoryService } from "@/services/tours/tour-categoy.service";
import { useParams } from "next/navigation";

export default function CategoryPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const [categoryName, setCategoryName] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategory = async () => {
            if (!slug) return;
            try {
                const categories = await tourCategoryService.getAll();
                const category = categories.find((c) => c.slug === slug);
                if (category) {
                    setCategoryName(category.name);
                }
            } catch (error) {
                console.error("Failed to fetch category", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategory();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return <ToursPage initialCategory={categoryName} key={categoryName} />; // key ensures state reset
}
