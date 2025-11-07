import {
  IoCalendarOutline,
  IoBookOutline,
  IoPencilOutline,
} from "react-icons/io5";
import Container from "../components/Container";
import Breadcrumbs from "../components/Breadcrumbs";

const Blog = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Container className="py-8">
        <Breadcrumbs currentPage="Blog" />

        <div className="max-w-4xl mx-auto text-center">
          {/* Header: Coming Soon */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-900 rounded-full mb-6">
              <IoBookOutline className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Blog Sắp Ra Mắt
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Chúng tôi đang nỗ lực để mang đến cho bạn những nội dung tuyệt vời về
              thời trang, lời khuyên phong cách và xu hướng mới nhất. Hãy đón chờ nhé!
            </p>
          </div>

          {/* Phần giới thiệu các chuyên mục */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <IoPencilOutline className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hướng Dẫn Phong Cách
              </h3>
              <p className="text-gray-600">
                Lời khuyên thời trang chuyên nghiệp và các gợi ý phong cách giúp bạn 
                luôn tự tin và nổi bật.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <IoCalendarOutline className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Xu Hướng Theo Mùa
              </h3>
              <p className="text-gray-600">
                Cập nhật các xu hướng thời trang mới nhất và
                bộ sưu tập nổi bật mỗi mùa.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-md">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <IoBookOutline className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Câu Chuyện Thương Hiệu
              </h3>
              <p className="text-gray-600">
                Khám phá câu chuyện phía sau các thương hiệu và nhà thiết kế yêu thích của bạn.
              </p>
            </div>
          </div>

          {/* Các bài viết sắp ra mắt */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Những Bài Viết Sắp Xuất Hiện
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bài viết 1 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden opacity-75">
                <div className="h-48 bg-gradient-to-r from-pink-400 to-purple-600"></div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <IoCalendarOutline className="w-4 h-4 mr-1" />
                    Sắp Ra Mắt
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    10 Món Đồ Thời Trang Cần Có Cho Mọi Mùa
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Khám phá những món đồ thời trang thiết yếu giúp bạn
                    luôn phong cách quanh năm...
                  </p>
                </div>
              </div>

              {/* Bài viết 2 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden opacity-75">
                <div className="h-48 bg-gradient-to-r from-blue-400 to-teal-600"></div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <IoCalendarOutline className="w-4 h-4 mr-1" />
                    Sắp Ra Mắt
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Cách Xây Dựng Tủ Đồ Cơ Bản Tiết Kiệm
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Học cách tạo một tủ quần áo linh hoạt và thời trang mà
                    không tốn quá nhiều chi phí...
                  </p>
                </div>
              </div>

              {/* Bài viết 3 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden opacity-75">
                <div className="h-48 bg-gradient-to-r from-yellow-400 to-orange-600"></div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <IoCalendarOutline className="w-4 h-4 mr-1" />
                    Sắp Ra Mắt
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Thời Trang Bền Vững: Lựa Chọn Thân Thiện Với Môi Trường
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Khám phá cách lựa chọn thời trang bền vững —
                    vừa đẹp vừa bảo vệ hành tinh...
                  </p>
                </div>
              </div>

              {/* Bài viết 4 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden opacity-75">
                <div className="h-48 bg-gradient-to-r from-green-400 to-blue-600"></div>
                <div className="p-6">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <IoCalendarOutline className="w-4 h-4 mr-1" />
                    Sắp Ra Mắt
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Bí Quyết Phối Đồ Từ Chuyên Gia Thời Trang
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Nhận những mẹo phối đồ từ các stylist chuyên nghiệp để
                    nâng tầm phong cách hằng ngày của bạn...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Đăng ký nhận tin */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Đăng Ký Nhận Thông Báo
            </h2>
            <p className="text-gray-600 mb-6">
              Hãy nhập email của bạn để nhận thông báo khi blog chính thức ra mắt
              và cập nhật các nội dung thời trang độc quyền.
            </p>
            <div className="flex flex-col sm:flex-row max-w-md mx-auto gap-4">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              <button className="bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors duration-200">
                Đăng Ký
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Chúng tôi tôn trọng quyền riêng tư của bạn. Bạn có thể hủy đăng ký bất kỳ lúc nào.
            </p>
          </div>

          {/* Quay lại mua sắm */}
          <div className="mt-12">
            <p className="text-gray-600 mb-4">
              Trong khi chờ đợi, hãy khám phá các sản phẩm mới nhất của chúng tôi nhé!
            </p>
            <a
              href="/shop"
              className="inline-block bg-gray-900 text-white px-8 py-3 rounded-md hover:bg-gray-800 transition-colors duration-200"
            >
              Mua Sắm Ngay
            </a>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Blog;
