import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lịch sử Booking",
  description: "Xem tất cả các đặt chỗ của người dùng",
};

export default function AllBookingsPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}