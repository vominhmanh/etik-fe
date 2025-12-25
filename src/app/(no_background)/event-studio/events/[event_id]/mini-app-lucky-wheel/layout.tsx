import { AuthGuard } from "@/components/auth/auth-guard";
import { CircularProgress, Stack, Typography } from "@mui/material";
import { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Suspense fallback={<FallbackUI />}>

      <AuthGuard>
        <div className="cambria-font">
          {children}
        </div>
      </AuthGuard>
    </Suspense>
  );
}

// 🔹 Beautiful Fallback Component
function FallbackUI() {
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
