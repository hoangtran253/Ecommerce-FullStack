import { useEffect, useState } from "react";
import Slider from "react-slick";
import NextArrow from "../NextArrow";
import PreviousArrow from "../PreviousArrow";
import Title from "../ui/title";
import ProductCard from "../ProductCard";
import { getData } from "../../helpers";
import { config } from "../../../config";

const SanPhamMoi = () => {
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

  const [sanPham, setSanPham] = useState([]);
  const [dangTai, setDangTai] = useState(true);
  const endpoint = `${config?.baseUrl}/api/products?_type=new_arrivals`;

  useEffect(() => {
    const laySanPham = async () => {
      setDangTai(true);
      try {
        const data = await getData(endpoint);
        // Xử lý định dạng phản hồi API mới có trường "success"
        setSanPham(data?.products || []);
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
        setSanPham([]);
      } finally {
        setDangTai(false);
      }
    };
    laySanPham();
  }, []);

  // Giao diện khi đang tải (skeleton loading)
  if (dangTai) {
    return (
      <div className="w-full py-10">
        <div className="flex items-center justify-between">
          <Title className="text-2xl mb-3 font-bold">Sản phẩm mới</Title>
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
        <Title className="text-2xl mb-3 font-bold">Sản phẩm mới</Title>
        {/* <Link to={"/shop"}>Xem tất cả</Link> */}
      </div>

      {/* Hiển thị slider hoặc grid tùy theo số lượng sản phẩm */}
      {sanPham && sanPham.length > 3 ? (
        // Dùng slider nếu có hơn 3 sản phẩm
        <Slider {...settings}>
          {sanPham?.map((item) => (
            <div key={item?._id} className="px-2">
              <ProductCard item={item} />
            </div>
          ))}
        </Slider>
      ) : (
        // Dùng grid nếu có 3 sản phẩm trở xuống
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sanPham?.map((item) => (
            <ProductCard item={item} key={item?._id} />
          ))}
        </div>
      )}

      {/* Hiển thị thông báo khi không có sản phẩm */}
      {(!sanPham || sanPham.length === 0) && (
        <div className="text-center py-8 text-gray-500">
          <p>Hiện chưa có sản phẩm mới nào.</p>
        </div>
      )}
    </div>
  );
};

export default SanPhamMoi;
