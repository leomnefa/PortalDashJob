import { useState } from "react";
import { SearchPage } from "./pages/SearchPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";

type Tab = "search" | "applications";

export function App() {
  const [tab, setTab] = useState<Tab>("search");

  return (
    <div className="app">
      <header>
        <h1>remote-job-hub</h1>
        <nav>
          <button className={tab === "search" ? "active" : ""} onClick={() => setTab("search")}>
            Búsqueda
          </button>
          <button className={tab === "applications" ? "active" : ""} onClick={() => setTab("applications")}>
            Postulaciones
          </button>
        </nav>
      </header>
      <main>{tab === "search" ? <SearchPage /> : <ApplicationsPage />}</main>
    </div>
  );
}
