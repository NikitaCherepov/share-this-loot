import styles from './Input.module.scss'
import { useTranslations } from "next-intl"

interface InputProps {
    text: string,
    onClick: () => void,
    color?: string;
    maxWidth? : string,
    type?: string
}

export default function Input({text, onClick, color, maxWidth, type='text'}: InputProps) {
    const t = useTranslations("HomePage")

    return (
        <input
        type={type}
        placeholder={t.has(text) ? t(text) : text}
        style={{...(color && { color }),...(maxWidth && { maxWidth })}} 
        className={styles.container}/>
    )
}