"use client";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import HomeIcon from "./HomeIcon";
import styles from "../../styles/home-page.module.css";
export default function HomeDialog({
  title,
  children,
  onDismiss,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onDismiss: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={styles.dialog + (wide ? " " + styles.wideDialog : "")}
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom
          )
            onDismiss();
        }
      }}
    >
      <div className={styles.dialogHeading}>
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          aria-label="Fechar janela"
          onClick={onDismiss}
          className={styles.iconButton}
        >
          <HomeIcon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
