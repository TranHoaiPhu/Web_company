import httpBooking from "./httpBooking";

export const uploadService = {
    /**
     * Uploads a single image to the server
     * @param file The file object from input
     * @returns Promise with the image URL
     */
    async uploadImage(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("image", file);

        try {
            const response = await httpBooking.post("/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if (response.data.success) {
                return response.data.imageUrl;
            } else {
                throw new Error(response.data.message || "Upload failed");
            }
        } catch (error) {
            const err = error as { response?: { data?: { message?: string }, status?: number }, message?: string };
            const errorMsg = err.response?.data?.message || err.message || "Error uploading image";
            console.error("Upload Error Details:", {
                message: errorMsg,
                status: err.response?.status,
                data: err.response?.data
            });
            throw new Error(errorMsg);
        }
    },
};
