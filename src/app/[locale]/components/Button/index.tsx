import styles from './Button.module.scss'
import { useTranslations } from "next-intl"

interface ButtonProps {
    text: string,
    onClick: () => void,
    color?: string;
    maxWidth? : string,
    background? : string,
    type?: 'button' | 'submit' | 'reset' | undefined
}

export default function Button({text, onClick, background, color, maxWidth, type = 'button'}: ButtonProps) {
    const t = useTranslations("HomePage")

    return (
        <button type={type} style={{...(color && { color }),...(maxWidth && { maxWidth }),...(background && {background: background })}} 
        className={styles.container}
        onClick={() => onClick()}
        >
            {t.has(text) ? t(text) : text}
        </button>
    )
}