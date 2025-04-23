import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <main className="min-h-screen">
      <Component {...pageProps} />
    </main>
  );
}

export default MyApp; 