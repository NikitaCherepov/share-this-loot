import { makeAutoObservable } from "mobx";
import { v4 as uuidv4 } from 'uuid';

export default class CardStore {
    name;
    image;
    id = uuidv4();
    type;


    constructor(params) {
        Object.assign(this, params);
        makeAutoObservable(this);
    }
}