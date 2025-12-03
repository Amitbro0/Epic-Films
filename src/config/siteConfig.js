export const siteConfig = {
    studioName: "Epic Film's",
    ownerName: "Amit",
    location: "Ramgarh, Jharkhand, India",
    contact: {
        phone: "+91 98765 43210",
        email: "contact@amitstudio.com",
        upiId: "amit@upi", // Placeholder
    },
    hero: {
        headline: "Professional Wedding & Event Video Editor",
        subheadline: "Emotional, Cinematic Wedding Films that tell your story.",
    },
    features: [
        {
            title: "Storytelling",
            description: "We weave emotions into every frame to tell your unique story.",
        },
        {
            title: "Color Grading",
            description: "Cinematic color grading that brings your footage to life.",
        },
        {
            title: "On-Time Delivery",
            description: "We respect your time and deliver high-quality edits on schedule.",
        },
    ],
    services: [
        {
            id: "full-film",
            title: "Full Wedding Film",
            description: "A complete documentation of your special day.",
            duration: "2–2.5 Hours",
            deliverables: ["Full HD Video", "Separate Audio Processing"],
            priceStart: "₹15,000",
            imageUrl: "https://images.unsplash.com/photo-1511285560982-1356c11d4606?q=80&w=2076&auto=format&fit=crop",
            icon: "FaVideo"
        },
        {
            id: "highlight",
            title: "Cinematic Highlight",
            description: "The best moments of your wedding in a cinematic style.",
            duration: "5–10 Minutes",
            deliverables: ["4K Resolution", "Licensed Music"],
            priceStart: "₹8,000",
            imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop",
            icon: "FaFilm"
        },
        {
            id: "teaser",
            title: "Teaser / Trailer",
            description: "A short, high-energy teaser to share with friends and family.",
            duration: "1–2 Minutes",
            deliverables: ["Social Media Ready"],
            priceStart: "₹3,000",
            imageUrl: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=2070&auto=format&fit=crop",
            icon: "FaPhotoVideo"
        },
        {
            id: "reels",
            title: "Instagram Reels",
            description: "Trendy, vertical videos for Instagram and Shorts.",
            duration: "30–60 Seconds",
            deliverables: ["Vertical Format (9:16)"],
            priceStart: "₹1,000",
            imageUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop",
            icon: "FaCamera"
        },
        {
            id: "pre-wedding",
            title: "Pre-Wedding Film",
            description: "A romantic shoot before the big day.",
            duration: "3–5 Minutes",
            deliverables: ["Story-based Edit"],
            priceStart: "₹5,000",
            imageUrl: "https://images.unsplash.com/photo-1522673607200-1645062cd958?q=80&w=2070&auto=format&fit=crop",
            icon: "FaVideo"
        },
    ],
    pricing: [
        {
            category: "Reels Edit",
            details: [
                { label: "Up to 30 sec", price: "starts from ₹500" },
                { label: "30–60 sec", price: "starts from ₹1,000" },
            ],
        },
        {
            category: "Wedding Films",
            details: [
                { label: "Highlight (5-10 min)", price: "starts from ₹8,000" },
                { label: "Full Film (2-2.5 hrs)", price: "starts from ₹15,000" },
            ],
        },
    ],
    channelUrl: "https://www.youtube.com/@pixamit3161",
    paymentConfig: {
        advancePercentage: 50,
        taxRate: 0,
        invoiceNote: "Thank you for your business!",
        policies: "No refunds on advance payment. Full refund if cancelled within 24 hours of booking.",
        manualPayment: {
            enabled: true,
            upiId: "9939064764@ibl",
            qrCode: "https://drive.google.com/file/d/1R58G4ggil_6KsD-Pw3a3B7O3cFND-0ft/view?usp=drive_link",
            instructions: "Scan the QR code or use the UPI ID to pay. Enter the Transaction ID below."
        }
    },
    portfolio: [
        {
            id: 1,
            title: "Latest Work from Pixamit",
            videoId: "dQw4w9WgXcQ", // ⚠️ REPLACE THIS with a real Video ID from your channel
        },
        {
            id: 2,
            title: "Wedding Highlight",
            videoId: "dQw4w9WgXcQ", // ⚠️ REPLACE THIS with a real Video ID from your channel
        },
        {
            id: 3,
            title: "Cinematic Teaser",
            videoId: "dQw4w9WgXcQ", // ⚠️ REPLACE THIS with a real Video ID from your channel
        },
    ],
    statusColors: {
        pending: { label: "Pending", color: "#94a3b8", bg: "#1e293b" }, // Slate
        processing: { label: "Processing", color: "#f59e0b", bg: "#451a03" }, // Amber
        editing: { label: "Editing in Progress", color: "#3b82f6", bg: "#172554" }, // Blue
        payment_pending: { label: "Awaiting Payment", color: "#eab308", bg: "#422006" }, // Yellow
        completed: { label: "Completed", color: "#22c55e", bg: "#052e16" }, // Green
    },
};
