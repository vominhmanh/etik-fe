import * as React from "react";
import { Suspense } from "react";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <>
      {/* Import Arima font from Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Arima:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        .arima-font {
          font-family: 'Arima', cursive;
        }
      `}</style>
      <div className="arima-font">
            <AuthGuard>

        <Suspense fallback={<FallbackUI />}>
          {children}
        </Suspense>
        </AuthGuard>

      </div>
        </>
  );
}

// 🔹 Beautiful Fallback Component
function FallbackUI(): React.JSX.Element {
  return (
    <Stack
      height="100vh"
      alignItems="center"
      justifyContent="center"
      spacing={2}
    >
      <CircularProgress size={50} />
      <Typography variant="h6" color="textSecondary">
        Loading, please wait...
      </Typography>
    </Stack>
  );
}
