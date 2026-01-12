'use client'
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import Button from '../Button';
import styles from './index.module.scss';

type ConfirmConfig = {
  message: string;
  resolve: (result: boolean) => void;
};

type ConfirmFunction = (message: string) => Promise<boolean>;

let confirmFunction: ConfirmFunction | null = null;

export const confirmWithModal: ConfirmFunction = (message: string): Promise<boolean> => {
  if (confirmFunction) {
    return confirmFunction(message);
  }
  return Promise.resolve(false);
};

export default function ConfirmationModal() {
  const t = useTranslations("HomePage");
  const [config, setConfig] = useState<ConfirmConfig | null>(null);

  const handleConfirm = useCallback(() => {
    config?.resolve(true);
    setConfig(null);
  }, [config]);

  const handleCancel = useCallback(() => {
    config?.resolve(false);
    setConfig(null);
  }, [config]);

  useEffect(() => {
    confirmFunction = (message: string): Promise<boolean> => {
      return new Promise<boolean>((resolve) => {
        setConfig({ message, resolve });
      });
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && config) {
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      confirmFunction = null;
    };
  }, [config, handleCancel]);

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
