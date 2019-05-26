const REG_CMD = 0x00;
const REG_DATA = 0x40;

const SH1106 = require('sh1106-js');

class SH1107 extends SH1106 {
    constructor(opts) {
        if (!opts.rpio) {
            // SH1106 expects rpio, while this library uses raspi-i2c
            opts.rpio = {
                i2cBegin() {},
                i2cSetSlaveAddress(addr) {},
                i2cSetBaudRate() {},
                i2cWrite(buffer) {}
            };
        }
        super(opts);
        this.opts = opts;
        this.i2c = opts.i2c;
        this.address = opts.address || 0x3C;
    }

    async initialize () {
        // sequence of bytes to initialize with
        // the numbers in the comments refer to the table in the datasheet
        // mostly we set everything to the defaults here
        const initSeq = this.opts.initSeq || [
            // 11. Display OFF/ON
            // Turns on OLED panel (1) or
            // turns off (0). (POR = AEH which is OFF, use 0xAF for ON)
            0xAE,

            // 14. Set Display Divide
            // Ratio/Oscillator
            // Frequency Mode
            // This command is used to set
            // the frequency of the internal
            // display clocks.
            // First D5, then (POR = 50H)
            0xd5,
            0x50,

            // 1. Sets 4 lower bits of column address of
            // display RAM in register. (POR = 00H)
            0x00,

            // 2. Sets 4 higher bits of column address
            // of display RAM in register. (POR = 10H)
            0x10,

            // 3.Set memory addressing mode to Page
            // Addressing Mode (POR=20H)
            0x20,

            // 4. The Contrast Control Mode Set (double bytes,
            // 0x81, then contrast POR=80H)
            0x81,
            0x80,

            // 5. Set Segment Remap down rotation (POR A0H)
            0xa0,

            // 6. This command switches multiplex mode to any multiplex ratio
            // from 1 to 128. (POR = 7FH )
            0xA8,
            0x7F,

            // 7. Set Entire Display OFF/ON to OFF (POR A4H).
            // Entire display on is an option, we disable it here.
            0xa4,

            // 8. Set Normal Reverse Display to Normal
            // indication (POR A6H)
            0xa6,

            // 9. Set display offset
            // This is a double byte
            // command that specifies the
            // mapping of display start line
            // to one of COM0 -127. (POR
            // = 00H)
            0xd3,
            0x00,

            // 10. DC-DC Control
            // Mode Set
            // DC-DC Setting
            // Mode Set
            0xAD,
            0x81,

            // 12. Set Page Address
            // Specifies page address to
            // load display RAM data to
            // page address register. (POR
            // = B0H)
            0xB0,

            // 13 Set Common
            // Output Scan
            // Direction
            //
            // Scan from COM0 to COM [N
            // - 1] (0) or Scan from COM [N
            // -1] to COM0 (1). (POR = C0H)
            0xc0,

            // 15.
            // Dis-charge / Pre-charge Period Mode Set
            // Dis-charge /Pre-charge Period Data Set
            // This command is used to set
            // the duration of the
            // dis-charge and pre-charge
            // period. (POR = 22H)
            //
            // Double bytes, first D9, then POR 22H
            0xd9,
            0x22,

            // 16.
            // VCOM Deselect Level Mode Set
            // VCOM Deselect Level Data Set
            //
            // First DB, then POR 35H
            0xdb,
            0x35,

            // 17. Set Display Start Line
            //
            // First DC, then POR 00
            0xdc,
            0x00,

            // 18. Read-Modify-Write
            // Read-Modify-Write start.
            // E0

            // 19. End
            // EE

            // 20. NOP
            // E3

            0xAF
        ];

        await this._transferCmd(initSeq);
        await this.clearDisplay(true);
    }

    async _transferCmd(cmds) {
        if(typeof cmds === 'number') {
            cmds = [cmds];
        }

        await this.write(REG_CMD, Buffer.from(cmds));
    }

    async _transferData(bufferData) {
        // we can't write everything at once, at most DATA_SIZE bytes per
        // write call can be sent
        for (let i = 0; i < bufferData.length; i += this.DATA_SIZE) {
            await this.write(
                REG_DATA,
                bufferData.slice(
                    i,
                    Math.min(bufferData.length, i + this.DATA_SIZE)
                )
            );
        }
    }
    async write (register, buffer) {
        return new Promise((resolve, reject) => {
            this.i2c.write(this.address, register, buffer, function (err) {
                if (err === null) {
                    resolve();
                    return;
                }
                reject(err);
            });
        });
    }

    async setPage(yoffset) {
        await this._transferCmd(0xb0+yoffset);
    }

    async setColumn(xoffset) {
        var high4bits = 0x10 + ((xoffset & 0xf0) >> 4);
        var low4bits = (xoffset & 0x0f);
        await this._transferCmd(low4bits);
        await this._transferCmd(high4bits);
    }

    async setPosition(xoffset, yoffset) {
        await this.setPage(yoffset);
        await this.setColumn(xoffset);
    }

    async update(startPage = 0, endPage = this.MAX_PAGE_COUNT - 1) {
        for (let page = startPage; page <= endPage; page += 1) {
            // tell display we will be writing data for this page, starting
            // from column 0
            await this.setPosition(0, page);

            // write one page of data
            const start = page * this.WIDTH;
            const end = start + this.WIDTH;
            const slice = this.buffer.slice(start, end);

            await this._transferData(slice);
        }

        // now that all bytes are synced, reset dirty state
        this.dirtyBytes = [];
    }
}

module.exports = SH1107;