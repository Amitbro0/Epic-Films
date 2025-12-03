import dbConnect from '@/lib/db';
import Order from '@/models/Order';


export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const phone = searchParams.get('phone');
        const orderId = searchParams.get('orderId');

        if (!phone) {
            return Response.json({ message: 'Phone number is required' }, { status: 400 });
        }

        // Fetch all orders for this phone number
        const orders = await Order.find({ phone: phone }).sort({ createdAt: -1 });

        if (!orders || orders.length === 0) {
            return Response.json({ message: 'No orders found for this mobile number.' }, { status: 404 });
        }

        return Response.json(orders);

    } catch (error) {
        console.error('Status check error:', error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
