import type { Metadata } from "next";
import "./globals.css";

import styles from './layout.module.scss'
import { NextIntlClientProvider } from "next-intl";
import Footer from './components/Footer/index'


import { getTranslations } from 'next-intl/server'

export async function generateMetadata(props: any): Promise<Metadata> {
  const { params } = await props;
  const t = await getTranslations({ locale: params.locale, namespace: 'HomePage' })

  return {
    title: t('share_this_loot'),
    description: t('distribute_loot_equally'),
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className={styles.container}>
          <div className={styles.background}></div>
          <NextIntlClientProvider>
            {children}
          </NextIntlClientProvider>
          <Footer/>
        </div>
      </body>
    </html>
  );
}
