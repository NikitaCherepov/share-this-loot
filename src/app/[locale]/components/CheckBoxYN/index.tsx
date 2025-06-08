import styles from './CheckBoxYN.module.scss'
import { useTranslations } from "next-intl"

interface ButtonProps {
    state: boolean,
    onClick: () => void,
    color?: string;
    maxWidth? : string,
    background? : string,
    type?: 'button' | 'submit' | 'reset' | undefined
}

export default function CheckBoxYN({state, onClick, background, color, maxWidth, type = 'button'}: ButtonProps) {
    const t = useTranslations("HomePage")

    return (
        <button type={type} style={{...(color && { color }),...(maxWidth && { maxWidth }),...(background && {background: background })}} 
        className={styles.container}
        onClick={() => onClick()}
        >
            {state ? t('yes') : t('no')}
        </button>
    )
}