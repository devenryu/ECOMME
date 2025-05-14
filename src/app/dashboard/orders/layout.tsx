import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Orders Management",
  description: "View and manage your orders",
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
} 