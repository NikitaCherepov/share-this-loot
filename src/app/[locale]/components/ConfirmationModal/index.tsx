'use client'
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Button from '../Button';
import styles from './index.module.scss';

let confirmFunction = null;

export const confirmWithModal = (message) => {
  if (confirmFunction) {
    return confirmFunction(message);
  }
  return Promise.resolve(false);
};

export default function ConfirmationModal() {
  const t = useTranslations("HomePage");
  const [config, setConfig] = useState(null);

  useEffect(() => {
    confirmFunction = (message) => {
      return new Promise((resolve) => {
        setConfig({ message, resolve });
      });
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape' && config) {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      confirmFunction = null;
    };
  }, []);

  const handleConfirm = () => {
    config?.resolve(true);
    setConfig(null);
  };

  const handleCancel = () => {
    config?.resolve(false);
    setConfig(null);
  };

  return (
    <AnimatePresence>
      {config && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={styles.overlay}
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.content}>
              <h2>{t('confirm_title')}</h2>
              <p>{config.message}</p>

              <div className={styles.buttons}>
                <Button
                  text={t('no')}
                  onClick={handleCancel}
                  color={'#666'}
                />
                <Button
                  text={t('yes')}
                  onClick={handleConfirm}
                  color={'#CC0000'}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
