import '../styles/globals.css';
import Header from '../components/Header'; // Assuming Header will be in components

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Header />
      <div className="content"> {/* Added a class for potential content styling */}
        <Component {...pageProps} />
      </div>
    </>
  );
}

export default MyApp;
