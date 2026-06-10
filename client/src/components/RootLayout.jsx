import Header from "./Header";
import AuthBootstrap from "./AuthBootstrap";
import UserCartSync from "./UserCartSync";
import { Outlet, ScrollRestoration } from "react-router-dom";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import "slick-carousel/slick/slick.css";
import { Provider } from "react-redux";
import { persistor, store } from "../redux/store";
import { PersistGate } from "redux-persist/integration/react";
import { Toaster } from "react-hot-toast";
import MainLoader from "./MainLoader";
import ServicesTag from "./ServicesTag";
import ChatWidget from "./ChatWidget";

const RootLayout = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<MainLoader />} persistor={persistor}>
        <AuthBootstrap />
        <UserCartSync />
        <Header />
        <ScrollRestoration />
        <Outlet />
        <ServicesTag />
        <Footer />
        <ChatWidget />
        <ScrollToTop />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#000000",
              color: "#ffffff",
            },
          }}
        />
      </PersistGate>
    </Provider>
  );
};

export default RootLayout;
