import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-in">
        <Logo />
        <p className="text-sm text-ink-3">Open source, MIT licence. Built by notnotnotnoone.</p>
      </div>
    </footer>
  );
}
