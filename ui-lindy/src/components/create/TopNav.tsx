"use client";

export default function TopNav() {
  return (
    <div className="w-full px-10 py-6 flex items-center justify-between">
      <div className="text-xl font-semibold">
        ◇ Universal AI
      </div>

      <div className="flex items-center gap-6 text-sm text-slate-600">
        <button>Product</button>
        <button>Solutions</button>
        <button>Pricing</button>
        <button className="rounded-full bg-indigo-600 text-white px-4 py-2">
          Try for free
        </button>
      </div>
    </div>
  );
}
