
// import { NextRequest, NextResponse } from 'next/server';
// import { stripe } from '@/lib/stripe';
// import { adminDb } from '@/lib/firebase-admin';
// import { auth } from 'firebase-admin';
// import Stripe from 'stripe';

// export async function POST(req: NextRequest) {
//   try {
//     // 1. Verify authentication
//     const authorization = req.headers.get('Authorization');
//     if (!authorization?.startsWith('Bearer ')) {
//       console.error('Missing or invalid authorization header');
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const idToken = authorization.split('Bearer ')[1];
//     const decodedToken = await auth().verifyIdToken(idToken);
//     const userId = decodedToken.uid;

//     console.log('Processing subscription renewal for user:', userId);

//     // 2. Get request body
//     const body = await req.json();
//     const { subscriptionId, planType } = body;

//     console.log('Request body received:', { subscriptionId, planType });

//     if (!subscriptionId || !planType) {
//       console.error('Missing required fields in request body:', { subscriptionId, planType });
//       return NextResponse.json(
//         { error: 'Subscription ID and plan type are required' },
//         { status: 400 }
//       );
//     }

//     // 3. Get user data from Firestore
//     const userDoc = await adminDb.collection('users').doc(userId).get();
//     if (!userDoc.exists) {
//       console.error('User document not found');
//       return NextResponse.json({ error: 'User not found' }, { status: 404 });
//     }

//     const userData = userDoc.data();
//     const customerId = userData?.stripeCustomerId;

//     if (!customerId) {
//       console.error('No Stripe customer ID found for user');
//       return NextResponse.json(
//         { error: 'No customer record found' },
//         { status: 400 }
//       );
//     }

//     // 4. Retrieve the existing subscription with proper typing
//     let subscription: Stripe.Subscription;
//     try {
//       subscription = await stripe.subscriptions.retrieve(subscriptionId);
//       console.log('Retrieved subscription:', subscription.id);
//     } catch (error) {
//       console.error('Error retrieving subscription:', error);
//       return NextResponse.json(
//         { error: 'Failed to retrieve subscription' },
//         { status: 400 }
//       );
//     }

//     // 5. Verify the subscription belongs to this customer
//     if (typeof subscription.customer === 'string' 
//         ? subscription.customer !== customerId
//         : subscription.customer.id !== customerId) {
//       console.error('Subscription does not belong to this customer');
//       return NextResponse.json(
//         { error: 'Invalid subscription' },
//         { status: 403 }
//       );
//     }

//     // 6. Check if subscription is already canceled
//     if (subscription.status === 'canceled') {
//       console.log('Subscription is already canceled - creating new one');
      
//       // Define the price ID based on planType
//       let priceId: string | undefined;
//       switch (planType) {
//         case 'monthly':
//           priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
//           break;
//         case 'semiannual':
//           priceId = process.env.STRIPE_SEMIANNUAL_PRICE_ID;
//           break;
//         case 'annual':
//           priceId = process.env.STRIPE_ANNUAL_PRICE_ID;
//           break;
//         default:
//           console.error('Invalid plan type:', planType);
//           return NextResponse.json(
//             { error: 'Invalid plan type' },
//             { status: 400 }
//           );
//       }

//       if (!priceId) {
//         console.error('Price ID not configured for plan type:', planType);
//         return NextResponse.json(
//           { error: 'Server configuration error' },
//           { status: 500 }
//         );
//       }

//       // Create a new checkout session for a new subscription
//       const session = await stripe.checkout.sessions.create({
//         customer: customerId,
//         payment_method_types: ['card'],
//         mode: 'subscription',
//         line_items: [{
//           price: priceId,
//           quantity: 1,
//         }],
//         success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription`,
//         metadata: {
//           userId,
//           firebaseUid: userId,
//           planType,
//           isRenewal: 'true',
//         },
//         subscription_data: {
//           metadata: {
//             userId,
//             firebaseUid: userId,
//             planType,
//             isRenewal: 'true',
//           },
//         },
//         allow_promotion_codes: true,
//         billing_address_collection: 'required',
//       });

