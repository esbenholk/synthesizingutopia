export const metadata = {
  title: "Remixing Utopias",
  description: "imaging collective futures since 2476",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href={`https://res.cloudinary.com/dmwpm8iiw/image/upload/v1755240875/favicon_muszun.ico`}
          sizes="any"
        />
      </head>

      <body>{children}</body>
    </html>
  );
}
