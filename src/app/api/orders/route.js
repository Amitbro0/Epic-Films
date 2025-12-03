import dbConnect from '@/lib/db';
import Order from '@/models/Order';


export async function POST(req) {
    try {
        await dbConnect();
        const body = await req.json();

        // Basic validation
        if (!body.clientName || !body.phone || !body.serviceType) {
            return Response.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Create order
        const order = await Order.create(body);

        // Send Email Notification
        try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: 'rollfor4@gmail.com',
                subject: `New Order #${order._id.toString().slice(-6)} - ${body.clientName}`,
                text: `
New Order Received!

Order ID: ${order._id}
Client: ${body.clientName}
Phone: ${body.phone}
Service: ${body.serviceType}
Event Type: ${body.eventType}
Drive Link: ${body.driveLink}
Message: ${body.message}

Please check the Admin Dashboard for more details.
                `,
            };

            await transporter.sendMail(mailOptions);
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the request if email fails, just log it
        }

        return Response.json({
            success: true,
            orderId: order._id,
            amount: order.amountTotal,
            message: 'Booking submitted successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Order creation error:', error);
        return Response.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
