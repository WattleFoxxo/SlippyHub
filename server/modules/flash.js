var Avrgirl = require('avrgirl-arduino');

var avrgirl = new Avrgirl({
    board: process.argv[2],
    path: process.argv[3]
});

console.log('FLASH START');

avrgirl.flash(__dirname + '/../uploads/firmware.hex', function (error) {
    if (error) {
        console.error(error);
    } else {
        console.log('FLASH DONE');
    }
});
