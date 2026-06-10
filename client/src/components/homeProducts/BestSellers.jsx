import { useEffect, useState } from "react";
import Slider from "react-slick";
import NextArrow from "../NextArrow";
import PreviousArrow from "../PreviousArrow";
import Title from "../ui/title";
import ProductCard from "../ProductCard";
import { getData } from "../../helpers";
import { config } from "../../../config";

const BestSellers = () => {
  const settings = {
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PreviousArrow />,
    responsive: [
      {
        breakpoint: 1025,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          infinite: true,
        },
      },
      {
        breakpoint: 769,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
          infinite: true,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          infinite: true,
        },
      },
    ],
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  // Sửa endpoint cho đúng API thực tế
  const endpoint = `${config?.baseUrl}/api/products/best_sellers`;

  useEffect(() => {
    const getProducts = async () => {
      setLoading(true);
      try {
        const data = await getData(endpoint);
        setProducts(data?.products || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách sản phẩm bán chạy:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    getProducts();
  }, []);

  // Hiển thị trạng thái tải (loading)
  if (loading) {
    return (
      <div className="w-full py-10">
        <div className="flex items-center justify-between">
          <Title className="text-2xl mb-3 font-bold">Sản phẩm bán chạy</Title>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse"
            >
              <div className="aspect-square bg-gray-200"></div>
              <div className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-10">
      <div className="flex items-center justify-between">
        <Title className="text-2xl mb-3 font-bold">Sản phẩm bán chạy</Title>
        {/* <Link to={"/shop"}>Xem tất cả</Link> */}
      </div>

      {/* Hiển thị slider nếu có nhiều hơn 3 sản phẩm */}
      {products && products.length > 3 ? (
        <Slider {...settings}>
          {products?.map((item) => (
            <div key={item?._id} className="px-2">
              <ProductCard item={item} />
            </div>
          ))}
        </Slider>
      ) : (
        // Hiển thị dạng lưới nếu có 3 hoặc ít hơn sản phẩm
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products?.map((item) => (
            <ProductCard item={item} key={item?._id} />
          ))}
        </div>
      )}

      {/* Hiển thị thông báo khi không có sản phẩm */}
      {(!products || products.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <p>Hiện tại chưa có sản phẩm bán chạy nào.</p>
        </div>
      )}
    </div>
  );
};

export default BestSellers;