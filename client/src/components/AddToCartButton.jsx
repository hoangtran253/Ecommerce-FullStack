import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { addToCart } from "../redux/orebiSlice";
import { cn } from "./ui/cn";
import { syncUserCartToServer } from "../utils/userCart";

const AddToCartButton = ({ item, className }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { products } = useSelector((state) => state.orebiReducer);
  const token = localStorage.getItem("token");
  const [existingProduct, setExistingProduct] = useState(null);
  const [showGoToCart, setShowGoToCart] = useState(false);

  useEffect(() => {
    const availableItem = products.find(
      (product) => product?._id === item?._id
    );

    setExistingProduct(availableItem || null);
  }, [products, item]);

  useEffect(() => {
    // Reset button when on shop page
    if (location.pathname === "/shop") {
      setShowGoToCart(false);
    }
  }, [location.pathname]);

  const handleAddToCart = () => {
    // Check if product is already in cart
    if (existingProduct) {
      // Already in cart, just show go to cart button
      setShowGoToCart(true);
      toast.info("Sản phẩm đã có trong giỏ hàng!");
    } else {
      // Not in cart, add it
      dispatch(addToCart(item));
      toast.success(`${item?.name.substring(0, 10)}... được thêm thành công!`);
      // Sync cart to server if logged in
      if (token) {
        syncUserCartToServer(products, token);
      }
      setShowGoToCart(true);
    }
  };

  const handleGoToCart = () => {
    localStorage.setItem("fromCart", "true");
    navigate("/cart");
  };

  return (
    <>
      {showGoToCart ? (
        <button
          onClick={handleGoToCart}
          className={cn(
            "w-full bg-blue-600 text-white text-xs font-medium py-3 px-6 uppercase tracking-wide hover:bg-blue-700 transition-all duration-200",
            className
          )}
        >
          Đi tới giỏ hàng
        </button>
      ) : (
        <button
          onClick={handleAddToCart}
          className={cn(
            "w-full border border-black text-black text-xs font-medium py-3 px-6 uppercase tracking-wide hover:bg-black hover:text-white transition-all duration-200",
            className
          )}
        >
          Thêm vào giỏ hàng
        </button>
      )}
    </>
  );
};

AddToCartButton.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  className: PropTypes.string,
};

export default AddToCartButton;
