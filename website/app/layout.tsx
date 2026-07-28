import React from 'react';

export const metadata = {
  title: 'NexoraPOS Storefront | Online Store',
  description: 'Shop quality products at NexoraPOS online storefront',
};

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fafafa' }}>
        {children}
      </body>
    </html>
  );
}
