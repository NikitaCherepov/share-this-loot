import { makeAutoObservable, autorun, toJS, runInAction  } from "mobx";
import CardStore from './CardStore'

class InventoryStore {
    commonInventory = [
    ]

    playerCounter = 0;

    players = []
    remainder = [];
    onlyCoins = true;

    storeLoad = false;

    COIN_RATES = {
    copper: 0.01,    // Copper (1/100)
    silver: 0.1,     // Silver (1/10)
    electrum: 0.5,     // Electrum (1/2)
    gold: 1,       // Gold (основная)
    platinum: 10       // Platinum (10 gp)
    };


    constructor() {
        makeAutoObservable(this,
                { load: /* помечаем как action */ true },
    { autoBind: true }
        );
    }

    /** ────── LOCAL STORAGE ────── */
    LS_KEY = "dnd-common-inventory";

    /** грузим один-раз, только на клиенте */
    load() {
        if (typeof window === "undefined") return;
        const raw = localStorage.getItem(this.LS_KEY);
        if (!raw) return;
        try {
        const parsed = JSON.parse(raw);
        runInAction(() => {
            this.commonInventory = parsed.commonInventory ?? [];
            this.playerCounter = parsed.playerCounter ?? 0;
        });
        } catch {
        localStorage.removeItem(this.LS_KEY);
        }}

    save() {
        if (typeof window === "undefined") return;
        localStorage.setItem(
        this.LS_KEY,
        JSON.stringify({
            commonInventory: toJS(this.commonInventory),
            playerCounter: this.playerCounter,
        })
        );
    }

    toggleOnlyCoins() {
        this.onlyCoins = !this.onlyCoins;
    }

    create(params) {
        const newCard = new CardStore(params);
        if (params.type === 'coins') {
            newCard.name = params.coinType;

            newCard.image = `/images/${newCard.coinType}.png`;
        }
        else {
            newCard.image = `/images/rubin.png`;
        }
        this.commonInventory.push(newCard)
        console.log(this.commonInventory)
        this.save();
    }
    change(params, id) {
        const currentCard = this.commonInventory.find(e => e.id === id);
        if (!currentCard) return;
        Object.entries(params).forEach(([key, value]) => {
            if (key !== 'id') currentCard[key] = value;
        });
        this.save();
    }


    remove(object) {
        const id = object.id;
        this.commonInventory = this.commonInventory.filter(item => item.id !== id);
        this.save();
    }

    clear() {
        this.commonInventory = [];
        this.players = [];
        this.remainder = {};
        this.save();
    }

    playerIncrement() {
        this.playerCounter += 1;
        this.save();
    }

    playerDecrement() {
        if (this.playerCounter !=0) {
            this.playerCounter -= 1;
        }
        this.save();
    }

    getLargestCoin(coins) {
        const order = ['platinum', 'gold', 'electrum', 'silver', 'copper'];
        for (const type of order) {
            if (coins[type] > 0) return type;
        }
        return null;
    }

distributeCoins() {
  /* ---------- 1. собираем монеты + «другие» ---------- */
  let totalGold = 0;
  const coins = { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 };
  const others = [];

  this.commonInventory.forEach(item => {
    if (!item.includeInDistribution) return;               // «не делить» — пропуск

    if (item.type === 'coins') {
      coins[item.coinType] += Number(item.count);
      totalGold += Number(item.count) * this.COIN_RATES[item.coinType];
    } else {
      others.push({
        name : item.name,
        count: Number(item.count),
        value: Number(item.cost)
      });
      totalGold += Number(item.count) * Number(item.cost);
    }
  });

  /* ---------- 2. подготовка игроков ---------- */
  const n      = Math.max(this.playerCounter, 1);
  const share  = Math.floor((totalGold / n) * 100) / 100;

  const players = Array.from({ length: n }, () => ({
    coins : { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
    items : [],
    total : 0
  }));

  /* ---------- 3. СНАЧАЛА раздаём предметы (other) ---------- */
  if (!this.onlyCoins) {
    others.sort((a, b) => b.value - a.value);                 // дорогие вперёд

    for (const obj of others) {
        let left = obj.count;

        while (left > 0) {
        // ищем игрока с минимальным total, куда предмет поместится
        let idx = -1, minTotal = Infinity;
        for (let i = 0; i < n; i++) {
            const next = players[i].total + obj.value;
            if (next <= share && players[i].total < minTotal) {
            idx = i;
            minTotal = players[i].total;
            }
        }
        if (idx === -1) break;                                // предмет больше никому не влезает

        const existing = players[idx].items
            .find(it => it.name === obj.name && it.value === obj.value);

        if (existing) {
            existing.count += 1;
        } else {
            players[idx].items.push({ name: obj.name, value: obj.value, count: 1 });
        }
        players[idx].total += obj.value;
        left--;
        }
        obj.remainder = left;                                   // сколько не выдали
    }
    }
    else {
    // Если предметы вообще не раздавались, значит весь others = остаток
    others.forEach(obj => {
        obj.remainder = obj.count;
    });
    }


  /* ---------- 4. теперь раздаём монеты, не превышая share ---------- */
  const ORDER = ['platinum', 'gold', 'electrum', 'silver', 'copper'];

  ORDER.forEach(type => {
    while (coins[type] > 0) {
      let idx = -1, minTotal = Infinity;
      for (let i = 0; i < n; i++) {
        const next = players[i].total + this.COIN_RATES[type];
        if (next <= share && players[i].total < minTotal) {
          idx = i;
          minTotal = players[i].total;
        }
      }
      if (idx === -1) break;                                // больше никому не влезает
      players[idx].coins[type] += 1;
      players[idx].total      += this.COIN_RATES[type];
      coins[type]--;
    }
  });

  /* ---------- 5. сохраняем и возвращаем ---------- */
  this.players          = players;
  this.remainder        = coins;
  this.remainderOthers  = others
    .filter(o => o.remainder > 0)
    .map(o => ({ name: o.name, value: o.value, count: o.remainder }));

  return {
    players,
    coinRemainder : coins,
    itemRemainder : this.remainderOthers
  };
}





}

export const inventoryStore = new InventoryStore();