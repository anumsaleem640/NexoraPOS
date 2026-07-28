import React from 'react';

export const metadata = {
  title: 'NexoraPOS Backend API',
  description: 'Centralized Next.js Backend API for NexoraPOS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
