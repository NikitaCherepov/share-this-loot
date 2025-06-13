'use client'
import { useState, useEffect } from "react";

export default function checkVisitors() {
    const [counter, setCounter] = useState(null);

  useEffect(() => {
    fetch('/api/visit', { method: 'GET' })
      .then(r => r.json())
      .then(() => fetch('/api/visit'))
      .then(r => r.json())
      .then(data => setCounter(data.count));
  }, []);



    return (
        <p style={{width: '100%', textAlign: 'center'}}>
            Счётчик посетителей:
            {counter}
        </p>
    )
}