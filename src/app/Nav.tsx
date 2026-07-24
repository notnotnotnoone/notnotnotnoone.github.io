import Link from "next/link";

export default function Nav() {
  return (
    <nav>
      <div className="nav-in">
        <Link className="brand" href="/">
          <span className="mark" />
          notnotnotnoone
        </Link>
        <div className="nav-links">
          <Link href="/#flexrouter">flexrouter</Link>
          <Link href="/quickstart">quickstart</Link>
          <Link href="/#demo">demo</Link>
          <Link href="/#agora">agora</Link>
          <a className="gh" href="https://github.com/notnotnotnoone">
            github ↗
          </a>
        </div>
      </div>
    </nav>
  );
}
