"use client";
import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { professionals } from "../../data/DemoProfessionals";
import {
  filterProfessionals,
  firstName,
  initials,
  money,
  sortProfessionals,
} from "../../lib/HomeCatalog";
import {
  VIEWER_KEY,
  favoriteKey,
  forgetViewer,
  parseFavorites,
  parseViewer,
  readStored,
  subscribeViewer,
  writeStored,
} from "../../lib/ViewerStore";
import type { Professional, Profession, SortMode } from "../../types/HomeTypes";
import HomeIcon from "./HomeIcon";
import type { IconName } from "./HomeIcon";
import HomeDialog from "./HomeDialog";
import ProfessionalCard from "./ProfessionalCard";
import styles from "../../styles/home-page.module.css";
const serverSnapshot = () => "";
const viewerSnapshot = () => readStored(VIEWER_KEY);
const categories: { label: Profession; icon: IconName }[] = [
  { label: "Elétrica", icon: "bolt" },
  { label: "Hidráulica", icon: "water" },
  { label: "Limpeza", icon: "sparkle" },
  { label: "Pintura", icon: "paint" },
  { label: "Reparos", icon: "wrench" },
  { label: "Jardinagem", icon: "leaf" },
  { label: "Beleza", icon: "heart" },
  { label: "Aulas", icon: "book" },
];
const sections: {
  title: string;
  subtitle: string;
  mode: SortMode;
  icon: IconName;
}[] = [
  {
    title: "Perto de você",
    subtitle: "Um bom profissional pode estar logo ao lado.",
    mode: "nearby",
    icon: "location",
  },
  {
    title: "Mais avaliados",
    subtitle: "Cuidado e qualidade que fazem a diferença.",
    mode: "rating",
    icon: "star",
  },
  {
    title: "Mais populares",
    subtitle: "Os queridinhos da nossa comunidade.",
    mode: "popular",
    icon: "users",
  },
];
const future: { label: string; icon: IconName; description: string }[] = [
  {
    label: "Mensagens",
    icon: "message",
    description:
      "A conversa com profissionais estará disponível em uma próxima etapa. Nenhuma mensagem foi enviada.",
  },
  {
    label: "Minhas solicitações",
    icon: "clipboard",
    description:
      "Aqui você poderá acompanhar seus pedidos. A contratação ainda não está disponível nesta demonstração.",
  },
  {
    label: "Notificações",
    icon: "bell",
    description:
      "Os avisos sobre suas solicitações aparecerão aqui quando essa funcionalidade for implementada.",
  },
];
export default function HomeDashboard() {
  const router = useRouter();
  const rawViewer = useSyncExternalStore(
    subscribeViewer,
    viewerSnapshot,
    serverSnapshot,
  );
  const viewer = useMemo(() => parseViewer(rawViewer), [rawViewer]);
  const key = favoriteKey(viewer);
  const rawFavorites = useSyncExternalStore(
    subscribeViewer,
    () => readStored(key),
    serverSnapshot,
  );
  const favorites = useMemo(
    () =>
      parseFavorites(rawFavorites).filter((id) =>
        professionals.some((p) => p.id === id),
      ),
    [rawFavorites],
  );
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Profession | null>(null);
  const [allCategories, setAllCategories] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [active, setActive] = useState("Início");
  const [expanded, setExpanded] = useState<SortMode | null>(null);
  const [menu, setMenu] = useState(false);
  const [detail, setDetail] = useState<Professional | null>(null);
  const [notice, setNotice] = useState<{ title: string; text: string } | null>(
    null,
  );
  const [announcement, setAnnouncement] = useState("");
  const results = filterProfessionals(
    professionals,
    query,
    category,
    onlyFavorites ? favorites : undefined,
  );
  const filtering = Boolean(query || category || onlyFavorites);
  function scrollToCatalog() {
    document
      .getElementById("professionals")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function reset() {
    document.getElementById("home-search")?.focus({ preventScroll: true });
    setDraft("");
    setQuery("");
    setCategory(null);
    setOnlyFavorites(false);
    setExpanded(null);
    setActive("Início");
    setMenu(false);
  }
  function toggleFavorite(p: Professional) {
    const saved = favorites.includes(p.id);
    writeStored(
      key,
      JSON.stringify(
        saved ? favorites.filter((id) => id !== p.id) : [...favorites, p.id],
      ),
    );
    setAnnouncement(
      p.name + (saved ? " removido dos favoritos." : " salvo nos favoritos."),
    );
  }
  function notify(title: string, text: string) {
    setMenu(false);
    setNotice({ title, text });
  }
  function nav(label: string) {
    setActive(label);
    setMenu(false);
    if (label === "Início") {
      reset();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (label === "Favoritos") {
      setOnlyFavorites(true);
      setCategory(null);
      setQuery("");
      setDraft("");
      scrollToCatalog();
    } else {
      setOnlyFavorites(false);
      scrollToCatalog();
    }
  }
  function navigation() {
    return (
      <>
        <span className={styles.navLabel}>SEU DIA, MAIS FÁCIL</span>
        <nav aria-label="Navegação principal" className={styles.navigation}>
          {[
            { label: "Início", icon: "home" as const },
            { label: "Profissionais", icon: "users" as const },
          ].map((item) => (
            <button
              type="button"
              key={item.label}
              className={active === item.label ? styles.active : ""}
              aria-current={active === item.label ? "page" : undefined}
              onClick={() => nav(item.label)}
            >
              <HomeIcon name={item.icon} />
              {item.label}
            </button>
          ))}
          {future.slice(0, 1).map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => notify(item.label, item.description)}
            >
              <HomeIcon name={item.icon} />
              {item.label}
              <small>Em breve</small>
            </button>
          ))}
          <button
            type="button"
            onClick={() => nav("Favoritos")}
            className={onlyFavorites ? styles.active : ""}
            aria-pressed={onlyFavorites}
          >
            <HomeIcon name="heart" />
            Favoritos
            {favorites.length > 0 && (
              <span className={styles.count}>{favorites.length}</span>
            )}
          </button>
          {future.slice(1).map((item) => (
            <button
              type="button"
              key={item.label}
              onClick={() => notify(item.label, item.description)}
            >
              <HomeIcon name={item.icon} />
              {item.label}
              <small>Em breve</small>
            </button>
          ))}
        </nav>
        <div className={styles.navDivider} />
        <div className={styles.navigation}>
          <button
            type="button"
            onClick={() =>
              notify(
                "Meu perfil",
                viewer
                  ? "Você entrou como " +
                      viewer.name +
                      ". A edição de perfil será disponibilizada em uma próxima etapa."
                  : "Entre na sua conta para ver seu nome nesta área.",
              )
            }
          >
            <HomeIcon name="users" />
            Meu perfil
          </button>
          <button
            type="button"
            onClick={() =>
              notify(
                "Como funciona o HIVE",
                "Explore profissões, busque um serviço e salve seus favoritos. Os perfis desta Home são fictícios; você pode conhecer os detalhes, mas não contratar ou enviar mensagens nesta etapa.",
              )
            }
          >
            <HomeIcon name="help" />
            Central de ajuda
          </button>
        </div>
      </>
    );
  }
  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skip}>
        Pular para o conteúdo
      </a>
      <aside className={styles.sidebar}>
        <Link href="/home" className={styles.brand}>
          <Image
            src="/images/hive-logo.png"
            width={44}
            height={75}
            alt=""
            unoptimized
          />
          <span>
            HIVE<span className={styles.brandDot}>.</span>
          </span>
        </Link>
        {navigation()}
        <div className={styles.joinCard}>
          <span className={styles.joinIcon}>
            <HomeIcon name="wrench" />
          </span>
          <h3>
            Seu talento tem
            <br />
            lugar aqui.
          </h3>
          <p>Faça parte da comunidade de profissionais HIVE.</p>
          <button
            type="button"
            onClick={() =>
              notify(
                "Seja um profissional HIVE",
                "O cadastro de prestadores pela interface será desenvolvido em uma próxima etapa. Por enquanto, explore os perfis de demonstração.",
              )
            }
          >
            Quero ser profissional <HomeIcon name="arrow" size={16} />
          </button>
        </div>
        <div className={styles.sidebarFooter}>
          <span className={styles.miniHex}>⬡</span> Conectando pessoas.
          <br />
          Simplificando a vida.
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.topLeft}>
            <button
              type="button"
              className={styles.mobileMenu}
              aria-label="Abrir navegação"
              onClick={() => setMenu(true)}
            >
              <HomeIcon name="menu" />
            </button>
            <span className={styles.breadcrumb}>
              Seu espaço <HomeIcon name="chevron" size={13} />
              <strong>Início</strong>
            </span>
          </div>
          <div className={styles.topActions}>
            <span className={styles.demoPill}>
              <span />
              Demonstração
            </span>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Notificações"
              onClick={() => notify("Notificações", future[2].description)}
            >
              <HomeIcon name="bell" />
            </button>
            <div className={styles.topDivider} />
            <button
              type="button"
              className={styles.profileButton}
              onClick={() =>
                notify(
                  "Sua conta",
                  viewer
                    ? "Conta atual: " +
                        viewer.name +
                        ". Seus favoritos ficam salvos apenas nesta aba do navegador."
                    : "Você está explorando como visitante. Faça login para personalizar a saudação.",
                )
              }
            >
              <span className={styles.userAvatar}>
                {initials(viewer?.name ?? "Visitante")}
              </span>
              <span className={styles.profileName}>
                {viewer?.name ?? "Visitante"}
                <small>{viewer ? "Minha conta" : "Explorar o HIVE"}</small>
              </span>
              <HomeIcon name="chevron" size={14} />
            </button>
          </div>
        </header>
        <div className={styles.contentGrid}>
          <main id="main-content" className={styles.main}>
            <div className={styles.greeting}>
              <div>
                <span className={styles.eyebrow}>BEM-VINDO AO SEU HIVE</span>
                <h1>
                  Olá, {viewer ? firstName(viewer.name) : "visitante"}
                  <span>!</span>
                </h1>
                <p>Deixe os pequenos desafios do dia com quem entende.</p>
              </div>
              <span className={styles.location}>
                <HomeIcon name="location" size={17} />
                <span>
                  Osasco, SP<small>Região ilustrativa</small>
                </span>
              </span>
            </div>
            <form
              className={styles.search}
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                setQuery(draft.trim());
                setActive("Profissionais");
                setExpanded(null);
                scrollToCatalog();
              }}
            >
              <HomeIcon name="search" />
              <input
                id="home-search"
                aria-label="Buscar profissionais ou serviços"
                placeholder="De qual serviço você precisa hoje?"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={100}
              />
              <button type="submit">
                Buscar <HomeIcon name="arrow" size={17} />
              </button>
            </form>
            <section className={styles.hero} aria-labelledby="hero-title">
              <div className={styles.heroCopy}>
                <span className={styles.heroTag}>
                  <HomeIcon name="sparkle" size={14} /> MAIS TEMPO PARA O QUE
                  IMPORTA
                </span>
                <h2 id="hero-title">
                  Gente que resolve.
                  <br />
                  Perto de você.
                </h2>
                <p>
                  Encontre o profissional certo e dê vida
                  <br className={styles.desktopBreak} /> aos seus planos.
                </p>
                <button
                  type="button"
                  className={styles.darkButton}
                  onClick={() => nav("Profissionais")}
                >
                  Encontrar profissionais <HomeIcon name="arrow" size={17} />
                </button>
              </div>
              <div className={styles.heroArt} aria-hidden="true">
                <div className={styles.honeycomb} />
                <div className={styles.artTile + " " + styles.artOne}>
                  <HomeIcon name="wrench" size={35} />
                </div>
                <div className={styles.artTile + " " + styles.artTwo}>
                  <HomeIcon name="bolt" size={37} />
                </div>
                <div className={styles.artTile + " " + styles.artThree}>
                  <HomeIcon name="paint" size={29} />
                </div>
                <div className={styles.artCaption}>
                  <span>
                    <HomeIcon name="check" size={15} />
                  </span>
                  Uma mãozinha faz a diferença.
                </div>
              </div>
            </section>
            <section
              className={styles.categorySection}
              aria-labelledby="category-title"
            >
              <div className={styles.sectionHeading}>
                <div>
                  <h2 id="category-title">O que você precisa?</h2>
                  <p>Encontre ajuda por profissão.</p>
                </div>
                <button
                  type="button"
                  className={styles.textButton}
                  aria-expanded={allCategories}
                  onClick={() => setAllCategories(!allCategories)}
                >
                  {allCategories ? "Ver menos" : "Todas as categorias"}
                  <HomeIcon name="chevron" size={15} />
                </button>
              </div>
              <div className={styles.categories}>
                {(allCategories ? categories : categories.slice(0, 6)).map(
                  (item) => (
                    <button
                      type="button"
                      key={item.label}
                      className={
                        category === item.label ? styles.selectedCategory : ""
                      }
                      aria-pressed={category === item.label}
                      onClick={() => {
                        setCategory(
                          category === item.label ? null : item.label,
                        );
                        setActive("Profissionais");
                        setExpanded(null);
                      }}
                    >
                      <span>
                        <HomeIcon name={item.icon} size={24} />
                      </span>
                      {item.label}
                    </button>
                  ),
                )}
              </div>
            </section>
            <div id="professionals" className={styles.catalog}>
              <div className={styles.catalogNote}>
                <span>
                  <HomeIcon name="shield" size={15} /> Perfis, valores,
                  avaliações e distâncias fictícios para demonstração.
                </span>
                {filtering && (
                  <button type="button" onClick={reset}>
                    Limpar filtros
                  </button>
                )}
              </div>
              {filtering && (
                <p className={styles.resultCount} role="status">
                  {results.length}{" "}
                  {results.length === 1
                    ? "profissional encontrado"
                    : "profissionais encontrados"}
                  {query ? " para “" + query + "”" : ""}
                  {category ? " · " + category : ""}
                  {onlyFavorites ? " · Favoritos" : ""}
                </p>
              )}
              {results.length === 0 ? (
                <div className={styles.empty}>
                  <span>
                    <HomeIcon
                      name={onlyFavorites ? "heart" : "search"}
                      size={32}
                    />
                  </span>
                  <h2>
                    {onlyFavorites
                      ? "Seus favoritos começam aqui"
                      : "Nenhum profissional encontrado"}
                  </h2>
                  <p>
                    {onlyFavorites
                      ? "Toque no coração de um perfil para encontrá-lo aqui depois."
                      : "Tente outro nome, serviço ou profissão. Você também pode limpar os filtros."}
                  </p>
                  <button
                    type="button"
                    className={styles.darkButton}
                    onClick={reset}
                  >
                    Explorar profissionais <HomeIcon name="arrow" size={16} />
                  </button>
                </div>
              ) : (
                sections.map((section) => (
                  <section
                    className={styles.providerSection}
                    key={section.mode}
                    aria-labelledby={"heading-" + section.mode}
                  >
                    <div className={styles.sectionHeading}>
                      <div>
                        <h2 id={"heading-" + section.mode}>
                          <HomeIcon name={section.icon} size={20} />
                          {section.title}
                        </h2>
                        <p>{section.subtitle}</p>
                      </div>
                      <button
                        type="button"
                        className={styles.textButton}
                        aria-expanded={expanded === section.mode}
                        aria-label={
                          (expanded === section.mode
                            ? "Ver menos: "
                            : "Ver todos: ") + section.title
                        }
                        onClick={() =>
                          setExpanded(
                            expanded === section.mode ? null : section.mode,
                          )
                        }
                      >
                        {expanded === section.mode ? "Ver menos" : "Ver todos"}
                        <HomeIcon name="arrow" size={16} />
                      </button>
                    </div>
                    <div className={styles.cards}>
                      {sortProfessionals(results, section.mode)
                        .slice(0, expanded === section.mode ? undefined : 3)
                        .map((p) => (
                          <ProfessionalCard
                            key={p.id}
                            professional={p}
                            saved={favorites.includes(p.id)}
                            onSave={() => toggleFavorite(p)}
                            onDetails={() => setDetail(p)}
                          />
                        ))}
                    </div>
                  </section>
                ))
              )}
            </div>
            <footer className={styles.mainFooter}>
              <span>HIVE · Conexões que fazem a diferença.</span>
              <button
                type="button"
                onClick={() =>
                  notify(
                    "Sobre esta demonstração",
                    "Projeto interdisciplinar HIVE. Os profissionais exibidos são fictícios. Distâncias não utilizam sua localização e nenhum orçamento ou contratação é enviado.",
                  )
                }
              >
                Sobre a demonstração <HomeIcon name="arrow" size={14} />
              </button>
            </footer>
          </main>
          <aside className={styles.rightRail} aria-label="Seu espaço no HIVE">
            <div className={styles.communityCard}>
              <div className={styles.communityIcon}>
                <HomeIcon name="home" size={25} />
              </div>
              <span className={styles.eyebrow}>BOM TER VOCÊ POR AQUI</span>
              <h2>
                Uma comunidade.
                <br />
                Muitas soluções.
              </h2>
              <p>
                Pessoas com talentos diferentes, prontas para facilitar o seu
                dia.
              </p>
              <div className={styles.stackedAvatars}>
                <span className={styles.gold}>RM</span>
                <span className={styles.sage}>CS</span>
                <span className={styles.blue}>MO</span>
                <span>+6</span>
              </div>
              <small>Conheça os perfis de demonstração</small>
            </div>
            <div className={styles.savedPanel}>
              <div>
                <span className={styles.outlineIcon}>
                  <HomeIcon name="heart" />
                </span>
                <span>
                  <strong>Seus favoritos</strong>
                  <small>
                    {favorites.length}{" "}
                    {favorites.length === 1
                      ? "profissional salvo"
                      : "profissionais salvos"}
                  </small>
                </span>
              </div>
              <p>Gostou de um perfil? Salve para encontrar com facilidade.</p>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => nav("Favoritos")}
              >
                Ver meus favoritos <HomeIcon name="arrow" size={16} />
              </button>
            </div>
            <section className={styles.steps}>
              <h3>Encontrar ajuda é simples</h3>
              {[
                ["Explore", "Escolha a profissão que precisa."],
                ["Conheça", "Veja os detalhes de cada perfil."],
                ["Salve", "Guarde seus favoritos para depois."],
              ].map(([title, text], index) => (
                <div key={title}>
                  <span>{index + 1}</span>
                  <p>
                    <strong>{title}</strong>
                    {text}
                  </p>
                </div>
              ))}
            </section>
            <div className={styles.helpCard}>
              <HomeIcon name="help" size={23} />
              <h3>Podemos ajudar?</h3>
              <p>Conheça o que já é possível explorar no HIVE.</p>
              <button
                type="button"
                onClick={() =>
                  notify(
                    "Como funciona o HIVE",
                    "Busque por profissão ou serviço, filtre as categorias, veja detalhes e salve favoritos. A contratação e as mensagens estarão disponíveis em uma próxima etapa.",
                  )
                }
              >
                Como funciona <HomeIcon name="arrow" size={15} />
              </button>
            </div>
            <div className={styles.sessionAction}>
              {viewer ? (
                <button
                  type="button"
                  onClick={() => {
                    forgetViewer();
                    router.push("/login");
                  }}
                >
                  <HomeIcon name="exit" size={17} />
                  Sair da conta
                </button>
              ) : (
                <Link href="/login">
                  <HomeIcon name="exit" size={17} />
                  Entrar na minha conta
                </Link>
              )}
            </div>
          </aside>
        </div>
        <div className={styles.mobileAccount}>
          {viewer ? (
            <button
              type="button"
              onClick={() => {
                forgetViewer();
                router.push("/login");
              }}
            >
              <HomeIcon name="exit" size={16} /> Sair da conta
            </button>
          ) : (
            <Link href="/login">Entrar na minha conta</Link>
          )}
        </div>
      </div>
      <span className={styles.srOnly} role="status">
        {announcement}
      </span>
      {menu && (
        <HomeDialog title="Navegação" onDismiss={() => setMenu(false)}>
          {navigation()}
        </HomeDialog>
      )}
      {notice && (
        <HomeDialog title={notice.title} onDismiss={() => setNotice(null)}>
          <p className={styles.dialogText}>{notice.text}</p>
          <button
            type="button"
            className={styles.darkButton}
            onClick={() => setNotice(null)}
          >
            Entendi <HomeIcon name="check" size={16} />
          </button>
        </HomeDialog>
      )}
      {detail && (
        <HomeDialog
          title="Conheça o profissional"
          onDismiss={() => setDetail(null)}
        >
          <span className={styles.demoPill}>Perfil fictício</span>
          <div className={styles.detailIdentity}>
            <span className={styles.avatar + " " + styles[detail.color]}>
              {detail.initials}
            </span>
            <div>
              <h3>{detail.name}</h3>
              <p>{detail.profession}</p>
            </div>
          </div>
          <p className={styles.dialogText}>{detail.description}</p>
          <div className={styles.detailFacts}>
            <span>
              <HomeIcon name="star" />
              {detail.rating.toFixed(1).replace(".", ",")} · {detail.reviews}{" "}
              avaliações
            </span>
            <span>
              <HomeIcon name="location" />
              {detail.distance.toFixed(1).replace(".", ",")} km · distância
              ilustrativa
            </span>
            <span>
              <HomeIcon name="clipboard" />
              {detail.jobs} serviços · dado fictício
            </span>
          </div>
          <p className={styles.detailPrice}>
            A partir de <strong>{money(detail.price)}</strong>
            <small>Valor ilustrativo, sem orçamento ou cobrança.</small>
          </p>
          <button
            type="button"
            className={styles.darkButton}
            onClick={() => toggleFavorite(detail)}
          >
            <HomeIcon name="heart" size={17} />
            {favorites.includes(detail.id)
              ? "Remover dos favoritos"
              : "Salvar nos favoritos"}
          </button>
          <p className={styles.detailNote}>
            Contratação e mensagens estarão disponíveis em uma próxima etapa.
          </p>
        </HomeDialog>
      )}
    </div>
  );
}
