import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL('https://mykarya.digital'),
  title: 'MyKarya | Marketplace eBook Malaysia',
  description: 'Temui Karya, Luaskan Dunia. Temui dan beli eBook daripada penulis Malaysia.',
  openGraph: {
    type: 'website',
    locale: 'ms_MY',
    siteName: 'MyKarya',
    title: 'MyKarya | Marketplace eBook Malaysia',
    description: 'Temui Karya, Luaskan Dunia. Temui dan beli eBook daripada penulis Malaysia.',
  },
};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ms"><body>{children}</body></html>}
