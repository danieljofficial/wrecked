import { FC } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import Providers from "./providers";
import { Toaster } from "sonner";

const App: FC = () => {
  return (
    <Providers>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        duration={4000}
        toastOptions={{
          style: {
            background: "#002E5D",
            color: "#F6F7F8",
            border: "1px solid #FDDA24",
            fontFamily: "Inter, sans-serif",
            fontSize: "14px",
          },
        }}
      />
    </Providers>
  );
};

export default App;
