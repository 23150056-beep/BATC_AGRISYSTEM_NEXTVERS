import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { queryClient } from "./queryClient";
import { router } from "./router";

export function Providers() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand
        duration={4000}
        toastOptions={{
          classNames: {
            toast: "rounded-lg border shadow-md text-sm font-medium",
          },
        }}
      />
    </QueryClientProvider>
  );
}
