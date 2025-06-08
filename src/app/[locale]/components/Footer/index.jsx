import styles from './Footer.module.scss'
import { useTranslations } from "next-intl"

export default function Footer() {
    const t = useTranslations("HomePage")
    return (
        <div className={styles.container}>
            <p>{t("made_by")} <a href="https://ncherepov.ru/" className={`${styles.stylishLink}`} target='_blank'>Nikita Cherepov</a></p>
        </div>
    )
}