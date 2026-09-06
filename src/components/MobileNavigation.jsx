export default function MobileNavigation({ scanner }) {
  return <nav className="mobile-navigation" aria-label="모바일 하단 내비게이션">
    <a href="/" aria-current={!scanner ? 'page' : undefined}>시장 캡처</a>
    <a href="/scanner" aria-current={scanner ? 'page' : undefined}>미국시장 스캐너</a>
  </nav>
}
