import type { Professional } from "../../types/HomeTypes";
import styles from "../../styles/home-page.module.css";
const portraits = [
  "rafael",
  "camila",
  "marcos",
  "juliana",
  "pedro",
  "beatriz",
  "lucas",
  "ana",
  "bruno",
];
export default function ProfessionalAvatar({
  professional,
}: {
  professional: Professional;
}) {
  const index = portraits.indexOf(professional.id);
  return (
    <span
      className={styles.avatar + " " + styles.portrait}
      role="img"
      aria-label={"Retrato fictício de " + professional.name}
      style={{
        backgroundPosition: `${(index % 3) * 50}% ${Math.floor(index / 3) * 50}%`,
      }}
    />
  );
}
