import { Link } from "react-router-dom";
import { productOfTheYear } from "../../assets/images";
import { Button } from "../ui/button";

const ProductOfTheYear = () => {
  return (
    <Link to="/shop" className="group block">
      <div className="w-full h-96 bg-gradient-to-br from-gray-50 to-gray-100 md:bg-transparent relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500">
        <img
          src={productOfTheYear}
          alt="productImage"
          className="w-full h-full object-cover hidden md:inline-block group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="w-full md:w-2/3 xl:w-1/2 h-96 absolute px-6 md:px-8 top-0 right-0 flex flex-col items-start gap-8 justify-center bg-gradient-to-r md:bg-gradient-to-l from-white/95 via-white/90 to-transparent backdrop-blur-sm">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight drop-shadow-sm">
              Sản phẩm của năm
            </h1>
            <p className="text-lg font-medium text-gray-700 max-w-[500px] leading-relaxed">
              Khám phá sản phẩm sáng tạo và được yêu thích nhất của chúng tôi, sản phẩm đã chinh phục trái tim của
người dùng trên toàn thế giới. Trải nghiệm sự hoàn hảo trong từng chi tiết.
            </p>
          </div>
          <Button className="px-8 py-4 text-lg font-semibold bg-black hover:bg-gray-800 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 hover:-translate-y-1 transition-all duration-300">
            Mua ngay
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default ProductOfTheYear;
