import styles from './App.module.css';

export default function App() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.title}>NexoraPOS Admin</div>
      </header>
      <main className={styles.mainContent}>
        <div className={styles.card}>
          <h2>Welcome to NexoraPOS Admin Dashboard</h2>
          <p className={styles.subtitle}>
            Client-side SPA built with React, Vite, TypeScript, and CSS Modules.
          </p>
        </div>
      </main>
    </div>
  );
}
