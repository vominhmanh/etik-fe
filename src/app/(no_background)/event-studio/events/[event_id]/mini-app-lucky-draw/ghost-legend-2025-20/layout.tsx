import { CircularProgress, Stack, Typography } from "@mui/material";
import { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (

    <div className="cambria-font">
      <Suspense fallback={<FallbackUI />}>
        {children}
      </Suspense>
    </div>

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
