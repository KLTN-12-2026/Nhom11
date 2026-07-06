import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export const RootLayout = () => (
  <>
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </>
);
