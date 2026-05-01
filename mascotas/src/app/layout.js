import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "PetMed - Registro de Mascotas",
  description: "Plataforma premium para registro de mascotas y fichas médicas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet' />
      </head>
      <body className={outfit.className}>
        <div className="background-animation">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        {children}
      </body>
    </html>
  );
}
