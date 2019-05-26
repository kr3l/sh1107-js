# sh1107-js
nodejs library for sh1107 displays

It uses sh1106-js as a starting point and overwrites some methods.

## Interface

The interface is similar to the excellent sh1106-js library. The only difference 
is this library accepts an i2c object (I use raspi-i2c).

If you prefer another i2c library, the only method the i2c object should 
expose is a write method

```js
i2c.write(address, register, buffer, callback)
```

### Example

```js
const I2C = require('raspi-i2c').I2C;
const SH1107 = require('sh1107-js');

async function main () { 
    const sh1107 = new SH1107({
        width: 128,
        height: 128,
        i2c: new I2C(),
        address: 0x3C
    });
    
    await sh1107.fillRect(17,75,100,10,'WHITE');
    
    await sh1107.writeString(17, 75, font, 'ROBOTS ARE HERE', 'BLACK');
}

main();
```

### Other cool stuff

Circles, rectangles, writing text, drawing bitmaps, ... 

See https://github.com/stheine/sh1106-js

## Reference

* https://github.com/stheine/sh1106-js
* https://github.com/noopkat/oled-js