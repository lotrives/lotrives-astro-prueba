---
title: "Card testing: el fraude que no necesita que el titular se equivoque"
description: "Un cargo mínimo en una tarjeta jamás usada revela cómo se generan y validan los números que la identifican antes de emplearla para robar."
pubDate: 2026-08-03
author: "José Manuel Grau Navarro"
tags: ["Fraudes", "Abusos", "Tarjetas de crédito", "Ciberseguridad", "Banca digital"]
heroImage: "/assets/images/probar-tarjeta-hero.webp"
---

![Dos tarjetas bancarias, Visa y Mastercard, con los números en relieve](/assets/images/probar-tarjeta-hero.webp)

<p class="pie-foto">Foto: Lotus Head, Wikimedia Commons (<a href="https://creativecommons.org/licenses/by-sa/2.5">CC BY-SA 2.5</a>), recortada y convertida a WebP. <a href="https://commons.wikimedia.org/w/index.php?title=File:Credit-cards_(cropped).jpg&oldid=1022568425">Original</a>.</p>


Hoy me ha llegado un cargo de 0,34 euros contra una tarjeta de crédito que nunca he usado: ni una sola vez desde que la entidad la emitió a mi nombre. La tenía de reserva. No estaba registrada en ninguna tienda web, con ella no había sacado nunca dinero y la tarjeta física nunca había salido de casa. Nunca es nunca.

El cargo procedía de una plataforma de internet donde esa tarjeta no figuraba entre mis métodos de pago guardados, como se deduce del párrafo anterior.

Nada más llegar la notificación a mi aplicación del móvil, he denunciado el movimiento a mi banco. Han bloqueado la tarjeta, han abierto el procedimiento de devolución y la plataforma de comercio electrónico ha reconocido que alguien ha usado la tarjeta mía con intenciones aviesas.

Para establecer una tarjeta como medio de pago en una tienda *online* hacen falta tres datos:

1. El número de la tarjeta.
2. Su fecha de caducidad.
3. Su código de verificación (CVV).

Que alguien reúna los tres sin que yo haya usado nunca la tarjeta, ni *online* ni presencial, parece magia.

He estado investigando y, al parecer, no lo es tanto.

## *Card testing*

Los primeros dígitos de cualquier tarjeta son información pública. Es el BIN (Bank Identification Number), el número de identificación del banco (emisor). El atacante genera el resto del número. El algoritmo que rige la estructura de los números de tarjeta, el [algoritmo de Luhn](https://es.wikipedia.org/w/index.php?title=Algoritmo_de_Luhn&oldid=169437299), permite descartar la mayoría de combinaciones inválidas antes de probarlas, lo que reduce considerablemente la búsqueda. Lo mismo ocurre con la fecha de caducidad y el CVV. Así que, con fuerza bruta, y algunas pruebas, los ladrones lo consiguen. Véase Eaton & Vinson (2025) y Banco de España (2023).

Antes de intentar una compra grande con una tarjeta que se empleará fraudulentamente, los delincuentes suelen verificarla. La práctica se llama *card testing*. Consiste en lanzar cargos mínimos, muchas veces por debajo de un euro, en comercios *online* de facturación rápida. Los importes se mantienen bajos a propósito para que el titular no los note ni los denuncie. De esa manera, el ladrón gana tiempo. Si el cargo pasa, el atacante sabe que la tarjeta está activa y es válida. Véase Emewulu (2026) y Palmer (2025). 

Hay un caso ampliamente documentado. Tesco Bank, una entidad británica, sufrió entre 2015 y 2016 una oleada de intentos automatizados que llevó a la sustracción de 22 millones de libras de 20 000 tarjetas, y obligó a suspender los pagos con tarjeta durante 48 horas. Véase Puzin (2025).

## Sin negligencia alguna

Nada de esto depende de que el titular haya hecho algo mal, Lotrives en este caso. No ha pinchado en un enlace de *phishing* (mensaje electrónico fraudulento), ni utilizado una contraseña débil, ni comprado en una web insegura. 

El ataque no se dirige contra la persona: se dirige contra el propio sistema de validación de pagos.

## Conclusiones

1. El BIN está muy mal hecho y los emisores tendrían que tomar nota ya y cambiarlo.
2. La plataforma, el banco y no sé quién más tendrían que indemnizarme por la hora de trabajo que he perdido debido a circunstancias de las que no soy responsable y ellos sí.

---


### Bibliografía


Emewulu, Tom-Chris. (2026, 9 de abril). [Card Testing Attacks: How They Work and How to Prevent Them](https://www.chargeflow.io/chargebacks-101/card-testing). Chargeflow.

Palmer, Shelley. (2025, 26 de agosto). [How Fraudsters Conduct Card Testing Scams Using Your Checkout System](https://chargebacks911.com/ecommerce-fraud/card-testing/common-card-testing-tactics/). Chargebacks911.

Eaton, Dustin J., CFE & Vinson, Marcus. (2025, 1 de mayo). [The evolution of PAN enumeration attacks: Tackling a growing threat to payment security](https://www.acfe.com/fraud-magazine/all-issues/issue/article?s=2025-mayjune-evolution-pan-enumeration-attacks). *Fraud Magazine*. A publication of the Association of Certified Fraud Examiners (ACFE).

Puzin, Sergei. (2025, 11 de marzo). [How hackers steal your card details: BIN attacks protection tips](https://www.financealliance.io/how-hackers-steal-your-card-details-bin-attacks-protection-tips/). Finance Alliance.

Portal Cliente Bancario. (2023, 16 de mayo). [¿Sabes qué significan los números de tu tarjeta?](https://clientebancario.bde.es/pcb/es/blog/sabes-que-significan-los-numeros-de-tu-tarjeta-.html). Banco de España.