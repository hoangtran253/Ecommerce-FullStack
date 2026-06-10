import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: null,
  products: [],
  orderCount: 0,
};

export const orebiSlice = createSlice({
  name: "orebi",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const payload = action.payload;
      // Generate unique ID based on _id, selectedSize, and selectedColor
      const uniqueId = `${payload._id}-${payload.selectedSize || ''}-${payload.selectedColor || ''}`;
      
      // Check if item with same unique ID exists
      const item = state.products.find((item) => item.cartItemId === uniqueId);
      
      if (item) {
        item.quantity = (item.quantity || 0) + (payload.quantity || 1);
      } else {
        state.products.push({
          ...payload,
          cartItemId: uniqueId,
          quantity: payload.quantity || 1,
        });
      }
    },
    increaseQuantity: (state, action) => {
      const item = state.products.find((item) => item.cartItemId === action.payload);

      if (item) {
        item.quantity = (item.quantity || 0) + 1;
      }
    },
    decreaseQuantity: (state, action) => {
      const item = state.products.find((item) => item.cartItemId === action.payload);

      if (item) {
        const currentQuantity = item.quantity || 1;
        if (currentQuantity === 1) {
          item.quantity = 1;
        } else {
          item.quantity = currentQuantity - 1;
        }
      }
    },
    deleteItem: (state, action) => {
      state.products = state.products.filter(
        (item) => item.cartItemId !== action.payload
      );
    },
    resetCart: (state) => {
      state.products = [];
    },
    setCart: (state, action) => {
      state.products = Array.isArray(action.payload) ? action.payload : [];
    },
    addUser: (state, action) => {
      state.userInfo = action.payload;
    },
    removeUser: (state) => {
      state.userInfo = null;
      state.products = [];
    },
    setOrderCount: (state, action) => {
      state.orderCount = action.payload;
    },
    resetOrderCount: (state) => {
      state.orderCount = 0;
    },
  },
});

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  deleteItem,
  resetCart,
  setCart,
  addUser,
  removeUser,
  setOrderCount,
  resetOrderCount,
} = orebiSlice.actions;
export default orebiSlice.reducer;
