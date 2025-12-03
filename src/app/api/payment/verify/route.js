import crypto from 'crypto';

import dbConnect from '@/lib/db';
import Order from '@/models/Order';

export async function POST(req) {
    try {
        await dbConnect();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderId, // Our DB Order ID (if existing)
            bookingDetails, // If new booking
            amountPaid
        } = await req.json();

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Payment Success
            let order;

            if (orderId) {
                // Update existing order
                order = await Order.findById(orderId);
                if (!order) return Response.json({ message: 'Order not found' }, { status: 404 });
            } else {
                // Create new order
                order = new Order(bookingDetails);
            }

            // Update Payment Details
            order.amountPaid = (order.amountPaid || 0) + amountPaid;
            order.amountTotal = bookingDetails?.amountTotal || order.amountTotal; // Ensure total is set
            order.amountDue = order.amountTotal - order.amountPaid;

            if (order.amountDue <= 0) {
                order.paymentStatus = 'paid';
                order.amountDue = 0;
            } else {
                order.paymentStatus = 'partial';
            }

            // Add Transaction
            order.transactions.push({
                id: razorpay_payment_id,
                orderId: razorpay_order_id,
                amount: amountPaid,
                status: 'success',
                method: 'razorpay'
            });

            // Generate Invoice Number if not present
            if (!order.invoiceNumber) {
                order.invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            }

            await order.save();

            return Response.json({ message: 'Payment verified', orderId: order._id });
        } else {
            return Response.json({ message: 'Invalid signature' }, { status: 400 });
        }
    } catch (error) {
        console.error('Verification Error:', error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
