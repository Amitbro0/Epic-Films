import Razorpay from 'razorpay';

import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import SiteConfig from '@/models/SiteConfig';

// Initialize lazily or check for keys
const initRazorpay = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys are missing');
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

export async function POST(req) {
    try {
        await dbConnect();
        const { amount, orderId, serviceDetails, isAdvance } = await req.json();

        // If orderId is provided, we are paying for an existing order (balance or full)
        // If serviceDetails is provided, we are creating a new booking (advance or full)

        let amountToPay = amount;
        let currency = 'INR';

        if (serviceDetails && isAdvance) {
            // Fetch config to get advance percentage
            const config = await SiteConfig.findOne();
            const advancePercent = config?.paymentConfig?.advancePercentage || 50;
            amountToPay = Math.round((serviceDetails.price * advancePercent) / 100);
        }

        const options = {
            amount: amountToPay * 100, // Razorpay expects amount in paise
            currency,
            receipt: orderId || `receipt_${Date.now()}`,
        };

        const razorpay = initRazorpay();
        const order = await razorpay.orders.create(options);

        return Response.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            amountToPay: amountToPay // Send back the actual amount to pay in rupees
        });
    } catch (error) {
        console.error('Razorpay Error:', error);
        return Response.json({ message: 'Payment initiation failed' }, { status: 500 });
    }
}
