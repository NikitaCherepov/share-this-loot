'use client'
import styles from './Card.module.scss'
import { useTranslations } from "next-intl"

export default function Card({object, onClick}: any) {
    const t = useTranslations("HomePage")
    return (
        <div className={styles.container}
        onClick={() => onClick()}
        >
            <p>
                {t.has(object.name) ? t(object.name) : t(object.name)}
            </p>
            <img src={object.image}/>
            <p>
                {object.count}
            </p>
        </div>
    )
}