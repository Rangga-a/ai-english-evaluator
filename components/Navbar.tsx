import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/writing", label: "Writing" },
  { href: "/speaking", label: "Speaking" },
  { href: "/history", label: "History" },
];

export default function Navbar() {
  return (
    <header className="border-b border-line bg-paper sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight">
          AI English <span className="text-writing">Evaluator</span>
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-full text-sm text-ink-soft hover:text-ink hover:bg-white/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}