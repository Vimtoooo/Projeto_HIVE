import Link from "next/link";
import HomeIcon from "../home/HomeIcon";
import { initials } from "../../lib/HomeCatalog";
import { requestMoney } from "../../lib/RequestFormatting";
import type {
  ProfessionalSummary,
  Rating,
} from "../../services/ProfessionalsApi";
import styles from "../../styles/professionals-page.module.css";
export function RatingLabel({ rating }: { rating: Rating }) {
  return (
    <span className={styles.rating}>
      <HomeIcon name="star" size={16} />
      {rating.quantidade > 0 && rating.media !== null
        ? `${rating.media.toFixed(1).replace(".", ",")} (${rating.quantidade} avaliações)`
        : "Sem avaliações"}
    </span>
  );
}
export default function ProfessionalCard({
  professional: p,
  selected,
  href,
}: {
  professional: ProfessionalSummary;
  selected: boolean;
  href: string;
}) {
  return (
    <article className={`${styles.card} ${selected ? styles.selected : ""}`}>
      <span className={styles.avatar}>{initials(p.nome)}</span>
      <span className={styles.area}>{p.areaAtuacao}</span>
      <h3>{p.nome}</h3>
      <RatingLabel rating={p.avaliacao} />
      <p>
        {p.quantidadeServicos}{" "}
        {p.quantidadeServicos === 1
          ? "serviço disponível"
          : "serviços disponíveis"}
      </p>
      <div className={styles.cardFooter}>
        <span>
          A partir de<strong>{requestMoney(p.precoInicial)}</strong>
        </span>
        <Link
          href={href}
          scroll={false}
          aria-current={selected ? "true" : undefined}
          aria-label={`Ver detalhes de ${p.nome}`}
        >
          Ver detalhes <HomeIcon name="arrow" size={17} />
        </Link>
      </div>
    </article>
  );
}
