// src/types/order.ts

import { Timestamp } from "firebase/firestore";

export interface OrderItemOption {
  size?: string;
  addons?: string[];
  stuffedCrust?: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  options: OrderItemOption;
}

export interface Order {
  source: string;
  id: string;
  status:
    | "Pending"
    | "Confirmed"
    | "In Progress"
    | "Ready for Delivery"
    | "Ready for Pickup"
    | "Out for Delivery"
    | "Completed"
    | "Returned"
    | "Canceled";
  createdAt: Timestamp;
  isDelivery: boolean;
  restaurantId: string;
  clientId?: string; // ID of the client who made the order (if logged in)
  deliveryAddress?: string;
  confirmationCode?: string;
  isReviewed?: boolean;
  items: OrderItem[];
  totalAmount: number;
}