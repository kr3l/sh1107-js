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

### Even cooler stuff

Couple the display with the ```pureimage``` library (https://www.npmjs.com/package/pureimage) to draw on it like it was an html canvas.

```js
const SH1107 = require('sh1107-js');
const PImage = require('pureimage');

async function render(sh1107, canvas, buffer) {
    for (let index = 0; index < canvas.height * canvas.width; index += 1) {
        const r = canvas.data[index * 4 + 0];
        buffer[index] = (r === 0 ? 0 : 1);
    }
    await sh1107.drawBitmap(buffer);
}

async function main() { 
    const sh1107 = new SH1107({
        width: 128,
        height: 128,
        i2c: new I2c(),
        address: 0x3C,
    });
    
    await sh1107.initialize();
    sh1107.buffer.fill(0x00);
    await sh1107.update();
    
    // init pureimage
    const canvas = PImage.make(128,128);
    
    // load font
    // Note: you can e.g. also load Font Awesome ttf to render icons
    // Note2: I tried loading multiple fonts but this doesn't seem to work
    var sourceSansPro = PImage.registerFont('fonts/SourceSansPro-Regular.ttf','SourceSansPro');
    const fontLoaded = new Promise((resolve, reject) => {
        sourceSansPro.load((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
    await fontLoaded;
    
    const buffer = Buffer.alloc(canvas.width * canvas.height);
    const ctx = canvas.getContext('2d');
    
    // draw stuff using familiar html5 canvas syntax
    ctx.font = "16pt 'SourceSansPro'";
    ctx.fillStyle = '#000000';
    ctx.fillRect(0,0,128,128);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`hello world!`, 0, 95);

    // render canvas to sh1107
    await render(sh1107, canvas, buffer);
}

main();
```

## Reference

* https://github.com/stheine/sh1106-js
* https://github.com/noopkat/oled-js