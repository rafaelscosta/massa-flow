import Link from 'next/link';
import styles from '../styles/Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/" legacyBehavior>
          <a className={styles.logo}>MassaFlow</a>
        </Link>
        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <Link href="/" legacyBehavior>
              <a>Painel</a>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/integrations" legacyBehavior>
              <a>Minhas Ferramentas</a>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/automations" legacyBehavior>
              <a>Rotinas</a>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
