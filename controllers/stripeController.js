import Stripe from 'stripe';
import User from '../models/User.js'; // Assuming you have a User model
// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const YOUR_DOMAIN = process.env.FRONTEND_URL || 'http://localhost:5000';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
/**
 * Controller for creating a Stripe Checkout session.
 * Handles creating a checkout session for a subscription or product purchase.
 */
export const createCheckoutSession = async (req, res) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    // Find user by clerkUserId (adjust field name as per your schema)
    const user = await User.findOne({ clerkUserId: req.auth.userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Block if user is already premium
    if (user.membership === 'premium') {
      return res.status(400).json({ error: 'You are already a premium user.' });
    }

    const prices = await stripe.prices.list({
      lookup_keys: [req.body.lookup_key],
      expand: ['data.product'],
    });

    if (!prices.data.length) {
      return res.status(400).json({ error: 'No price found for the provided lookup key' });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        quantity: 1,
        price: prices.data[0].id,
      }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
      metadata: { userId: req.auth.userId },
    });

    console.log(`Created checkout session for user ${req.auth.userId} with price ${prices.data[0].id}`);

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error during Stripe session creation:', error);
    res.status(500).json({ error: error.message });
  }
};



/**
 * Webhook handler to receive and process events sent by Stripe.
 * Webhooks are essential for handling events like payment success, subscription updates, etc.
 */
