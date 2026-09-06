import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Telemetria AI - Active Observability & Evaluation Platform",
  description: "Enterprise active observability, telemetry tracing, and LLM evaluation platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
