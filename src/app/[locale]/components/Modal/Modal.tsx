'use client'

import Button from '../Button'
import Input from '../Input'
import styles from './Modal.module.scss'
import { useTranslations } from "next-intl"
import {AnimatePresence, motion} from 'framer-motion'
import {useForm} from 'react-hook-form'
import {inventoryStore} from '@/app/stores/inventoryStore'

import { useState, useEffect } from 'react'
import CheckBoxYN from '../CheckBoxYN'

interface ModalProps {
    state: boolean,
    onClose: () => void,
    object?: any
}

export default function Modal({state, onClose, object}: ModalProps){

    const t = useTranslations("HomePage")

    const { register, handleSubmit, watch, reset, setValue } = useForm({
        defaultValues: {
        type: "",
        coinType: "",
        name: "",
        count: "",
        cost: "",
        includeInDistribution: true
        }
    });
    const type = watch("type");
    const includeInDistribution = watch("includeInDistribution");

    const onSubmit = (data:any) => {
        if (type) {
        if (object) {
            inventoryStore.change(data, object.id);
        }
        else {
            inventoryStore.create(data);
        }
        onClose();
    }
    };

    const [id, setId] = useState();

    useEffect(() => {
        if (object) {
            reset(object);
            console.log(object)
        }
    }, [object, reset])

    return (
    <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        transition={{ duration: 0.2 , type: 'tween'}}
        layout={true}
        className={`${styles.container}`}>
            <form onSubmit={handleSubmit(onSubmit)} className={`column-block ${styles.content}`}>
                <h2>{t("select_type")}</h2>
                <div className={`row-block`}>
                    <Button background={type === 'coins' ? '#EBDFBF' : 'rgba(235, 223, 191, 0.3)'}  text={'coins'} onClick={() => {setValue("type", "coins"); setValue("cost", "0")}}/>
                    <Button background={type === 'other' ? '#EBDFBF' : 'rgba(235, 223, 191, 0.3)'} text={'other'} onClick={() => setValue("type", "other")}/>
                </div>
                { type === 'other' && (
                    <input 
                      {...register('name', {
                        validate: value =>
                        type === 'other'
                            ? value.trim() !== '' || t("enter_name")
                            : true
                    })}
                    className={styles.input} placeholder={t("enter_name")}/>
                )}

                {type === 'coins' && (
                    <select defaultValue={''} className={styles.input} 
                      {...register("coinType", {
                        validate: (value, formValues) =>
                        formValues.type === "coins"
                            ? value !== ""
                            ? true
                            : t("select_coin")
                            : true
                    })}
                    >
                        <option disabled value="">{t("select_coin")}</option>
                        <option value="copper">{t("copper")}</option>
                        <option value="silver">{t("silver")}</option>
                        <option value="electrum">{t("electrum")}</option>
                        <option value="gold">{t("gold")}</option>
                        <option value="platinum">{t("platinum")}</option>
                    </select>
                )}

                {(type === 'coins' || type === 'other') && (
                    <input
                      {...register('count', {
                        required: t("enter_count"),
                        valueAsNumber: true, // превращает строку в число
                        validate: (value) =>
                        typeof value === "number" && value > 0 || t("must_be_positive")
                    })}
                    className={styles.input} type="number" placeholder={t("enter_count")}/>
                )}
                {type === 'other' && (
                    <input 
                    type="number"
                    {...register('cost', {
                        required: t("enter_count"),
                        valueAsNumber: true, // превращает строку в число
                        validate: (value) =>
                        typeof value === "number" && value >= 0
                    })}
                    className={styles.input} placeholder={t("enter_cost")}/>
                )}

                {(type === 'coins' || type === 'other') && (
                    <div className={`row-block checkbox-block`}>
                        <p>{t('include_in_distribution')}</p>
                        <CheckBoxYN state={includeInDistribution} onClick={() => setValue("includeInDistribution", !includeInDistribution)} maxWidth={'60px'}/>
                    </div>
                )}

                <div className={`column-block ${styles.buttons}`}>

                    <Button background={'#EBDFBF'} text={'save'} type="submit" onClick={() => {}} color={'#00A727'}/>

                    <Button background={'#EBDFBF'} text={'close'} onClick={() => onClose()} color={'#CC0000'}/>

                    {object?.id && (
                        <Button background={'#EBDFBF'} text={'delete'} onClick={() => {inventoryStore.remove(object); onClose();}} color={'#CC0000'}/>
                    )}
                </div>
            </form>
        </motion.div>
    )
}