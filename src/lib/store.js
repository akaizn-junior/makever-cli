//********************************
// STORE - A very simple storage
//********************************

const fs = require('fs');
const path = require('path');

//the path of the file used as storage
const storePath = path.join(__dirname, '.store');

const Store = {
    get: () => {
        const data = fs.readFileSync(storePath, err => {
            if(err) throw err;
        });
        return {
            items: data.toString().split(',')
        };
    },
    save: value => {
        fs.writeFileSync(storePath, value, err => {
            if(err) throw err;
        });
    },
    create: () => {
        if(!fs.existsSync(storePath)) {
            //create
            fs.createWriteStream(storePath);
        }
    }
};

//Creates the storage if does not exist
Store.create();

module.exports = Store;
