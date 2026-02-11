import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, ArrowRight, Printer } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { formatCurrency, getColorTypeText, getSideTypeText } from "../../utils/formatters";

export default function Cart() {
  const { cartItems, removeFromCart, clearCart, getCartTotal } = useCart();
  const navigate = useNavigate();
  const total = getCartTotal();

  if (cartItems.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon"><ShoppingCart size={64} /></div>
          <h3>Your cart is empty</h3>
          <p>Upload and configure documents to add them to your cart</p>
          <button className="btn btn-primary" onClick={() => navigate("/print")}>
            <Printer size={16} /> Start Printing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Shopping Cart</h1>
          <p>{cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your cart</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={clearCart}>
          <Trash2 size={14} /> Clear Cart
        </button>
      </div>

      <div className="checkout-layout">
        <div>
          {cartItems.map((item) => {
            const itemTotal = (item.price + (item.bindingCost || 0)) * (item.settings?.copies || 1);
            return (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <div className="cart-item-specs">
                    <div>Pages: {item.pages} · Range: {item.settings?.pageRange || "all"}</div>
                    <div>{getColorTypeText(item.settings?.colorType)} · {getSideTypeText(item.settings?.sideType)}</div>
                    <div>Copies: {item.settings?.copies || 1} · Pages/Set: {item.settings?.pagesPerSet || 1}</div>
                    {item.bindingCost > 0 && <div>Binding: {formatCurrency(item.bindingCost)}</div>}
                  </div>
                </div>
                <div className="cart-item-actions">
                  <div className="cart-item-price">{formatCurrency(itemTotal)}</div>
                  <button className="btn btn-sm btn-ghost" onClick={() => removeFromCart(item.id)}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="price-summary order-summary-card">
          <h3>Order Summary</h3>
          {cartItems.map((item) => {
            const itemTotal = (item.price + (item.bindingCost || 0)) * (item.settings?.copies || 1);
            return (
              <div key={item.id} className="price-row" style={{ fontSize: "0.85rem" }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>{item.name}</span>
                <span>{formatCurrency(itemTotal)}</span>
              </div>
            );
          })}
          <div className="price-row total">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <button className="btn btn-primary btn-block btn-lg" onClick={() => navigate("/checkout")}>
              Proceed to Checkout <ArrowRight size={16} />
            </button>
            <button className="btn btn-outline btn-block" onClick={() => navigate("/print")}>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
