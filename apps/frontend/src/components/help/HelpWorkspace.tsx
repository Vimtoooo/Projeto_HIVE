"use client";
import { useState } from "react";
import Link from "next/link";
import { helpCategories, searchHelp } from "../../data/HelpArticles";
import type { HelpCategory } from "../../data/HelpArticles";
import HomeIcon from "../home/HomeIcon";
import styles from "../../styles/help-page.module.css";
export default function HelpWorkspace() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<HelpCategory | "Todas">("Todas");
  const articles = searchHelp(query, category);
  return (
    <section className={styles.page} aria-labelledby="help-title">
      <header className={styles.heading}>
        <span className={styles.eyebrow}>UM CAMINHO PARA CADA DÚVIDA</span>
        <h1 id="help-title">
          <HomeIcon name="help" /> Central de Ajuda
        </h1>
        <p>Encontre orientações para aproveitar o seu HIVE.</p>
      </header>
      <div className={styles.search}>
        <label htmlFor="help-search">Qual é a sua dúvida?</label>
        <div>
          <HomeIcon name="search" />
          <input
            id="help-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busque por conta, cancelamento, mensagens…"
          />
        </div>
      </div>
      <div className={styles.panels}>
        <aside className={styles.categories} aria-label="Categorias de ajuda">
          <h2>Explore por assunto</h2>
          <div role="group" aria-label="Filtrar por assunto">
            {(["Todas", ...helpCategories] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
                <HomeIcon name="chevron" size={16} />
              </button>
            ))}
          </div>
          <p>
            Guias sobre o que já está disponível no aplicativo. Não há abertura
            de chamados ou atendimento humano por esta página.
          </p>
        </aside>
        <div className={styles.results}>
          <div className={styles.resultsHeading}>
            <h2>{category === "Todas" ? "Como podemos ajudar?" : category}</h2>
            <p role="status">
              {articles.length}{" "}
              {articles.length === 1
                ? "artigo encontrado"
                : "artigos encontrados"}
            </p>
          </div>
          <div key={`${category}:${query}`}>
            {articles.map((article) => (
              <details key={article.id} className={styles.article}>
                <summary>
                  {article.title}
                  <HomeIcon name="chevron" size={18} />
                </summary>
                <div className={styles.answer}>
                  <span className={styles.eyebrow}>{article.category}</span>
                  {article.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <Link href={article.link.href}>
                    {article.link.label}
                    <HomeIcon name="arrow" size={17} />
                  </Link>
                </div>
              </details>
            ))}
          </div>
          {articles.length === 0 && (
            <div className={styles.empty}>
              <HomeIcon name="search" size={30} />
              <h3>Nenhum artigo encontrado</h3>
              <p>Tente outra palavra ou consulte todos os assuntos.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("Todas");
                }}
              >
                Limpar busca e filtros
              </button>
            </div>
          )}
          <p className={styles.note}>
            <HomeIcon name="help" size={20} /> As telas da sua conta exigem
            login. Consultar estes guias não altera pedidos, mensagens ou dados
            pessoais.
          </p>
        </div>
      </div>
    </section>
  );
}