// Controller for handling Stripe Webhooks
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  console.log('🔔 Stripe webhook received:', event.type); // <--- Add this

  switch (event.type) {
    case 'checkout.session.completed': {
  const session = event.data.object;
  const subscriptionId = session.subscription;
  const customerId = session.customer;
  const userId = session.metadata?.userId;

  if (!subscriptionId) {
    console.warn('No subscription ID in checkout session (likely a one-time payment)');
    break;
  }

  if (!userId) {
    console.warn('No userId found in checkout session metadata');
    break;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const plan = subscription.items.data[0].price.lookup_key;

    const user = await User.findOne({ clerkUserId: userId });

    if (!user) {
      console.warn(`User ${userId} not found`);
      break;
    }

    // Only update if not already premium
    if (user.membership !== 'premium') {
      user.membership = 'premium';
      user.stripe = user.stripe || {};
      user.stripe.customerId = customerId;
      user.stripe.subscriptionId = subscriptionId;
      user.stripe.isActive = true;
      user.stripe.plan = plan;

      await user.save();
      console.log(`✅ User ${userId} upgraded to premium with subscription ${subscriptionId}`);
    } else {
      console.log(`ℹ️ User ${userId} is already premium, no changes made.`);
    }

  } catch (err) {
    console.error('❌ Failed to retrieve subscription or update user:', err);
  }

  break;
}

      case 'payment_intent.created':
        const paymentIntentCreated = event.data.object;
        // Action: Log or initiate actions like email notifications, etc.
        console.log(`Payment Intent Created: ID = ${paymentIntentCreated.id}, Amount = ${paymentIntentCreated.amount}`);
        // You might want to save it in the database to track pending payments.
        break;
  
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object;
        // Action: Confirm the payment, send a confirmation email to the user, update order status.
        console.log(`Payment Intent Succeeded: ID = ${paymentIntentSucceeded.id}, Amount = ${paymentIntentSucceeded.amount_received}`);
        // Update database and send a thank you message to the user
        break;
  
      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object;
        // Action: Notify the customer that payment failed, try again or update the order status.
        console.log(`Payment Intent Failed: ID = ${paymentIntentFailed.id}, Status = ${paymentIntentFailed.status}`);
        // You can update your records and retry payment logic here.
        break;
  
      case 'customer.created':
        const customerCreated = event.data.object;
        // Action: Add customer data to your database if necessary, send welcome email.
        console.log(`Customer Created: ID = ${customerCreated.id}`);
        // You can store the customer ID in your user records for further processing.
        break;
  
      case 'customer.subscription.created':
        const subscriptionCreated = event.data.object;
        // Action: Activate the subscription in your system, grant access to the service.
        console.log(`Subscription Created: ID = ${subscriptionCreated.id}`);
        // Add user to subscription list and track the plan.
        break;
  
      case 'customer.subscription.updated':
        const subscriptionUpdated = event.data.object;
        // Action: Update subscription details, plan changes, and billing cycle.
        console.log(`Subscription Updated: ID = ${subscriptionUpdated.id}`);
        // You may want to update subscription data in your database based on the update.
        break;
  
      case 'customer.subscription.deleted':
        const subscriptionDeleted = event.data.object;
        // Action: Handle cancellation, update user access, or prevent further billing.
        console.log(`Subscription Canceled: ID = ${subscriptionDeleted.id}`);
        // Remove access to services, update database, and stop recurring payments.
        break;
  
      case 'invoice.created':
        const invoiceCreated = event.data.object;
        // Action: Generate invoice, notify user of upcoming payment.
        console.log(`Invoice Created: ID = ${invoiceCreated.id}`);
        // You can trigger notifications for customers to inform them about their invoices.
        break;
  
      case 'invoice.payment_succeeded':
        const invoicePaymentSucceeded = event.data.object;
        // Action: Mark the invoice as paid, notify the customer, update billing records.
        console.log(`Invoice Payment Succeeded: ID = ${invoicePaymentSucceeded.id}, Amount = ${invoicePaymentSucceeded.amount_paid}`);
        // Update your system to mark the invoice as paid and process further.
        break;
  
      case 'invoice.payment_failed': {
  const invoice = event.data.object;
  const customerId = invoice.customer;

  // Find user by customerId (make sure you store it in user.stripe.customerId)
  const user = await User.findOne({ 'stripe.customerId': customerId });

  if (user) {
    // Update user subscription status or notify the user
    user.stripe.isActive = false;
    await user.save();

    console.log(`Payment failed for user ${user.clerkUserId}, subscription paused or canceled.`);
    
    // You can also send an email or notification here
  } else {
    console.warn(`User not found for customerId ${customerId} on payment failure.`);
  }
  break;
}
      case 'payment_method.attached':
        const paymentMethodAttached = event.data.object;
        // Action: Save the payment method for the user, or trigger payment verification.
        console.log(`Payment Method Attached: ID = ${paymentMethodAttached.id}, Customer ID = ${paymentMethodAttached.customer}`);
        // You may want to associate the payment method with the user in your database.
        break;
  
      case 'payment_method.detached':
        const paymentMethodDetached = event.data.object;
        // Action: Handle removal of payment method, notify customer if needed.
        console.log(`Payment Method Detached: ID = ${paymentMethodDetached.id}`);
        // You may want to clean up the payment method in your database or notify the customer.
        break;
  
      case 'checkout.session.expired':
        const checkoutSessionExpired = event.data.object;
        // Action: Inform the user that the checkout session expired and ask them to try again.
        console.log(`Checkout Session Expired: ID = ${checkoutSessionExpired.id}`);
        // Handle session expiration, notify users, and guide them to restart the checkout process.
        break;
  
      case 'payment_intent.canceled':
        const paymentIntentCanceled = event.data.object;
        // Action: Handle cancellation of a payment intent, notify customer.
        console.log(`Payment Intent Canceled: ID = ${paymentIntentCanceled.id}`);
        // Inform the customer that their payment was canceled.
        break;
  
      // Handle unknown events (if any)
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  
    // Respond that the webhook was received successfully
    res.json({ received: true });
  };
  









  /* Scenario           | Card Number           |
| ------------------ | --------------------- |
| Declined card      | `4000 0000 0000 9995` |
| Insufficient funds | `4000 0000 0000 9995` |
| Incorrect CVC      | `4000 0000 0000 0127` |
| Expired card       | `4000 0000 0000 0069` |
*/