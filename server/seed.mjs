// server/seed.mjs
import dotenv from 'dotenv';
import connectDB from './config/mongodb.js';
import Product from './models/productModel.js';
import Category from './models/categoryModel.js';
import Brand from './models/brandModel.js';
import Contact from './models/contactModel.js';
import User from './models/userModel.js';

dotenv.config();
await connectDB();

// =============================
// DỮ LIỆU MẪU – ẢNH TỪ UNSPLASH + WIKIMEDIA (KHÔNG CẦN CLOUDINARY)
// =============================

const categoriesData = [
  {
    name: "Áo",
    slug: "ao",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=400"
  },
  {
    name: "Quần",
    slug: "quan",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad23f2e3d?auto=format&fit=crop&w=400"
  },
  {
    name: "Giày",
    slug: "giay",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400"
  },
  {
    name: "Phụ kiện",
    slug: "phu-kien",
    image: "https://images.unsplash.com/photo-1575116677642-2d8ea2261132?auto=format&fit=crop&w=400"
  },
  {
    name: "Đồ thể thao",
    slug: "do-the-thao",
    image: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=400"
  },
  {
    name: "Đồ mùa đông",
    slug: "do-mua-dong",
    image: "https://images.unsplash.com/photo-1578357628143-0f139c3fa54a?auto=format&fit=crop&w=400"
  }
];

const brandsData = [
  {
    name: "Nike",
    slug: "nike",
    image: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_Nike.svg"
  },
  {
    name: "Adidas",
    slug: "adidas",
    image: "https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg"
  },
  {
    name: "Uniqlo",
    slug: "uniqlo",
    image: "https://upload.wikimedia.org/wikipedia/en/3/3e/Uniqlo_logo.png"
  },
  {
    name: "Zara",
    slug: "zara",
    image: "https://upload.wikimedia.org/wikipedia/en/8/8c/Zara_logo.svg"
  },
  {
    name: "H&M",
    slug: "hm",
    image: "https://upload.wikimedia.org/wikipedia/commons/4/46/H%26M-Logo.svg"
  }
];

const productsData = [
  {
    name: "Áo thun cotton cơ bản",
    slug: "ao-thun-cotton-co-ban",
    description: "Chất vải mềm mịn, thấm hút mồ hôi tốt, phù hợp mặc hàng ngày.",
    price: 250000,
    quantity: 100,
    sold: 24,
    shipping: true,
    images: ["https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600"],
    category: "Áo",
    brand: "Uniqlo"
  },
  {
    name: "Áo khoác gió nam",
    slug: "ao-khoac-gio-nam",
    description: "Chống nước nhẹ, nhẹ nhàng, thích hợp đi chơi hoặc đi làm.",
    price: 550000,
    quantity: 50,
    sold: 12,
    shipping: true,
    images: ["https://images.unsplash.com/photo-1578357628143-0f139c3fa54a?auto=format&fit=crop&w=600"],
    category: "Áo",
    brand: "Nike"
  },
  {
    name: "Quần jeans slim fit",
    slug: "quan-jeans-slim-fit",
    description: "Chất denim co giãn 4 chiều, ôm dáng nhưng không gò bó.",
    price: 650000,
    quantity: 80,
    sold: 35,
    shipping: true,
    images: ["https://images.unsplash.com/photo-1541099649105-f69ad23f2e3d?auto=format&fit=crop&w=600"],
    category: "Quần",
    brand: "Zara"
  },
  {
    name: "Quần jogger thể thao",
    slug: "quan-jogger-the-thao",
    description: "Thoải mái, co giãn, lý tưởng cho tập gym hoặc đi chơi.",
    price: 420000,
    quantity: 70,
    sold: 18,
    shipping: true,
    images: ["https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=600"],
    category: "Quần",
    brand: "Adidas"
  },
  {
    name: "Giày thể thao chạy bộ",
    slug: "giay-the-thao-chay-bo",
    description: "Đệm êm, nhẹ, hỗ trợ tốt cho người chạy bộ.",
    price: 1200000,
    quantity: 30,
    sold: 9,
    shipping: true,
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=600"],
    category: "Giày",
    brand: "Nike"
  },
  {
    name: "Giày sneaker casual",
    slug: "giay-sneaker-casual",
    description: "Thiết kế trẻ trung, phù hợp phối đồ hàng ngày.",
    price: 950000,
    quantity: 40,
    sold: 22,
    shipping: true,
    images: ["https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=600"],
    category: "Giày",
    brand: "Adidas"
  },
  {
    name: "Mũ lưỡi trai",
    slug: "mu-luoi-trai",
    description: "Chất vải bền, form cứng cáp, logo thêu tinh tế.",
    price: 180000,
    quantity: 120,
    sold: 45,
    shipping: true,
    images: ["https://images.unsplash.com/photo-1575116677642-2d8ea2261132?auto=format&fit=crop&w=600"],
    category: "Phụ kiện",
    brand: "Nike"
  },
  {
    name: "Túi đeo chéo nhỏ",
    slug: "tui-deo-cheo-nho",
    description: "Gọn nhẹ, nhiều ngăn, phù hợp đi chơi hoặc đi học.",
    price: 320000,
    quantity: 60,
    sold: 31,
    shipping: true,
    images: ["https://images.unsplash.com/photo-1585568009818-5a44d0db7e33?auto=format&fit=crop&w=600"],
    category: "Phụ kiện",
    brand: "H&M"
  },
  {
    name: "Áo thun thể thao khô nhanh",
    slug: "ao-thun-the-thao-kho-nhanh",
    description: "Công nghệ thấm hút mồ hôi, khô nhanh, dành cho vận động.",
    price: 380000,
    quantity: 90,
    sold: 15,
    shipping: true,
    images: ["https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=600"],
    category: "Đồ thể thao",
    brand: "Adidas"
  },
  {
    name: "Quần short thể thao",
    slug: "quan-short-the-thao",
    description: "Thoải mái, co giãn, lý tưởng cho tập luyện.",
    price: 350000,
    quantity: 85,
    sold: 28,
    shipping: true,
    images: ["https://images.unsplash.com/photo-1589003077984-894e133e5a00?auto=format&fit=crop&w=600"],
    category: "Đồ thể thao",
    brand: "Nike"
  },
  {
    name: "Áo len cổ lọ",
    slug: "ao-len-co-lo",
    description: "Giữ ấm tốt, chất len mềm, không gây ngứa.",
    price: 680000,
    quantity: 40,
    sold: 7,
    shipping: true,
    images: ["https://images.unsplash.com/photo-1578357628143-0f139c3fa54a?auto=format&fit=crop&w=600"],
    category: "Đồ mùa đông",
    brand: "Uniqlo"
  },
  {
    name: "Áo khoác len dáng rộng",
    slug: "ao-khoac-len-dang-rong",
    description: "Phong cách Hàn Quốc, giữ ấm và thời thượng.",
    price: 890000,
    quantity: 35,
    sold: 5,
    shipping: true,
    images: ["https://images.unsplash.com/photo-1529374255404-31166e3099d4?auto=format&fit=crop&w=600"],
    category: "Đồ mùa đông",
    brand: "Zara"
  }
];

