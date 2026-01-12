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
import ConfirmationModal, { confirmWithModal } from "./components/ConfirmationModal"

const Home = observer(() => {
  const t = useTranslations("HomePage")
  const [modal, setModal] = useState(false);
  const [update, setUpdate] = useState();
  const [copySuccess, setCopySuccess] = useState('');

  const toggleModal = () => {
    if (modal) {
      setObject(undefined);
    }
    setModal((prev) => !prev)
  }

  const handleShare = async () => {
    if (typeof window === 'undefined') return;

    const encodedData = inventoryStore.encodeState();
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(t('copied') || 'Ссылка скопирована!');
      setTimeout(() => setCopySuccess(''), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setCopySuccess('Ошибка при копировании');
      setTimeout(() => setCopySuccess(''), 3000);
    }
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
        const loadFromURL = async () => {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const shareData = params.get('data');

                if (shareData) {
                    inventoryStore.load();

                    const hasData = inventoryStore.commonInventory.length > 0 || inventoryStore.playerCounter > 0;

                    if (hasData) {
                        const shouldOverwrite = await confirmWithModal(t('overwrite_data_warning'));
                        if (shouldOverwrite) {
                            inventoryStore.loadFromShare(shareData);
                        }
                    } else {
                        inventoryStore.loadFromShare(shareData);
                    }

                    setTimeout(() => {
                    window.history.replaceState({}, '', window.location.pathname);
                    }, 10)
                }
                else {
                  inventoryStore.load();
                }
            }
        };

        loadFromURL();
  }, [])

  const [object, setObject] = useState();

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {modal && <Modal key="modal" state={modal} onClose={() => toggleModal()} object={object}/>}
        <ConfirmationModal />
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

      <Button text={'distribute'} onClick={() => {
        fetch('/api/distribute', { method: 'POST' })
        .then(r => r.json())
        .then(() => fetch('/api/visit'))
        .then(r => r.json())
        inventoryStore.distributeCoins()}}/>

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

      <div className={`column-block`} style={{ marginTop: '20px' }}>
        <Button text={'share'} onClick={handleShare} />
        {copySuccess && <p style={{ marginTop: '10px', color: '#4CAF50' }}>{copySuccess}</p>}
      </div>
    </div>
  )
})

export default Home;
