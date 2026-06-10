import React from "react";
import NavTitle from "./NavTitle";
import { formatCurrency } from "../PriceFormat";

const Price = () => {
  const priceList = [
    { _id: 950, priceOne: 0, priceTwo: 500000 },
    { _id: 951, priceOne: 500000, priceTwo: 1000000 },
    { _id: 952, priceOne: 1000000, priceTwo: 2000000 },
    { _id: 953, priceOne: 2000000, priceTwo: 4000000 },
    { _id: 954, priceOne: 4000000, priceTwo: 6000000 },
    { _id: 955, priceOne: 6000000, priceTwo: 10000000 },
  ];
  return (
    <div className="cursor-pointer">
      <NavTitle icons={false}>Mua sắm theo giá tiền</NavTitle>
      <div className="font-titleFont">
        <ul className="flex flex-col gap-4 text-sm lg:text-base text-[#767676]">
          {priceList.map((item) => (
            <li
              key={item._id}
              className="border-b-[1px] border-b-[#F0F0F0] pb-2 flex items-center gap-2 hover:text-primeColor hover:border-gray-400 duration-300"
            >
              {formatCurrency(item.priceOne)} - {formatCurrency(item.priceTwo)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Price;