// =============================
// HÀM SEED
// =============================

const seedDatabase = async () => {
  try {
    console.log('🧹 Đang xóa dữ liệu cũ...');
    await Product.deleteMany();
    await Category.deleteMany();
    await Brand.deleteMany();
    await Contact.deleteMany();
    await User.deleteMany({ email: { $regex: /test\.com$/i } });

    console.log('📥 Tạo danh mục...');
    await Category.insertMany(categoriesData);

    console.log('📥 Tạo thương hiệu...');
    await Brand.insertMany(brandsData);

    console.log('📥 Tạo sản phẩm...');
    // Trong OrebisShopping, product.category và product.brand thường là STRING (tên), KHÔNG phải ObjectId
    await Product.insertMany(productsData.map(p => ({
      ...p,
      isAvailable: true,
      stock: p.quantity || 0
    })));

    console.log('📥 Tạo user mẫu...');
    const user = await User.create({
      name: "Người dùng Test",
      email: "user@test.com",
      password: "$2b$10$8vK1KzUqJ3vGJxZ1v2u3eO4r5t6y7u8i9o0pQWERTYUIOP", // mật khẩu giả (đã hash)
      role: "user",
      isActive: true
    });

    console.log('📥 Tạo contact mẫu...');
    await Contact.insertMany([
      {
        name: "Nguyễn Văn A",
        email: "vana@test.com",
        subject: "Hỏi về đổi trả",
        message: "Tôi muốn đổi size áo, có được không?",
        userId: user._id
      },
      {
        name: "Trần Thị B",
        email: "thib@test.com",
        subject: "Vấn đề thanh toán",
        message: "Tôi không thể thanh toán bằng thẻ Visa.",
        userId: user._id
      }
    ]);

    console.log('✅ Seed thành công!');
    console.log(`- ${categoriesData.length} danh mục`);
    console.log(`- ${brandsData.length} thương hiệu`);
    console.log(`- ${productsData.length} sản phẩm`);
    console.log(`- 1 user + 2 contact`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi seed:', error);
    process.exit(1);
  }
};

await seedDatabase();