//       if (!session.url) {
//         console.error('Stripe session created but no URL returned');
//         return NextResponse.json(
//           { error: 'Failed to generate checkout URL' },
//           { status: 500 }
//         );
//       }

//       return NextResponse.json({ url: session.url });
//     }

//     // 7. If subscription is active but expiring soon, create a checkout session for renewal
//     // Fix: Type-safe access to current_period_end
//     const subscriptionWithPeriod = subscription as Stripe.Subscription & { current_period_end: number };
    
//     if (!subscriptionWithPeriod.current_period_end) {
//       console.error('Subscription missing current_period_end property');
//       return NextResponse.json(
//         { error: 'Invalid subscription data - missing period end' },
//         { status: 400 }
//       );
//     }

//     const currentPeriodEnd = new Date(subscriptionWithPeriod.current_period_end * 1000);
//     const now = new Date();
//     const daysUntilExpiration = Math.floor(
//       (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
//     );

//     console.log('Subscription status check:', {
//       subscriptionId: subscription.id,
//       status: subscription.status,
//       currentPeriodEnd: currentPeriodEnd.toISOString(),
//       daysUntilExpiration,
//       now: now.toISOString()
//     });

//     // Allow renewal if subscription is expiring within 30 days OR if it's already expired
//     if (daysUntilExpiration > 30) {
//       console.log(`Subscription is not yet expiring (${daysUntilExpiration} days remaining, more than 30 days)`);
//       return NextResponse.json(
//         { 
//           error: 'Subscription is not yet eligible for renewal',
//           daysRemaining: daysUntilExpiration,
//           currentPeriodEnd: currentPeriodEnd.toISOString()
//         },
//         { status: 400 }
//       );
//     }

//     // Ensure we have at least one price item
//     if (!subscription.items?.data || subscription.items.data.length === 0) {
//       console.error('Subscription has no items or items data is missing');
//       return NextResponse.json(
//         { error: 'Invalid subscription configuration - no items found' },
//         { status: 400 }
//       );
//     }

//     const subscriptionItem = subscription.items.data[0];
//     if (!subscriptionItem.price?.id) {
//       console.error('Subscription item has no price ID');
//       return NextResponse.json(
//         { error: 'Invalid subscription configuration - no price ID' },
//         { status: 400 }
//       );
//     }

//     console.log('Using existing subscription price ID:', subscriptionItem.price.id);

//     // 8. Create a checkout session for renewal
//     console.log('Creating checkout session for renewal with:', {
//       customerId,
//       priceId: subscriptionItem.price.id,
//       existingSubscriptionId: subscription.id
//     });

//     const session = await stripe.checkout.sessions.create({
//       customer: customerId,
//       payment_method_types: ['card'],
//       mode: 'subscription',
//       line_items: [{
//         price: subscriptionItem.price.id,
//         quantity: 1,
//       }],
//       success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/subscription`,
//       metadata: {
//         userId,
//         firebaseUid: userId,
//         planType,
//         isRenewal: 'true',
//         existingSubscriptionId: subscription.id,
//       },
//       subscription_data: {
//         metadata: {
//           userId,
//           firebaseUid: userId,
//           planType,
//           isRenewal: 'true',
//           existingSubscriptionId: subscription.id,
//         },
//       },
//       allow_promotion_codes: true,
//       billing_address_collection: 'required',
//     });

//     if (!session.url) {
//       console.error('Stripe session created but no URL returned');
//       return NextResponse.json(
//         { error: 'Failed to generate checkout URL' },
//         { status: 500 }
//       );
//     }

//     console.log('Renewal checkout session created:', session.id);
//     return NextResponse.json({ url: session.url });

//   } catch (error: any) {
//     console.error('Error in subscription renewal:', {
//       message: error.message,
//       type: error.type,
//       code: error.code,
//       stack: error.stack
//     });

//     return NextResponse.json(
//       { 
//         error: error.message || 'Failed to process renewal',
//         details: error.raw?.message || null
//       },
//       { status: 500 }
//     );
//   }
// }