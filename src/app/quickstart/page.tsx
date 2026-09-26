import type { Metadata } from "next";

export const metadata: Metadata = { title: "flexrouter quickstart" };

export default function Quickstart() {
  return (
    <main className="wrap py-24">
      <h1 className="section-title">
        <span className="slashes">{"//"}</span>quickstart
      </h1>
    </main>
  );
}
