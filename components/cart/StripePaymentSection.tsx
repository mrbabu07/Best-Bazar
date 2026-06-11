"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type StripePaymentSectionProps = {
  clientSecret: string;
  orderNumber: string;
  returnUrl: string;
};

function StripePaymentForm({ orderNumber, returnUrl }: { orderNumber: string; returnUrl: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [confirming, setConfirming] = useState(false);

  const confirmPayment = async () => {
    if (!stripe || !elements) {
      return;
    }

    try {
      setConfirming(true);

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl
        }
      });

      if (result.error) {
        toast.error(result.error.message ?? "Payment failed. Please check your card details.");
        setConfirming(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed. Please try again.");
      setConfirming(false);
    }
  };

  return (
    <div className="mt-5 rounded-lg border border-gold-200 bg-gold-50 p-4">
      <div className="mb-4">
        <p className="text-sm font-bold text-navy">Secure card payment</p>
        <p className="mt-1 text-xs font-semibold text-neutral-600">
          Order {orderNumber}. Card, Apple Pay, and Google Pay appear here when Stripe supports the device.
        </p>
      </div>
      <PaymentElement />
      <Button type="button" className="mt-4 w-full" onClick={confirmPayment} disabled={!stripe || confirming}>
        <ShieldCheck size={18} />
        {confirming ? "Confirming..." : "Confirm card payment"}
      </Button>
    </div>
  );
}

export function StripePaymentSection({ clientSecret, orderNumber, returnUrl }: StripePaymentSectionProps) {
  if (!stripePromise) {
    return (
      <p className="mt-4 rounded-md border border-red-100 bg-red-50 p-3 text-sm font-bold text-sale">
        Stripe publishable key is missing. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable inline card payment.
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe"
        }
      }}
    >
      <StripePaymentForm orderNumber={orderNumber} returnUrl={returnUrl} />
    </Elements>
  );
}
