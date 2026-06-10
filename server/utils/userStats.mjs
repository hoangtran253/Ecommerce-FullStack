import userModel from "../models/userModel.js";

/** Khách hàng = user đã tạo tài khoản (role user), giống bộ lọc Quản lý người dùng */
export const REGISTERED_CUSTOMER_FILTER = { role: "user" };

export const getRegisteredCustomerStats = async ({
  startThisMonth,
  startLastMonth,
} = {}) => {
  const queries = [
    userModel.countDocuments(REGISTERED_CUSTOMER_FILTER),
    userModel
      .find(REGISTERED_CUSTOMER_FILTER)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email avatar createdAt role isActive")
      .lean(),
  ];

  if (startThisMonth) {
    queries.push(
      userModel.countDocuments({
        ...REGISTERED_CUSTOMER_FILTER,
        createdAt: { $gte: startThisMonth },
      }),
      userModel.countDocuments({
        ...REGISTERED_CUSTOMER_FILTER,
        createdAt: { $gte: startLastMonth, $lt: startThisMonth },
      })
    );
  }

  const results = await Promise.all(queries);
  const total = results[0];
  const recent = results[1];
  const thisMonth = results[2] ?? 0;
  const lastMonth = results[3] ?? 0;

  return { total, recent, thisMonth, lastMonth };
};
