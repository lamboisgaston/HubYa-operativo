import { redirect } from "next/navigation";
import WebPublicaPage from "./web-publica/page";

export default function HomePage() {
  if (process.env.NODE_ENV === "development") {
    redirect("/operativo");
  }

  return <WebPublicaPage />;
}
