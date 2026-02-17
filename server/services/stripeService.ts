import Stripe from 'stripe';
import type { StripeConfig, StripePriceConfig } from '../../shared/types.ts';

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_your-stripe-secret-key') return null;
  return new Stripe(key);
}

export async function setupStripeProducts(config: StripeConfig): Promise<StripeConfig> {
  const stripe = getStripe();
  if (!stripe) {
    console.log('[Stripe] No API key configured, returning config without Stripe IDs');
    return config;
  }

  // Create product
  const product = await stripe.products.create({
    name: config.productName,
    description: config.productDescription,
  });

  console.log(`[Stripe] Created product: ${product.id}`);

  // Create prices for each tier
  const updatedPrices: StripePriceConfig[] = [];
  for (const priceConfig of config.prices) {
    const priceParams: Stripe.PriceCreateParams = {
      product: product.id,
      unit_amount: priceConfig.unitAmount,
      currency: priceConfig.currency,
    };

    if (priceConfig.interval) {
      priceParams.recurring = { interval: priceConfig.interval };
    }

    const price = await stripe.prices.create(priceParams);
    console.log(`[Stripe] Created price for ${priceConfig.tierName}: ${price.id}`);

    updatedPrices.push({
      ...priceConfig,
      stripeProductId: product.id,
      stripePriceId: price.id,
    });
  }

  return {
    ...config,
    prices: updatedPrices,
  };
}

export async function createCheckoutSession(
  stripePriceId: string,
  successUrl: string,
  cancelUrl: string,
  mode: 'payment' | 'subscription' = 'subscription'
): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const session = await stripe.checkout.sessions.create({
    mode,
    line_items: [{ price: stripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session.url;
}

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!key && key !== 'sk_test_your-stripe-secret-key';
}
