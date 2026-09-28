import styles from "../../styles/home-page.module.css";
export const metadata = { title: "HIVE — Início" };
export default function Page() {
  return (
    <main className={styles.screen}>
      <div className={styles["logo"]} id="logo">
        <p>Logo aqui.</p>
      </div>

      <div className={styles["barra-busca"]} id="barra-busca">
        <p>Barra de busca aqui.</p>
      </div>

      <div className={styles["botoes"]} id="botoes">
        <p>Botões aqui.</p>
      </div>

      <div className={styles["barra-lateral"]} id="barra-lateral">
        <p>Barra lateral aqui.</p>
      </div>

      <div className={styles["painel"]} id="painel">
        <p>Painel aqui.</p>
      </div>

      <div className={styles["painel-adicional"]} id="painel-adicional">
        <p>Painel adicional aqui.</p>
      </div>
    </main>
  );
}
