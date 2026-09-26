import Link from "next/link";
import { AGORA, GITHUB, STASH } from "@/lib/links";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-in">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-ink-3">Open source, MIT licence. Built by notnotnotnoone.</p>
        </div>
        <ul className="footer-links">
          <li>
            <Link href="/quickstart">Quickstart</Link>
          </li>
          <li>
            <a href={GITHUB}>flexrouter on GitHub</a>
          </li>
          <li>
            <a href={STASH}>stash</a>
          </li>
          <li>
            <a href={AGORA}>agora</a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
