import styles from './Card.module.scss'

export default function Card({object, onClick}: any) {
    return (
        <div className={styles.container}
        onClick={() => onClick()}
        >
            <p>
                {object.name}
            </p>
            <img src={object.image}/>
            <p>
                {object.count}
            </p>
        </div>
    )
}