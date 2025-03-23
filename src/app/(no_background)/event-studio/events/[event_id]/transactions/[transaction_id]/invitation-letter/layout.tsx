export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
      </head>
      <body className="arima-font">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </body>
    </html>
  );
}
