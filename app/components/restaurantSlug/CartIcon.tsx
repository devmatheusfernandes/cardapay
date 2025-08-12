import { ShoppingCart } from "lucide-react";

interface CartIconProps {
  onCartClick: () => void;
  itemCount: number;
  isScrolled: boolean;
}

export function CartIcon({
  onCartClick,
  itemCount,
  isScrolled,
}: CartIconProps) {
  return (
    <button
      onClick={onCartClick}
      className={`relative p-2 rounded-full transition-colors ${
        isScrolled ? "text-emerald-500" : "bg-white text-gray-700"
      }`}
      aria-label="Open cart"
    >
      <ShoppingCart className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-emerald-400 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </button>
  );
}
