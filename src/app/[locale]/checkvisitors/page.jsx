'use client'
import { useState, useEffect } from "react";

export default function checkVisitors() {
    const [counter, setCounter] = useState(null);
    const [distribute, setDistribute] = useState(null);

  useEffect(() => {
    fetch('/api/visit', { method: 'GET' })
      .then(r => r.json())
      .then(() => fetch('/api/visit'))
      .then(r => r.json())
      .then(data => setCounter(data.count));
  }, []);

  useEffect(() => {
    fetch('/api/distribute', { method: 'GET' })
      .then(r => r.json())
      .then(() => fetch('/api/distribute'))
      .then(r => r.json())
      .then(data => setDistribute(data.count));
  }, []);



    return (
      <div>
        <p style={{width: '100%', textAlign: 'center'}}>
            Счётчик посетителей:
            {counter}
        </p>
        <p style={{width: '100%', textAlign: 'center'}}>
            Количество нажатий на кнопку "распределить":
            {distribute}
        </p>
      </div>
    )
}