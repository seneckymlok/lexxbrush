import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="page-enter min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">🤔</div>
        <h1 className="text-2xl font-bold text-white mb-3">Checkout Cancelled</h1>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          No worries — your cart is still saved. Come back whenever you&apos;re ready.
        </p>
        <Link
          href="/cart"
          className="inline-block px-6 py-3 bg-white text-black text-sm font-semibold rounded-full hover:bg-white/90 transition-colors"
        >
          Return to Cart
        </Link>
      </div>
    </div>
  );
}
