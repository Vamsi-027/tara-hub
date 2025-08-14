import { Providers } from "@/components/providers";
import "@/styles/globals.css";

// This is the new root layout for the entire application.
// It should contain only providers and tags that are truly global.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}