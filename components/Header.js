import Link from 'next/link';
import styles from '../styles/Header.module.css';
import { useState, useEffect } from 'react';

// Hardcoded userId for MVP
const MVP_USER_ID = 'user1';

export default function Header() {
  const [newTaskCount, setNewTaskCount] = useState(0);

  const fetchNewTaskCount = async () => {
    try {
      const response = await fetch(`/api/tasks/count?userId=${MVP_USER_ID}&status=new`);
      if (response.ok) {
        const data = await response.json();
        setNewTaskCount(data.count);
      } else {
        console.error("Failed to fetch new task count:", response.statusText);
        // Optionally set to 0 or handle error in UI
        setNewTaskCount(0); 
      }
    } catch (error) {
      console.error("Error fetching new task count:", error);
      setNewTaskCount(0); // Default to 0 on error
    }
  };

  useEffect(() => {
    fetchNewTaskCount(); // Initial fetch

    // Optional: Poll for new tasks periodically (e.g., every 30 seconds)
    // const intervalId = setInterval(fetchNewTaskCount, 30000);
    // return () => clearInterval(intervalId); // Cleanup on unmount

    // For MVP, we can re-trigger this fetch from other components (e.g. after a task is marked as read)
    // or use a global state/event system if it were more complex.
    // For now, let's add a custom event listener that pages can dispatch.
    
    const handleTaskUpdate = () => {
        console.log("Header: Detected task_updated event. Refetching task count.");
        fetchNewTaskCount();
    };
    window.addEventListener('task_updated', handleTaskUpdate);

    return () => {
        window.removeEventListener('task_updated', handleTaskUpdate);
    };

  }, []);

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
          <li className={styles.navItem}>
            <Link href="/history" legacyBehavior>
              <a>Histórico</a>
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link href="/tasks" legacyBehavior>
              <a className={styles.navLinkWithBadgeContainer}> {/* Container for badge alignment */}
                Minhas Tarefas
                {newTaskCount > 0 && (
                  <span className={styles.taskBadge}>{newTaskCount}</span>
                )}
              </a>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
