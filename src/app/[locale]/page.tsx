'use client'
import { useTranslations } from "next-intl"
import styles from './page.module.scss'
import Button from "./components/Button"
import CheckBoxYN from "./components/CheckBoxYN"
import { observer } from "mobx-react-lite"
import {inventoryStore} from '../stores/inventoryStore'
import Card from "./components/Card"
import { v4 as uuidv4 } from 'uuid';

import {AnimatePresence, motion} from 'framer-motion'

import { useState, useEffect } from "react"
import Modal from "./components/Modal/Modal"

const Home = observer(() => {
  const t = useTranslations("HomePage")
  const [modal, setModal] = useState(false);
  const [update, setUpdate] = useState();

  const toggleModal = () => {
    if (modal) {
      setObject(undefined);
    }
    setModal((prev) => !prev)
  }

  useEffect(() => {
    const wasHere = inventoryStore.checkAndMarkVisit();

    if (wasHere) {
      fetch('/api/visit', { method: 'POST' })
        .then(r => r.json())
        .then(() => fetch('/api/visit'))
        .then(r => r.json())
    }

  }, [])

  useEffect(() => {
        inventoryStore.load();
  }, [])

  const [object, setObject] = useState();

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {modal && <Modal key="modal" state={modal} onClose={() => toggleModal()} object={object}/>}
      </AnimatePresence>


      <div className={`column-block`}>
        <h1>
          {t("loot_distribution")}
        </h1>
        <Button text={'add'} onClick={() => toggleModal()}/>
        <Button color={'#CC0000'} text={'clear_list'} onClick={() => inventoryStore.clear(t('clear_all'))}/>
      </div>

      <div className={styles.list}>
        {inventoryStore.commonInventory.map((o: any) => 
        (
          <Card key={o.id} onClick={() => {setObject(o); toggleModal()}} object={o}/>
        )
        )}
      </div>

      <div className={`column-block`}>
        <h2>
          {t("distribution_block")}
        </h2>
        <h3>{t('participants_count')}</h3>
        <div className={`row-block`}>
          <Button text={'-'} onClick={() => {inventoryStore.playerDecrement()}} maxWidth={'80px'}/>
          <input className={`input`} disabled value={inventoryStore.playerCounter} style={{maxWidth:'60px'}}/>
          <Button text={'+'} onClick={() => {inventoryStore.playerIncrement()}} maxWidth={'80px'}/>
        </div>
        <div className={`row-block`}>
          <h3>{t("only_coins_question")}</h3>
          <CheckBoxYN state={inventoryStore.onlyCoins} onClick={() => inventoryStore.toggleOnlyCoins()} maxWidth={'80px'}/>
        </div>
      </div>

      <Button text={'distribute'} onClick={() => inventoryStore.distributeCoins()}/>

      <div className={`column-block ${styles.finals}`}>
        <h2>{t("total")}</h2>

        {
          inventoryStore.players.map((player, index) => (  
          <div key={Math.random()} className={styles.finals__block}>
            <p><b>{t("player")} {index + 1}</b>:</p>
            {Object.entries(player.coins).map(([coinType, amount]) => {
              if (amount as number> 0) return (<p key={Math.random()}>
                - {amount as number} {t(coinType)} {t("coin")}
              </p>)
            })}
            {
              player.items.map((item: any) => (
                <p key={Math.random()}>- {item.count} {item.name}</p>
              ))
            }

            <p><strong>{t("sum_total")} </strong><br/> {player.total.toFixed(2)} {t("gold_total")}</p>
          </div>
          ))
        }
      </div>
      <div className={`column-block ${styles.finals}`}>

        <h2>{t("remainder")}</h2>


        {Object.entries(inventoryStore.remainder).map(([coinType, amount]) => {
          if (amount as number> 0) return (<p key={Math.random()}>
            {amount as number} {t(coinType)} {t("coin")}
          </p>)
        })}

        {
          inventoryStore.remainderOthers?.map((item) => (
            <p key={Math.random()}>{item.count} {item.name}</p>
          ))
        }

        {inventoryStore.commonInventory
          .filter(item => item.type === 'coins' && item.includeInDistribution === false).length > 0 && (
            <>
              <h2>{t("not_distributed_coins")}</h2>
              {inventoryStore.commonInventory
                .filter(item => item.type === 'coins' && item.includeInDistribution === false)
                .map((item, idx) => (
                  <p key={item.coinType + '_' + idx}>
                    {item.count} {t(item.coinType)} {t("coin")}
                  </p>
                ))}
            </>
        )}

        {inventoryStore.commonInventory
          .filter(item => item.type !== 'coins' && item.includeInDistribution === false).length > 0 && (
            <>
              <h2>{t("not_distributed_items")}</h2>
              {inventoryStore.commonInventory
                .filter(item => item.type !== 'coins' && item.includeInDistribution === false)
                .map((item, idx) => (
                  <p key={item.name + '_' + idx}>
                    {item.count} {item.name}
                  </p>
                ))}
            </>
        )}


      </div>
    </div>
  )
})

export default Home;
