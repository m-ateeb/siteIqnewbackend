import { Webhook } from 'svix';
import User from '../models/User.js';

export const handleClerkWebhook = async (req, res) => {
    console.log('Webhook received:', req.body);
    try {
        const rawBody = req.body;                // this is now a Buffer
        const signatureHeaders = {
            'svix-id': req.header('svix-id'),
            'svix-timestamp': req.header('svix-timestamp'),
            'svix-signature': req.header('svix-signature'),
        };


        // Verify webhook signature
        const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET_KEY);
        const event = webhook.verify(rawBody, signatureHeaders);
        const eventType = event.type;

        if (eventType === 'user.created') {
            // Handle new user creation
            const { id } = event.data;
            const { first_name, last_name, email_addresses, profile_image_url, phone_numbers } = event.data;
            const email = email_addresses?.[0]?.email_address || null;
            const phoneNumber = phone_numbers?.[0]?.phone_number || null;
            const name = `${first_name} ${last_name}`;
            const username = email?.split('@')[0]; // Generate a username from the email

            if (!email || !name) {
                console.error('Missing required user fields from webhook payload.');
                return res.status(400).json({
                    success: false,
                    message: 'Required user fields are missing',
                });
            }

            const newUser = new User({
                clerkUserId: id,
                name,
                username,
                email,
                phoneNumber,
                image: profile_image_url || 'default-avatar.jpg',
                isVerified: true,
            });

            await newUser.save();
            console.log('User created:', newUser);

            return res.status(200).json({
                success: true,
                message: 'User created and webhook processed successfully',
            });
        } else if (eventType === 'session.created') {
            // Handle login event: increment loginCount on each session creation (login)
            const clerkUserId = event.data.user_id;
            console.log('User logged in with ID:', clerkUserId);
            const user = await User.findOneAndUpdate(
                { clerkUserId: clerkUserId },
                { $inc: { loginCount: 1 } },
                { new: true }
            );
            if (!user) {
                console.error(`User with ID ${clerkUserId} not found for login update.`);
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            console.log('Login count incremented for user:', user);
            return res.status(200).json({
                success: true,
                message: 'Login count incremented successfully',
            });
        } else if (eventType === 'user.updated') {
            // Handle user info update when a user updates their details on Clerk
            const { id } = event.data; // Clerk user ID
            const { first_name, last_name, email_addresses, profile_image_url, phone_numbers } = event.data;
            const email = email_addresses?.[0]?.email_address || null;
            const phoneNumber = phone_numbers?.[0]?.phone_number || null;
            const name = `${first_name} ${last_name}`;
            const username = email?.split('@')[0]; // Regenerate username based on updated email

            const updatedUser = await User.findOneAndUpdate(
                { clerkUserId: id },
                {
                    name,
                    username,
                    email,
                    phoneNumber,
                    image: profile_image_url || 'default-avatar.jpg'
                },
                { new: true }
            );

            if (!updatedUser) {
                console.error(`User with ID ${id} not found for update.`);
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }

            console.log('User updated:', updatedUser);
            return res.status(200).json({
                success: true,
                message: 'User info updated successfully',
            });
        } else if (eventType === 'user.deleted') {
            // Delete user and related data when a user is deleted on Clerk
            const { id } = event.data;
            const user = await User.findOneAndDelete({ clerkUserId: id });
            if (!user) {
                console.error(`User with ID ${id} not found in MongoDB.`);
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                });
            }
            console.log('User deleted with ID:', id);
            return res.status(200).json({
                success: true,
                message: 'User and related data deleted successfully',
            });
        } else {
            console.log('Unhandled event type:', eventType);
            return res.status(400).json({
                success: false,
                message: `Unhandled event type: ${eventType}`,
            });
        }
    } catch (error) {
        console.error('Error processing webhook:', error.message);
        return res.status(400).json({
            success: false,
            message: 'Webhook verification failed',
        });
    }
}


